import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { InlineDatabaseView } from "@/components/editor/inline-database-view"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineDatabase: {
      setInlineDatabase: (attrs: { viewId: string }) => ReturnType
    }
  }
}

export const InlineDatabase = Node.create({
  name: "inlineDatabase",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      viewId: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-view-id"),
        renderHTML: (attributes: Record<string, string>) => ({
          "data-view-id": attributes.viewId,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-inline-database]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-inline-database": "" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineDatabaseView)
  },

  addCommands() {
    return {
      setInlineDatabase:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { viewId: attrs.viewId },
          })
        },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`@[database](${node.attrs.viewId})\n\n`)
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.after(
              "image",
              "inline_database",
              (state: any, silent: boolean) => {
                const start = state.pos
                if (
                  state.src.charCodeAt(start) !== 0x40 /* @ */ ||
                  state.src.charCodeAt(start + 1) !== 0x5b /* [ */
                )
                  return false

                const labelEnd = state.src.indexOf("](", start + 2)
                if (labelEnd === -1) return false

                const label = state.src.slice(start + 2, labelEnd)
                if (label !== "database") return false

                const urlStart = labelEnd + 2
                const urlEnd = state.src.indexOf(")", urlStart)
                if (urlEnd === -1) return false

                if (!silent) {
                  const viewId = state.src.slice(urlStart, urlEnd)
                  const token = state.push("inline_database", "", 0)
                  token.attrs = [["data-view-id", viewId]]
                  token.content = viewId
                }

                state.pos = urlEnd + 1
                return true
              }
            )
          },
          updateProseMirrorPlugins: (plugins: any[]) => plugins,
        },
      },
    }
  },
})
