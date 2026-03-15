import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { ResolvedPos, MarkType } from "@tiptap/pm/model"

const inlineMarkPluginKey = new PluginKey("inlineMarkReveal")

// Map mark type names to their markdown syntax
const MARK_SYNTAX: Record<string, { open: string; close: string }> = {
  bold: { open: "**", close: "**" },
  italic: { open: "*", close: "*" },
  strike: { open: "~~", close: "~~" },
  code: { open: "`", close: "`" },
}

/**
 * Find the full range of a mark around the cursor position.
 * Collects all contiguous marked ranges in the parent textblock,
 * then returns the one that contains the cursor.
 */
function findMarkRange(
  $pos: ResolvedPos,
  markType: MarkType
): { from: number; to: number } | null {
  const parent = $pos.parent
  if (!parent.isTextblock) return null

  const parentOffset = $pos.parentOffset
  const startOfParent = $pos.start()

  const ranges: { from: number; to: number }[] = []
  let currentFrom = -1
  let currentTo = -1

  parent.forEach((child, childOffset) => {
    if (child.isText && markType.isInSet(child.marks)) {
      if (currentFrom === -1) {
        currentFrom = childOffset
      }
      currentTo = childOffset + child.nodeSize
    } else {
      if (currentFrom !== -1) {
        ranges.push({ from: currentFrom, to: currentTo })
        currentFrom = -1
        currentTo = -1
      }
    }
  })
  if (currentFrom !== -1) {
    ranges.push({ from: currentFrom, to: currentTo })
  }

  for (const range of ranges) {
    if (parentOffset >= range.from && parentOffset <= range.to) {
      return {
        from: startOfParent + range.from,
        to: startOfParent + range.to,
      }
    }
  }

  return null
}

function createSyntaxWidget(
  text: string,
  side: "open" | "close",
  extraClass?: string
): HTMLElement {
  const span = document.createElement("span")
  span.className = `mark-syntax mark-syntax-${side}${extraClass ? ` ${extraClass}` : ""}`
  span.textContent = text
  return span
}

export const InlineMarkReveal = Extension.create({
  name: "inlineMarkReveal",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: inlineMarkPluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr) {
            const { selection } = tr
            const { $from, empty } = selection

            // Only reveal on cursor (collapsed selection), not range selections
            if (!empty) return DecorationSet.empty

            const parent = $from.parent
            if (!parent.isTextblock) return DecorationSet.empty

            const marks = $from.marks()
            if (marks.length === 0) return DecorationSet.empty

            const decorations: Decoration[] = []

            for (const mark of marks) {
              // Handle link marks specially — show [text](url)
              if (mark.type.name === "link") {
                const range = findMarkRange($from, mark.type)
                if (!range) continue

                const href = mark.attrs.href || ""

                decorations.push(
                  Decoration.widget(
                    range.from,
                    () => createSyntaxWidget("[", "open", "mark-syntax-link"),
                    {
                      side: -1,
                      key: `mark-open-link-${range.from}`,
                    }
                  )
                )

                decorations.push(
                  Decoration.widget(
                    range.to,
                    () =>
                      createSyntaxWidget(
                        `](${href})`,
                        "close",
                        "mark-syntax-link"
                      ),
                    {
                      side: 1,
                      key: `mark-close-link-${range.to}`,
                    }
                  )
                )
                continue
              }

              const syntax = MARK_SYNTAX[mark.type.name]
              if (!syntax) continue

              const range = findMarkRange($from, mark.type)
              if (!range) continue

              decorations.push(
                Decoration.widget(
                  range.from,
                  () => createSyntaxWidget(syntax.open, "open"),
                  {
                    side: -1,
                    key: `mark-open-${mark.type.name}-${range.from}`,
                  }
                )
              )

              decorations.push(
                Decoration.widget(
                  range.to,
                  () => createSyntaxWidget(syntax.close, "close"),
                  {
                    side: 1,
                    key: `mark-close-${mark.type.name}-${range.to}`,
                  }
                )
              )
            }

            if (decorations.length === 0) return DecorationSet.empty
            return DecorationSet.create(tr.doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state) ?? DecorationSet.empty
          },
        },
      }),
    ]
  },
})
