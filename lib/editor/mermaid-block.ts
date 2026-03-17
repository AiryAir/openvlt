import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaidBlock: {
      setMermaidBlock: (attrs?: { content?: string }) => ReturnType
    }
  }
}

let mermaidId = 0

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      content: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-mermaid-content") || "",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-mermaid-content": attributes.content,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-mermaid-block]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-mermaid-block": "" }),
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`\`\`\`mermaid\n${node.attrs.content}\n\`\`\`\n\n`)
        },
        parse: {
          // Mermaid blocks are parsed by intercepting the existing fence token
          // when language is "mermaid". We hook into markdown-it's renderer.
          setup(markdownit: any) {
            // Override fence rule to detect mermaid
            const originalFence = markdownit.renderer.rules.fence
            markdownit.renderer.rules.fence = (
              tokens: any[],
              idx: number,
              options: any,
              env: any,
              slf: any
            ) => {
              const token = tokens[idx]
              const info = token.info.trim().toLowerCase()
              if (info === "mermaid") {
                // Return a placeholder that will be parsed as mermaidBlock
                return `<div data-mermaid-block data-mermaid-content="${encodeURIComponent(token.content.trim())}"></div>`
              }
              if (originalFence) {
                return originalFence(tokens, idx, options, env, slf)
              }
              return slf.renderToken(tokens, idx, options)
            }
          },
          updateProseMirrorPlugins: (plugins: any[]) => plugins,
        },
      },
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("div")
      wrapper.setAttribute("data-mermaid-block", "")
      wrapper.className =
        "mermaid-block-wrapper group relative my-4 cursor-pointer rounded-lg border bg-muted/30 overflow-hidden"

      const display = document.createElement("div")
      display.className = "mermaid-block-display flex items-center justify-center p-4"
      wrapper.appendChild(display)

      // Label
      const label = document.createElement("div")
      label.className =
        "absolute top-2 right-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      label.textContent = "mermaid"
      wrapper.appendChild(label)

      const renderDiagram = async (code: string) => {
        if (!code.trim()) {
          display.innerHTML =
            '<span class="text-sm text-muted-foreground italic">Empty mermaid diagram</span>'
          return
        }

        try {
          const mermaid = (await import("mermaid")).default
          mermaid.initialize({
            startOnLoad: false,
            theme: document.documentElement.classList.contains("dark")
              ? "dark"
              : "default",
            securityLevel: "strict",
          })
          const id = `mermaid-${++mermaidId}`
          const { svg } = await mermaid.render(id, code)
          display.innerHTML = svg
        } catch (err: any) {
          display.innerHTML = `<div class="text-sm text-destructive p-2 font-mono whitespace-pre-wrap">${err?.message || "Invalid mermaid syntax"}</div>`
        }
      }

      renderDiagram(node.attrs.content)

      // Re-render on theme change
      const observer = new MutationObserver(() => {
        renderDiagram(node.attrs.content)
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      })

      // Edit on double-click
      wrapper.addEventListener("dblclick", () => {
        if (!editor.isEditable) return

        const textarea = document.createElement("textarea")
        textarea.value = node.attrs.content
        textarea.className =
          "mermaid-block-editor w-full resize-none border-0 bg-background p-4 font-mono text-sm text-foreground outline-none"
        textarea.rows = Math.max(
          5,
          node.attrs.content.split("\n").length + 1
        )
        textarea.placeholder =
          "Enter mermaid syntax (e.g. graph TD; A-->B)"

        display.replaceWith(textarea)
        label.style.display = "none"
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
          newDisplay.className =
            "mermaid-block-display flex items-center justify-center p-4"
          textarea.replaceWith(newDisplay)
          label.style.display = ""
          renderDiagram(newContent)
        }

        textarea.addEventListener("blur", save)
        textarea.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            textarea.blur()
          }
        })
      })

      return {
        dom: wrapper,
        destroy() {
          observer.disconnect()
        },
      }
    }
  },

  addCommands() {
    return {
      setMermaidBlock:
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
