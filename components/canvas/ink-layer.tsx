"use client"

import * as React from "react"

const COLOR_MAP: Record<string, string> = {
  black: "#1d1d1d", grey: "#9fa8b2", "light-violet": "#e085f4",
  violet: "#ae3ec9", blue: "#4465e9", "light-blue": "#4ba1f1",
  yellow: "#f1ac4b", orange: "#e16919", green: "#099268",
  "light-green": "#4cb05e", "light-red": "#f87777", red: "#e03131",
  white: "#FFFFFF",
}

const SIZE_MAP: Record<string, number> = { xs: 0.75, s: 1.5, m: 3, l: 5, xl: 9 }

export interface InkLayerHandle {
  redraw: () => void
}

interface InkLayerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any
  isDrawing?: boolean
}

// Cache parsed points and pre-built Path2D per shape ID
interface StrokeCache {
  points: { x: number; y: number; z: number }[]
  raw: string
  path: Path2D
}
const strokeCache = new Map<string, StrokeCache>()

function buildNormalizedPath(pts: { x: number; y: number }[]): Path2D {
  const p = new Path2D()
  if (pts.length < 2) return p
  p.moveTo(pts[0].x, pts[0].y)
  if (pts.length === 2) {
    p.lineTo(pts[1].x, pts[1].y)
  } else {
    const mx1 = (pts[0].x + pts[1].x) / 2
    const my1 = (pts[0].y + pts[1].y) / 2
    p.lineTo(mx1, my1)
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2
      const my = (pts[i].y + pts[i + 1].y) / 2
      p.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
    }
    const last = pts[pts.length - 1]
    p.lineTo(last.x, last.y)
  }
  return p
}

