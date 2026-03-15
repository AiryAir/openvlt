import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

const headingFoldKey = new PluginKey("headingFold")

function headingKey(pos: number, level: number, text: string): string {
  return `${level}:${text.slice(0, 40)}`
}

export const HeadingFold = Extension.create({
  name: "headingFold",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: headingFoldKey,
        state: {
          init(_, state) {
            return {
              collapsed: new Set<string>(),
              decorations: buildDecorations(state.doc, new Set()),
            }
          },
          apply(tr, prev) {
            const meta = tr.getMeta(headingFoldKey)
            let collapsed = prev.collapsed

            if (meta?.toggle) {
              collapsed = new Set(collapsed)
              if (collapsed.has(meta.toggle)) {
                collapsed.delete(meta.toggle)
              } else {
                collapsed.add(meta.toggle)
              }
            }

            if (tr.docChanged || meta?.toggle) {
              return {
                collapsed,
                decorations: buildDecorations(tr.doc, collapsed),
              }
            }

            return prev
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations ?? DecorationSet.empty
          },
          handleDOMEvents: {
            mousedown(view, event) {
              const target = event.target as HTMLElement
              const chevron = target.closest("[data-heading-fold]")
              if (!chevron) return false

              event.preventDefault()
              event.stopPropagation()

              const key = chevron.getAttribute("data-heading-fold")
              if (key) {
                view.dispatch(
                  view.state.tr.setMeta(headingFoldKey, { toggle: key })
                )
              }

              return true
            },
          },
        },
      }),
    ]
  },
})

function buildDecorations(
  doc: Parameters<typeof DecorationSet.create>[0],
  collapsed: Set<string>
): DecorationSet {
  const decorations: Decoration[] = []

  const headings: {
    pos: number
    end: number
    level: number
    text: string
    key: string
  }[] = []

  doc.forEach((node, pos) => {
    if (node.type.name === "heading") {
      const text = node.textContent
      const level = node.attrs.level as number
      const key = headingKey(pos, level, text)
      headings.push({ pos, end: pos + node.nodeSize, level, text, key })
    }
  })

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const isCollapsed = collapsed.has(h.key)

    // Check if there's any content after this heading to fold
    if (h.end >= doc.content.size) continue

    // Check next block - if it's a same/higher level heading, nothing to fold
    let hasContent = false
    doc.nodesBetween(h.end, Math.min(h.end + 1, doc.content.size), (node) => {
      if (node.type.name === "heading" && node.attrs.level <= h.level) {
        hasContent = false
      } else {
        hasContent = true
      }
      return false
    })

    // Also check: for last heading there may be content after it
    if (!hasContent && i < headings.length - 1 && headings[i + 1].level > h.level) {
      hasContent = true
    }
    if (!hasContent && h.end < doc.content.size) {
      // Check if next node is NOT a same/higher heading
      const nextNode = doc.nodeAt(h.end)
      if (nextNode && !(nextNode.type.name === "heading" && nextNode.attrs.level <= h.level)) {
        hasContent = true
      }
    }

    if (!hasContent) continue

    // Add data-foldable and collapsed state to the heading node itself
    const attrs: Record<string, string> = {
      "data-foldable": "true",
    }
    if (isCollapsed) {
      attrs["data-folded"] = "true"
    }
    decorations.push(
      Decoration.node(h.pos, h.end, attrs)
    )

    // Add chevron widget INSIDE the heading (at start of heading content)
    const chevronWidget = Decoration.widget(
      h.pos + 1, // +1 to be inside the heading node
      () => {
        const btn = document.createElement("button")
        btn.className = `heading-fold-chevron ${isCollapsed ? "is-collapsed" : ""}`
        btn.setAttribute("data-heading-fold", h.key)
        btn.setAttribute("contenteditable", "false")
        btn.setAttribute("aria-label", isCollapsed ? "Expand section" : "Collapse section")
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
        return btn
      },
      { side: -1 }
    )
    decorations.push(chevronWidget)

    if (isCollapsed) {
      // Add "..." ellipsis widget at the end of heading content
      const ellipsisWidget = Decoration.widget(
        h.end - 1, // Before the heading node closes
        () => {
          const span = document.createElement("span")
          span.className = "heading-fold-ellipsis"
          span.setAttribute("contenteditable", "false")
          span.textContent = " ..."
          return span
        },
        { side: 1 }
      )
      decorations.push(ellipsisWidget)

      // Find fold end
      let foldEnd = doc.content.size
      for (let j = i + 1; j < headings.length; j++) {
        if (headings[j].level <= h.level) {
          foldEnd = headings[j].pos
          break
        }
      }

      // Hide all nodes in the fold range
      doc.nodesBetween(h.end, foldEnd, (node, pos) => {
        if (pos >= h.end && pos < foldEnd) {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: "heading-fold-hidden",
            })
          )
          return false
        }
        return true
      })
    }
  }

  return DecorationSet.create(doc, decorations)
}
