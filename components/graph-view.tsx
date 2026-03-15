"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useTabStore } from "@/lib/stores/tab-store"

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
)

interface GraphNode {
  id: string
  title: string
  // d3-force adds x, y at runtime
  x?: number
  y?: number
}

interface GraphLink {
  source: string
  target: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export function GraphView() {
  const { openTab } = useTabStore()
  const { resolvedTheme } = useTheme()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [data, setData] = React.useState<GraphData | null>(null)
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 })

  React.useEffect(() => {
    fetch("/api/notes/graph")
      .then((r) => (r.ok ? r.json() : { nodes: [], links: [] }))
      .then(setData)
      .catch(() => setData({ nodes: [], links: [] }))
  }, [])

  React.useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const isDark = resolvedTheme === "dark"

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No notes yet. Create some notes with [[wiki-links]] to see the graph.
      </div>
    )
  }

  // Count connections per node for sizing
  const connectionCount = new Map<string, number>()
  for (const link of data.links) {
    connectionCount.set(
      link.source as string,
      (connectionCount.get(link.source as string) || 0) + 1
    )
    connectionCount.set(
      link.target as string,
      (connectionCount.get(link.target as string) || 0) + 1
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={data as any}
        nodeLabel={(node: any) => node.title}
        nodeColor={(node: any) => {
          const count = connectionCount.get(node.id) || 0
          if (count > 3) return isDark ? "#22c55e" : "#16a34a"
          if (count > 0) return isDark ? "#3b82f6" : "#2563eb"
          return isDark ? "#6b7280" : "#9ca3af"
        }}
        nodeVal={(node: any) => {
          const count = connectionCount.get(node.id) || 0
          return Math.max(2, count + 1)
        }}
        linkColor={() => (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}
        linkWidth={1}
        backgroundColor={isDark ? "#0c0a09" : "#ffffff"}
        onNodeClick={(node: any) => {
          openTab(node.id, node.title)
        }}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.title
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"
          ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + 8 / globalScale)
        }}
      />
    </div>
  )
}