export const InkLayer = React.forwardRef<InkLayerHandle, InkLayerProps>(
  function InkLayer({ editor, isDrawing }, ref) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rafRef = React.useRef(0)

    // Full redraw — renders all strokes at current camera position
    const drawFrame = React.useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas || !editor) return

      const dpr = window.devicePixelRatio || 1
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight

      const targetW = Math.round(w * dpr)
      const targetH = Math.round(h * dpr)
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const cam = editor.getCamera()
      const zoom = cam.z ?? 1
      const camX = cam.x
      const camY = cam.y


      // Viewport bounds in page coordinates (for culling)
      const vpLeft = -camX - 100 / zoom
      const vpTop = -camY - 100 / zoom
      const vpRight = -camX + w / zoom + 100 / zoom
      const vpBottom = -camY + h / zoom + 100 / zoom

      const shapes = editor.getCurrentPageShapes()

      let erasingIds: Set<string>
      try {
        const ids = editor.getErasingShapeIds()
        erasingIds = ids.length > 0 ? new Set(ids) : new Set()
      } catch {
        erasingIds = new Set()
      }

      for (const shape of shapes) {
        if (shape.type !== "handwrite") continue

        const sw = shape.props.w || 0
        const sh = shape.props.h || 0
        if (shape.x + sw < vpLeft || shape.x > vpRight ||
            shape.y + sh < vpTop || shape.y > vpBottom) continue

        try {
          const rawPoints = shape.props.points || "[]"
          let cached = strokeCache.get(shape.id)
          if (!cached || cached.raw !== rawPoints) {
            const points = JSON.parse(rawPoints)
            cached = { points, raw: rawPoints, path: buildNormalizedPath(points) }
            strokeCache.set(shape.id, cached)
          }
          if (cached.points.length < 2) continue

          const isErasing = erasingIds.has(shape.id)
          const isHighlighter = shape.props.penType === "highlighter"
          const color = isErasing ? "#aaaaaa" : (COLOR_MAP[shape.props.color] || shape.props.color || "#1d1d1d")
          const baseWidth = isHighlighter
            ? Math.max(SIZE_MAP[shape.props.size] || 5, 12)
            : (SIZE_MAP[shape.props.size] || parseFloat(String(shape.props.size)) || 3)

          // Check for real pressure variation
          let minZ = 1, maxZ = 0
          for (const p of cached.points) {
            const z = p.z ?? 0.5
            if (z < minZ) minZ = z
            if (z > maxZ) maxZ = z
          }
          const hasPressure = (maxZ - minZ) > 0.05

          ctx.globalAlpha = isErasing ? 0.3 : isHighlighter ? 0.35 : 1

          if (hasPressure) {
            // Pressure: Catmull-Rom sampled filled circles
            ctx.fillStyle = color
            const ox = (shape.x + camX) * zoom
            const oy = (shape.y + camY) * zoom
            const pts = cached.points

            for (let i = 0; i < pts.length - 1; i++) {
              const p0 = pts[Math.max(0, i - 1)]
              const p1 = pts[i]
              const p2 = pts[i + 1]
              const p3 = pts[Math.min(pts.length - 1, i + 2)]

              const w1 = baseWidth * (0.5 + (p1.z ?? 0.5) * 0.5) * 0.5
              const w2 = baseWidth * (0.5 + (p2.z ?? 0.5) * 0.5) * 0.5

              const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y)
              const avgR = Math.max(0.5, ((w1 + w2) / 2) * zoom)
              const steps = Math.max(2, Math.ceil(segLen * zoom / Math.max(0.5, avgR * 0.5)))

              for (let s = 0; s <= steps; s++) {
                const t = s / steps
                const tt = t * t
                const ttt = tt * t
                const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt)
                const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt)
                const r = Math.max(0.5, (w1 + (w2 - w1) * t) * zoom)

                ctx.beginPath()
                ctx.arc(ox + x * zoom, oy + y * zoom, r, 0, Math.PI * 2)
                ctx.fill()
              }
            }
          } else {
            // No pressure: single smooth path
            ctx.strokeStyle = color
            ctx.lineWidth = baseWidth * zoom
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            const ox = (shape.x + camX) * zoom
            const oy = (shape.y + camY) * zoom
            const pts = cached.points

            ctx.beginPath()
            ctx.moveTo(ox + pts[0].x * zoom, oy + pts[0].y * zoom)

            if (pts.length === 2) {
              ctx.lineTo(ox + pts[1].x * zoom, oy + pts[1].y * zoom)
            } else {
              const mx1 = (pts[0].x + pts[1].x) / 2
              const my1 = (pts[0].y + pts[1].y) / 2
              ctx.lineTo(ox + mx1 * zoom, oy + my1 * zoom)

              for (let i = 1; i < pts.length - 1; i++) {
                const mx = (pts[i].x + pts[i + 1].x) / 2
                const my = (pts[i].y + pts[i + 1].y) / 2
                ctx.quadraticCurveTo(
                  ox + pts[i].x * zoom, oy + pts[i].y * zoom,
                  ox + mx * zoom, oy + my * zoom
                )
              }

              const last = pts[pts.length - 1]
              ctx.lineTo(ox + last.x * zoom, oy + last.y * zoom)
            }
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        } catch {}
      }

    }, [editor])

    const redraw = React.useCallback(() => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        drawFrame()
      })
    }, [drawFrame])

    React.useImperativeHandle(ref, () => ({ redraw }), [redraw])

    // Redraw when shapes change
    React.useEffect(() => {
      if (!editor) return
      const unsubDoc = editor.store.listen(
        () => { if (!isDrawing) redraw() },
        { source: "all", scope: "document" }
      )
      const unsubSession = editor.store.listen(
        () => {
          if (isDrawing) return
          try { if (editor.getCurrentToolId() === "eraser") redraw() } catch {}
        },
        { source: "all", scope: "session" }
      )
      drawFrame()
      return () => { unsubDoc(); unsubSession() }
    }, [editor, drawFrame, isDrawing])

    // Force re-render on visibility change (Safari idle optimization)
    React.useEffect(() => {
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          const canvas = canvasRef.current
          if (canvas) {
            const dpr = window.devicePixelRatio || 1
            const parent = canvas.parentElement
            if (parent) {
              canvas.width = Math.round(parent.clientWidth * dpr)
              canvas.height = Math.round(parent.clientHeight * dpr)
            }
          }
          drawFrame()
        }
      }
      document.addEventListener("visibilitychange", handleVisibility)
      return () => document.removeEventListener("visibilitychange", handleVisibility)
    }, [drawFrame])

    // Clean up stroke cache periodically
    React.useEffect(() => {
      if (!editor) return
      const cleanup = () => {
        const shapeIds = new Set(editor.getCurrentPageShapes().map((s: { id: string }) => s.id))
        for (const id of strokeCache.keys()) {
          if (!shapeIds.has(id)) strokeCache.delete(id)
        }
      }
      const interval = setInterval(cleanup, 30000)
      return () => clearInterval(interval)
    }, [editor])

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          willChange: "contents",
        }}
      />
    )
  }
)
