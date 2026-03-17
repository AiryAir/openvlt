import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (attrs?: { content?: string }) => ReturnType
    }
  }
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  draggable: true,

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
    return [{ tag: "div[data-math-block]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-math-block": "" }),
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`$$\n${node.attrs.content}\n$$\n\n`)
        },
        parse: {
          setup(markdownit: any) {
            // Block math: $$ ... $$
            markdownit.block.ruler.before(
              "fence",
              "math_block",
              (state: any, startLine: number, endLine: number, silent: boolean) => {
                const startPos = state.bMarks[startLine] + state.tShift[startLine]
                const maxPos = state.eMarks[startLine]
                const line = state.src.slice(startPos, maxPos).trim()

                if (line !== "$$") return false
                if (silent) return true

                let nextLine = startLine + 1
                let found = false
                while (nextLine < endLine) {
                  const nStart =
                    state.bMarks[nextLine] + state.tShift[nextLine]
                  const nMax = state.eMarks[nextLine]
                  const nLine = state.src.slice(nStart, nMax).trim()
                  if (nLine === "$$") {
                    found = true
                    break
                  }
                  nextLine++
                }

                if (!found) return false

                const contentStart = state.bMarks[startLine + 1]
                const contentEnd = state.bMarks[nextLine]
                const content = state.src.slice(contentStart, contentEnd).trim()

                const token = state.push("math_block", "div", 0)
                token.content = content
                token.map = [startLine, nextLine + 1]
                token.block = true

                state.line = nextLine + 1
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
      const wrapper = document.createElement("div")
      wrapper.setAttribute("data-math-block", "")
      wrapper.className =
        "math-block-wrapper group relative my-4 cursor-pointer rounded-lg border bg-muted/30 px-4 py-3"

      const display = document.createElement("div")
      display.className = "math-block-display"
      wrapper.appendChild(display)

      const renderMath = (latex: string) => {
        if (!latex.trim()) {
          display.innerHTML =
            '<span class="text-sm text-muted-foreground italic">Empty math block</span>'
          return
        }
        import("katex").then((katex) => {
          try {
            display.innerHTML = katex.default.renderToString(latex, {
              displayMode: true,
              throwOnError: false,
              trust: true,
            })
          } catch {
            display.innerHTML = `<span class="text-sm text-destructive">Invalid LaTeX</span>`
          }
        })
      }

      renderMath(node.attrs.content)

      // Edit on click
      wrapper.addEventListener("dblclick", () => {
        if (!editor.isEditable) return

        const textarea = document.createElement("textarea")
        textarea.value = node.attrs.content
        textarea.className =
          "math-block-editor w-full resize-none border-0 bg-transparent p-0 font-mono text-sm text-foreground outline-none"
        textarea.rows = Math.max(3, node.attrs.content.split("\n").length + 1)
        textarea.placeholder = "Enter LaTeX (e.g. E = mc^2)"

        display.replaceWith(textarea)
        textarea.focus()

        const save = () => {
          const newContent = textarea.value
          const pos = typeof getPos === "function" ? getPos() : null
          if (pos != null) {
            editor.commands.command(({ tr }) => {
              tr.setNodeAttribute(pos, "content", newContent)
              return true
            })
          }
          const newDisplay = document.createElement("div")
          newDisplay.className = "math-block-display"
          textarea.replaceWith(newDisplay)
          // Re-assign so next dblclick works
          Object.defineProperty(wrapper, "_display", { value: newDisplay })
          renderMath(newContent)
          // Fix: update display reference for future dblclicks
          display.remove() // old one
        }

        textarea.addEventListener("blur", save)
        textarea.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            textarea.blur()
          }
        })
      })

      return { dom: wrapper }
    }
  },

  addCommands() {
    return {
      setMathBlock:
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
