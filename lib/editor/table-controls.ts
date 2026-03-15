import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, Selection } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/core"

const tableControlsKey = new PluginKey("tableControls")

const PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`

function removeControls() {
  document
    .querySelectorAll(".table-add-row-bar, .table-add-col-bar")
    .forEach((el) => el.remove())
}

function focusCell(view: EditorView, cellEl: Element) {
  const pos = view.posAtDOM(cellEl, 0)
  if (pos !== undefined) {
    view.dispatch(
      view.state.tr.setSelection(
        Selection.near(view.state.doc.resolve(pos))
      )
    )
  }
}

function addControls(
  view: EditorView,
  tableEl: HTMLTableElement,
  editor: Editor
) {
  removeControls()

  const editorEl = view.dom
  const editorRect = editorEl.getBoundingClientRect()
  const tableRect = tableEl.getBoundingClientRect()
  const scrollTop = editorEl.scrollTop

  // ── Add Row Bar (full width, below table) ──
  const rowBar = document.createElement("button")
  rowBar.className = "table-add-row-bar"
  rowBar.setAttribute("contenteditable", "false")
  rowBar.setAttribute("aria-label", "Add row")
  rowBar.setAttribute("title", "Add row")
  rowBar.innerHTML = PLUS_SVG

  rowBar.style.left = `${tableRect.left - editorRect.left}px`
  rowBar.style.top = `${tableRect.bottom - editorRect.top + scrollTop + 2}px`
  rowBar.style.width = `${tableRect.width}px`

  rowBar.addEventListener("mousedown", (e) => {
    e.preventDefault()
    e.stopPropagation()
    const cell = tableEl.querySelector(
      "tr:last-child td, tr:last-child th"
    )
    if (cell) focusCell(view, cell)
    editor.chain().focus().addRowAfter().run()
    // Reposition after adding
    setTimeout(() => {
      if (document.contains(tableEl)) {
        addControls(view, tableEl, editor)
      }
    }, 50)
  })

  editorEl.appendChild(rowBar)

  // ── Add Column Bar (full height, right of table) ──
  const colBar = document.createElement("button")
  colBar.className = "table-add-col-bar"
  colBar.setAttribute("contenteditable", "false")
  colBar.setAttribute("aria-label", "Add column")
  colBar.setAttribute("title", "Add column")
  colBar.innerHTML = PLUS_SVG

  colBar.style.left = `${tableRect.right - editorRect.left + 2}px`
  colBar.style.top = `${tableRect.top - editorRect.top + scrollTop}px`
  colBar.style.height = `${tableRect.height}px`

  colBar.addEventListener("mousedown", (e) => {
    e.preventDefault()
    e.stopPropagation()
    const cell = tableEl.querySelector(
      "tr:first-child th:last-child, tr:first-child td:last-child"
    )
    if (cell) focusCell(view, cell)
    editor.chain().focus().addColumnAfter().run()
    setTimeout(() => {
      if (document.contains(tableEl)) {
        addControls(view, tableEl, editor)
      }
    }, 50)
  })

  editorEl.appendChild(colBar)
}

export const TableControls = Extension.create({
  name: "tableControls",

  addProseMirrorPlugins() {
    const editor = this.editor
    let hoveredTable: HTMLTableElement | null = null
    let hideTimeout: ReturnType<typeof setTimeout> | null = null

    function scheduleHide() {
      if (hideTimeout) clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        hoveredTable = null
        removeControls()
      }, 300)
    }

    function cancelHide() {
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }
    }

    return [
      new Plugin({
        key: tableControlsKey,
        props: {
          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement
              const tableEl = target.closest(
                "table"
              ) as HTMLTableElement | null
              const isBar = target.closest(
                ".table-add-row-bar, .table-add-col-bar"
              )

              if (tableEl || isBar) {
                cancelHide()
              }

              if (tableEl && tableEl !== hoveredTable) {
                hoveredTable = tableEl
                addControls(view, tableEl, editor)
              }
              return false
            },
            mouseout(view, event) {
              const related = event.relatedTarget as HTMLElement | null
              if (!related) {
                scheduleHide()
                return false
              }

              const onTable = related.closest("table")
              const onBar = related.closest(
                ".table-add-row-bar, .table-add-col-bar"
              )

              if (!onTable && !onBar) {
                scheduleHide()
              }
              return false
            },
          },
        },
        view() {
          return {
            destroy() {
              removeControls()
              if (hideTimeout) clearTimeout(hideTimeout)
            },
          }
        },
      }),
    ]
  },
})
