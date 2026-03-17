import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { SyncedBlockView } from "@/components/editor/synced-block-view"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    syncedBlock: {
      setSyncedBlock: (attrs: { blockId: string }) => ReturnType
    }
  }
}

export const SyncedBlock = Node.create({
  name: "syncedBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-block-id"),
        renderHTML: (attributes: Record<string, string>) => ({
          "data-block-id": attributes.blockId,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-synced-block]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-synced-block": "" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SyncedBlockView)
  },

  addCommands() {
    return {
      setSyncedBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { blockId: attrs.blockId },
          })
        },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`@[synced](${node.attrs.blockId})\n\n`)
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.after(
              "image",
              "synced_block",
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
                if (label !== "synced") return false

                const urlStart = labelEnd + 2
                const urlEnd = state.src.indexOf(")", urlStart)
                if (urlEnd === -1) return false

                if (!silent) {
                  const blockId = state.src.slice(urlStart, urlEnd)
                  const token = state.push("synced_block", "", 0)
                  token.attrs = [["data-block-id", blockId]]
                  token.content = blockId
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
