import { Node, mergeAttributes } from "@tiptap/core"

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: string }) => ReturnType
      toggleCallout: (attrs?: { type?: string }) => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

const CALLOUT_TYPES = [
  "note",
  "tip",
  "warning",
  "danger",
  "info",
  "success",
  "caution",
  "important",
  "abstract",
  "todo",
  "example",
  "quote",
  "bug",
  "faq",
  "question",
]

const CALLOUT_REGEX = /^\[!(\w+)\]\s*/i

export const Callout = Node.create<CalloutOptions>({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-callout-type") || "note",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-callout-type": attributes.type,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-callout]",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-callout": "",
        class: `callout callout-${HTMLAttributes["data-callout-type"] || "note"}`,
      }),
      0,
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: {
            write: (s: string) => void
            ensureNewLine: () => void
            wrapBlock: (
              delim: string,
              first: string | null,
              node: unknown,
              fn: () => void
            ) => void
            renderContent: (node: { content: unknown }) => void
            closeBlock: (node: unknown) => void
          },
          node: {
            attrs: { type: string }
            content: unknown
          }
        ) {
          const type = node.attrs.type || "note"
          state.wrapBlock("> ", `> [!${type.toUpperCase()}]\n> `, node, () =>
            state.renderContent(node)
          )
          state.closeBlock(node)
        },
        parse: {
          updateDOM(element: HTMLElement) {
            // Find blockquotes whose first text starts with [!TYPE]
            element.querySelectorAll("blockquote").forEach((bq) => {
              const firstP = bq.querySelector("p")
              if (!firstP) return

              const textContent = firstP.textContent || ""
              const match = textContent.match(CALLOUT_REGEX)
              if (!match) return

              const calloutType = match[1].toLowerCase()
              // Validate it's a known callout type
              if (
                !CALLOUT_TYPES.includes(calloutType) &&
                !calloutType.match(/^\w+$/)
              )
                return

              // Remove the [!TYPE] prefix from the first paragraph
              const firstText = firstP.firstChild
              if (firstText && firstText.nodeType === 3) {
                // Text node
                firstText.textContent =
                  firstText.textContent?.replace(CALLOUT_REGEX, "") || ""
                // If paragraph is now empty, remove it
                if (!firstP.textContent?.trim() && !firstP.querySelector("*")) {
                  firstP.remove()
                }
              }

              // Replace blockquote with callout div
              const calloutDiv = element.ownerDocument.createElement("div")
              calloutDiv.setAttribute("data-callout", "")
              calloutDiv.setAttribute("data-callout-type", calloutType)
              calloutDiv.className = `callout callout-${calloutType}`
              calloutDiv.innerHTML = bq.innerHTML
              bq.replaceWith(calloutDiv)
            })
          },
        },
      },
    }
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attrs)
        },
      toggleCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attrs)
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-c": () => this.editor.commands.toggleCallout(),
    }
  },
})
