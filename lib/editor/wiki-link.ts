import { Node, mergeAttributes } from "@tiptap/core"
import { Suggestion } from "@tiptap/suggestion"
import type { Editor, Range } from "@tiptap/core"
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion"
import tippy, { type Instance as TippyInstance } from "tippy.js"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export interface WikiLinkSuggestionItem {
  id: string
  title: string
}

const wikiLinkPluginKey = new PluginKey("wikiLinkReveal")

/**
 * Custom suggestion match function that triggers on `[[` followed by query text.
 * Returns the match info that @tiptap/suggestion expects.
 */
function findWikiLinkSuggestionMatch(_config: {
  char: string
  allowSpaces: boolean
}) {
  return ({ $position }: { $position: any }) => {
    const nodeBefore = $position.nodeBefore
    const text = nodeBefore?.isText && nodeBefore.text
    if (!text) return null

    const textBeforeCursor = text
    const triggerIndex = textBeforeCursor.lastIndexOf("[[")

    if (triggerIndex === -1) return null

    // Make sure there's no `]]` between the trigger and cursor
    const textAfterTrigger = textBeforeCursor.slice(triggerIndex + 2)
    if (textAfterTrigger.includes("]]")) return null

    const query = textAfterTrigger

    // Calculate absolute positions
    const textFrom = $position.pos - text.length
    const from = textFrom + triggerIndex
    const to = $position.pos

    return {
      range: { from, to },
      query,
      text: `[[${query}`,
    }
  }
}

/**
 * Scan the document for raw `[[...]]` or unclosed `[[...` text patterns
 * and return inline decorations that style them like wiki-links.
 */
function buildRawWikiDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node: any, pos: number) => {
    if (!node.isText || !node.text) return
    const text = node.text as string

    let searchFrom = 0
    while (searchFrom < text.length) {
      const openIdx = text.indexOf("[[", searchFrom)
      if (openIdx === -1) break

      const closeIdx = text.indexOf("]]", openIdx + 2)
      const endIdx = closeIdx !== -1 ? closeIdx + 2 : text.length

      // Highlight the entire [[...]] or [[... range
      const from = pos + openIdx
      const to = pos + endIdx

      decorations.push(
        Decoration.inline(from, to, {
          class: "wiki-link-raw",
        })
      )

      searchFrom = endIdx
    }
  })

  if (decorations.length === 0) return DecorationSet.empty
  return DecorationSet.create(doc, decorations)
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const WikiLink = Node.create({
  name: "wikiLink",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      title: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-wiki-link") || "",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-wiki-link": attributes.title,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[data-wiki-link]",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "wiki-link",
      }),
      HTMLAttributes["data-wiki-link"] || "",
    ]
  },

  renderMarkdown: (node: any) => {
    const title = node.attrs?.title || ""
    return `[[${title}]]`
  },

  markdownTokenizer: {
    name: "wikiLink",
    level: "inline" as const,
    start(src: string) {
      const index = src.indexOf("[[")
      return index !== -1 ? index : -1
    },
    tokenize(src: string) {
      const match = src.match(/^\[\[([^\]\n]+)\]\]/)
      if (!match) return undefined
      return {
        type: "wikiLink",
        raw: match[0],
        title: match[1],
        text: match[1],
      }
    },
  },

  parseMarkdown: (token: any, helpers: any) => {
    return helpers.createNode("wikiLink", { title: token.title || "" })
  },

  addProseMirrorPlugins() {
    const editor = this.editor

    // Track the position of a wiki-link that was "exploded" into raw text
    // so we can re-parse it when the cursor leaves
    let explodedRange: { from: number; title: string } | null = null

    return [
      // Decompose wiki-link into raw text on click, recompose on leave
      new Plugin({
        key: wikiLinkPluginKey,
        props: {
          handleClick(view, pos, event) {
            // Cmd/Ctrl+click: navigate
            if (event.metaKey || event.ctrlKey) {
              const $pos = view.state.doc.resolve(pos)
              const node =
                $pos.nodeAfter?.type.name === "wikiLink"
                  ? $pos.nodeAfter
                  : $pos.nodeBefore?.type.name === "wikiLink"
                    ? $pos.nodeBefore
                    : null

              if (node) {
                const title = node.attrs.title
                if (title) {
                  window.dispatchEvent(
                    new CustomEvent("openvlt:wiki-link-click", {
                      detail: { title },
                    })
                  )
                }
                return true
              }
              return false
            }

            // Regular click: explode the atom into editable [[text]]
            const $pos = view.state.doc.resolve(pos)
            let nodePos: number | null = null
            let wikiNode: any = null

            if ($pos.nodeAfter?.type.name === "wikiLink") {
              nodePos = pos
              wikiNode = $pos.nodeAfter
            } else if ($pos.nodeBefore?.type.name === "wikiLink") {
              nodePos = pos - ($pos.nodeBefore?.nodeSize ?? 0)
              wikiNode = $pos.nodeBefore
            }

            if (wikiNode && nodePos !== null) {
              const title = wikiNode.attrs.title || ""
              const rawText = `[[${title}]]`
              const { tr } = view.state
              tr.replaceWith(
                nodePos,
                nodePos + wikiNode.nodeSize,
                view.state.schema.text(rawText)
              )
              // Place cursor at the end of the title text (before ]])
              const cursorPos = nodePos + 2 + title.length
              tr.setSelection(
                TextSelection.create(
                  tr.doc,
                  Math.min(cursorPos, tr.doc.content.size)
                )
              )
              view.dispatch(tr)
              explodedRange = { from: nodePos, title }
              return true
            }

            return false
          },
        },
        appendTransaction(transactions, _oldState, newState) {
          // When the cursor moves away from an exploded wiki-link, try to recompose it
          if (!explodedRange) return null

          const { selection } = newState
          const cursorPos = selection.from

          // Find if there's a [[...]] pattern near the exploded range
          const $pos = newState.doc.resolve(
            Math.min(explodedRange.from, newState.doc.content.size)
          )
          const parentNode = $pos.parent
          const parentText = parentNode.textContent
          const offsetInParent = explodedRange.from - $pos.start()

          // Look for [[ starting at the exploded position
          const textFromExploded = parentText.slice(offsetInParent)
          const closeIdx = textFromExploded.indexOf("]]")
          const openIdx = textFromExploded.indexOf("[[")

          if (openIdx !== 0) {
            // The [[ was deleted, clear the tracking
            explodedRange = null
            return null
          }

          if (closeIdx === -1) {
            // No ]] yet — the user may still be editing. Check if cursor is still in range.
            const rangeEnd = explodedRange.from + textFromExploded.length
            if (cursorPos >= explodedRange.from && cursorPos <= rangeEnd) {
              return null // Still editing
            }
            // Cursor left without closing — just abandon
            explodedRange = null
            return null
          }

          // We have [[...]] — check if cursor is outside it
          const fullMatch = textFromExploded.slice(0, closeIdx + 2)
          const absoluteStart = $pos.start() + offsetInParent
          const absoluteEnd = absoluteStart + fullMatch.length

          if (cursorPos >= absoluteStart && cursorPos <= absoluteEnd) {
            return null // Cursor is still inside
          }

          // Cursor left — recompose into a wikiLink node
          const innerTitle = fullMatch.slice(2, -2)
          if (!innerTitle) {
            explodedRange = null
            return null
          }

          const { tr } = newState
          const wikiLinkNode = newState.schema.nodes.wikiLink.create({
            title: innerTitle,
          })
          tr.replaceWith(absoluteStart, absoluteEnd, wikiLinkNode)
          explodedRange = null
          return tr
        },
      }),
      // Highlight raw [[...]] and [[... (unclosed) text in primary color
      new Plugin({
        key: new PluginKey("wikiLinkRawHighlight"),
        state: {
          init(_, state) {
            return buildRawWikiDecorations(state.doc)
          },
          apply(tr, oldDecos) {
            if (!tr.docChanged) return oldDecos
            return buildRawWikiDecorations(tr.doc)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state) ?? DecorationSet.empty
          },
        },
      }),
      // Suggestion plugin for [[query autocomplete
      Suggestion({
        editor,
        char: "[[",
        pluginKey: new PluginKey("wikiLinkSuggestion"),
        findSuggestionMatch: findWikiLinkSuggestionMatch({
          char: "[[",
          allowSpaces: true,
        }),
        items: async ({
          query,
        }: {
          query: string
        }): Promise<WikiLinkSuggestionItem[]> => {
          if (!query || query.length < 1) return []

          return new Promise((resolve) => {
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(async () => {
              try {
                const res = await fetch(
                  `/api/notes/search-titles?q=${encodeURIComponent(query)}`
                )
                if (res.ok) {
                  const data = await res.json()
                  resolve(data.results ?? data ?? [])
                } else {
                  resolve([])
                }
              } catch {
                resolve([])
              }
            }, 150)
          })
        },
        command: ({
          editor: ed,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: WikiLinkSuggestionItem
        }) => {
          ed.chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "wikiLink",
              attrs: { title: props.title },
            })
            .run()
        },
        render: () => {
          let popup: TippyInstance | undefined
          let container: HTMLDivElement | undefined
          let selectedIndex = 0
          let items: WikiLinkSuggestionItem[] = []

          function renderItems() {
            if (!container) return
            container.innerHTML = ""

            if (items.length === 0) {
              const empty = document.createElement("div")
              empty.className = "wiki-link-item wiki-link-empty"
              empty.textContent = "No matches"
              container.appendChild(empty)
              return
            }

            items.forEach((item, index) => {
              const el = document.createElement("button")
              el.className = `wiki-link-item ${index === selectedIndex ? "is-selected" : ""}`
              el.innerHTML = `<span class="wiki-link-item-title">${item.title}</span>`
              el.addEventListener("click", () => {
                selectItem(index)
              })
              container!.appendChild(el)
            })
          }

          let commandFn: ((props: WikiLinkSuggestionItem) => void) | null = null

          function selectItem(index: number) {
            const item = items[index]
            if (item && commandFn) {
              commandFn(item)
            }
          }

          return {
            onStart: (props: SuggestionProps<WikiLinkSuggestionItem>) => {
              container = document.createElement("div")
              container.className = "wiki-link-list"
              items = props.items
              commandFn = props.command
              selectedIndex = 0
              renderItems()

              popup = tippy(document.body, {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
                appendTo: () => document.body,
                content: container,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              })
            },

            onUpdate: (props: SuggestionProps<WikiLinkSuggestionItem>) => {
              items = props.items
              commandFn = props.command
              selectedIndex = 0
              renderItems()

              popup?.setProps({
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
              })
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === "ArrowUp") {
                selectedIndex =
                  (selectedIndex - 1 + items.length) % items.length
                renderItems()
                return true
              }
              if (props.event.key === "ArrowDown") {
                selectedIndex = (selectedIndex + 1) % items.length
                renderItems()
                return true
              }
              if (props.event.key === "Enter") {
                selectItem(selectedIndex)
                return true
              }
              if (props.event.key === "Escape") {
                popup?.hide()
                return true
              }
              return false
            },

            onExit: () => {
              popup?.destroy()
              container?.remove()
            },
          }
        },
      }),
    ]
  },
})
