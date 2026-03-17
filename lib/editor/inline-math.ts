import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineMath: {
      setInlineMath: (attrs?: { content?: string }) => ReturnType
    }
  }
}

export const InlineMath = Node.create({
  name: "inlineMath",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-math-content") || "",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-math-content": attributes.content,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "span[data-inline-math]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-inline-math": "" }),
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`$${node.attrs.content}$`)
        },
        parse: {
          setup(markdownit: any) {
            // Inline math: $...$
            markdownit.inline.ruler.after(
              "escape",
              "inline_math",
              (state: any, silent: boolean) => {
                const start = state.pos
                const max = state.posMax

                if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false
                // Not $$
                if (
                  start + 1 < max &&
                  state.src.charCodeAt(start + 1) === 0x24
                )
                  return false

                let end = start + 1
                while (end < max) {
                  if (state.src.charCodeAt(end) === 0x24 /* $ */) {
                    // Not escaped
                    if (end === 0 || state.src.charCodeAt(end - 1) !== 0x5c)
                      break
                  }
                  end++
                }

                if (end >= max) return false

                const content = state.src.slice(start + 1, end)
                if (!content.trim()) return false

                if (!silent) {
                  const token = state.push("inline_math", "", 0)
                  token.content = content
                }

                state.pos = end + 1
                return true
              }
            )
          },
          updateProseMirrorPlugins: (plugins: any[]) => plugins,
        },
      },
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const span = document.createElement("span")
      span.setAttribute("data-inline-math", "")
      span.className = "inline-math-node"

      const renderMath = (latex: string) => {
        if (!latex.trim()) {
          span.textContent = "$...$"
          span.classList.add("empty")
          return
        }
        import("katex").then((katex) => {
          try {
            span.innerHTML = katex.default.renderToString(latex, {
              displayMode: false,
              throwOnError: false,
              trust: true,
            })
            span.classList.remove("empty")
          } catch {
            span.textContent = latex
            span.classList.add("error")
          }
        })
      }

      renderMath(node.attrs.content)

      // Edit on click when selected
      span.addEventListener("dblclick", () => {
        if (!editor.isEditable) return

        const input = document.createElement("input")
        input.type = "text"
        input.value = node.attrs.content
        input.className =
          "inline-math-editor border-0 bg-muted rounded px-1 py-0.5 font-mono text-sm text-foreground outline-none"
        input.style.width = `${Math.max(80, node.attrs.content.length * 8 + 20)}px`
        input.placeholder = "LaTeX"

        span.innerHTML = ""
        span.appendChild(input)
        input.focus()
        input.select()

        const save = () => {
          const newContent = input.value
          const pos = typeof getPos === "function" ? getPos() : null
          if (pos != null) {
            editor.commands.command(({ tr }) => {
              tr.setNodeAttribute(pos, "content", newContent)
              return true
            })
          }
          input.remove()
          renderMath(newContent)
        }

        input.addEventListener("blur", save)
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            input.blur()
          }
          if (e.key === "Escape") {
            e.preventDefault()
            input.value = node.attrs.content
            input.blur()
          }
        })
      })

      return { dom: span }
    }
  },

  addCommands() {
    return {
      setInlineMath:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { content: attrs?.content || "" },
          })
        },
    }
  },
})
