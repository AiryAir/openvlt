"use client"

import * as React from "react"

const COLOR_MAP: Record<string, string> = {
  black: "#1d1d1d", grey: "#9fa8b2", "light-violet": "#e085f4",
  violet: "#ae3ec9", blue: "#4465e9", "light-blue": "#4ba1f1",
  yellow: "#f1ac4b", orange: "#e16919", green: "#099268",
  "light-green": "#4cb05e", "light-red": "#f87777", red: "#e03131",
  white: "#FFFFFF",
}

const SIZE_MAP: Record<string, number> = { s: 1.5, m: 3, l: 5, xl: 9 }

export interface InkLayerHandle {
  redraw: () => void
}

interface InkLayerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any
  isDrawing?: boolean
}

// Cache parsed points and pre-built normalized Path2D per shape ID
interface StrokeCache {
  points: { x: number; y: number; z: number }[]
  raw: string
  // Normalized path (points as-is, no camera transform) — reusable across redraws
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

    const redraw = React.useCallback(() => {
      // Throttle to one redraw per animation frame
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        drawFrame()
      })
    }, [editor]) // eslint-disable-line react-hooks/exhaustive-deps

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

      // Get erasing IDs (only when eraser is active)
      let erasingIds: Set<string>
      try {
        const ids = editor.getErasingShapeIds()
        erasingIds = ids.length > 0 ? new Set(ids) : new Set()
      } catch {
        erasingIds = new Set()
      }

      for (const shape of shapes) {
        if (shape.type !== "handwrite") continue

        // Quick bounds check — skip shapes far outside viewport
        const sw = shape.props.w || 0
        const sh = shape.props.h || 0
        if (shape.x + sw < vpLeft || shape.x > vpRight ||
            shape.y + sh < vpTop || shape.y > vpBottom) continue

        try {
          // Use cached parsed points + pre-built Path2D
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

          ctx.globalAlpha = isErasing ? 0.3 : isHighlighter ? 0.35 : 1
          ctx.strokeStyle = color
          ctx.lineWidth = baseWidth * zoom
          ctx.lineCap = "round"
          ctx.lineJoin = "round"

          // Transform + stroke the cached path (much faster than rebuilding)
          ctx.save()
          ctx.translate((shape.x + camX) * zoom, (shape.y + camY) * zoom)
          ctx.scale(zoom, zoom)
          ctx.stroke(cached.path)
          ctx.restore()
          ctx.globalAlpha = 1
        } catch {}
      }
    }, [editor])

    // Expose redraw to parent via ref
    React.useImperativeHandle(ref, () => ({ redraw }), [redraw])

    // Redraw when shapes change (new stroke added/deleted)
    React.useEffect(() => {
      if (!editor) return
      const unsubDoc = editor.store.listen(
        () => { if (!isDrawing) redraw() },
        { source: "all", scope: "document" }
      )
      // Session changes (eraser preview) — only redraw if eraser is active
      const unsubSession = editor.store.listen(
        () => {
          if (isDrawing) return
          try {
            const tool = editor.getCurrentToolId()
            if (tool === "eraser") redraw()
          } catch {}
        },
        { source: "all", scope: "session" }
      )
      redraw()
      return () => { unsubDoc(); unsubSession() }
    }, [editor, redraw, isDrawing])

    // Force full re-render when page becomes visible (Safari downgrades idle canvases)
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
          // Clear rAF throttle and force immediate redraw
          if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
          drawFrame()
        }
      }
      document.addEventListener("visibilitychange", handleVisibility)
      return () => document.removeEventListener("visibilitychange", handleVisibility)
    }, [drawFrame])

    // Clean up points cache when shapes are deleted
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
