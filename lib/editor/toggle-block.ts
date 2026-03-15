import { Node, mergeAttributes, findParentNode } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

export interface ToggleBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleBlock: {
      setToggleBlock: () => ReturnType
    }
  }
}

const ToggleSummary = Node.create({
  name: "toggleSummary",

  group: "block",

  content: "inline*",

  defining: true,

  parseHTML() {
    return [{ tag: "summary" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "summary",
      mergeAttributes(HTMLAttributes, { class: "toggle-summary" }),
      0,
    ]
  },
})

const ToggleContent = Node.create({
  name: "toggleContent",

  group: "block",

  content: "block+",

  defining: true,

  parseHTML() {
    return [{ tag: "div[data-toggle-content]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-toggle-content": "" }),
      0,
    ]
  },
})

export const ToggleBlock = Node.create<ToggleBlockOptions>({
  name: "toggleBlock",

  group: "block",

  content: "toggleSummary toggleContent",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (element) => element.hasAttribute("open"),
        renderHTML: (attributes) => (attributes.open ? { open: "" } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: "details" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "toggle-block",
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setToggleBlock:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [
                {
                  type: "toggleSummary",
                  content: [{ type: "text", text: "Toggle heading" }],
                },
                {
                  type: "toggleContent",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Hidden content..." }],
                    },
                  ],
                },
              ],
            })
            .run()
        },
    }
  },

  addProseMirrorPlugins() {
    const typeName = this.name
    return [
      new Plugin({
        key: new PluginKey("toggleBlockClick"),
        props: {
          handleClickOn(view, pos, node, nodePos, event) {
            // Check if click target is a summary or the disclosure triangle
            const target = event.target as HTMLElement
            const summary = target.closest("summary.toggle-summary")
            if (!summary) return false

            // Find the toggleBlock node that contains this summary
            const $pos = view.state.doc.resolve(pos)
            for (let d = $pos.depth; d >= 1; d--) {
              const ancestor = $pos.node(d)
              if (ancestor.type.name === typeName) {
                const blockPos = $pos.before(d)
                const tr = view.state.tr.setNodeMarkup(blockPos, undefined, {
                  ...ancestor.attrs,
                  open: !ancestor.attrs.open,
                })
                view.dispatch(tr)
                // Prevent the native details toggle since we handle it via ProseMirror
                event.preventDefault()
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },

  addExtensions() {
    return [ToggleSummary, ToggleContent]
  },
})
