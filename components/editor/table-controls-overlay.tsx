"use client"

import * as React from "react"
import type { Editor } from "@tiptap/core"
import { NodeSelection, Selection } from "@tiptap/pm/state"

interface TableControlsOverlayProps {
  editor: Editor | null
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Renders add-row and add-column bars by creating a separate overlay div
 * OUTSIDE the contenteditable, positioned to match the hovered table.
 * The overlay div is a sibling of the editor scroll container.
 */
export function TableControlsOverlay({
  editor,
  scrollContainerRef,
}: TableControlsOverlayProps) {
  const [hoveredTable, setHoveredTable] = React.useState<HTMLTableElement | null>(null)
  const [pos, setPos] = React.useState<{
    rowTop: number
    rowLeft: number
    rowWidth: number
    colTop: number
    colLeft: number
    colHeight: number
    wrapperScrollLeft: number
    wrapperWidth: number
  } | null>(null)
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelHide() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  function scheduleHide() {
    cancelHide()
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredTable(null)
      setPos(null)
    }, 300)
  }

  function updatePos(table: HTMLTableElement) {
    const container = scrollContainerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const tableRect = table.getBoundingClientRect()

    // Find the .tableWrapper parent
    const wrapper = table.closest(".tableWrapper") as HTMLElement | null
    const wrapperScrollLeft = wrapper?.scrollLeft ?? 0
    const wrapperRect = wrapper?.getBoundingClientRect()
    const wrapperWidth = wrapperRect?.width ?? containerRect.width

    // Row bar: below table, clipped to visible wrapper width
    const visibleLeft = Math.max(
      tableRect.left - containerRect.left,
      (wrapperRect?.left ?? 0) - containerRect.left
    )
    const visibleRight = Math.min(
      tableRect.right - containerRect.left,
      (wrapperRect?.right ?? containerRect.width) - containerRect.left
    )
    const visibleWidth = Math.max(0, visibleRight - visibleLeft)

    setPos({
      rowTop: tableRect.bottom - containerRect.top + container.scrollTop + 2,
      rowLeft: visibleLeft,
      rowWidth: visibleWidth,
      colTop: tableRect.top - containerRect.top + container.scrollTop,
      colLeft: Math.min(
        tableRect.right - containerRect.left + 2,
        (wrapperRect?.right ?? containerRect.width) - containerRect.left + 2
      ),
      colHeight: tableRect.height,
      wrapperScrollLeft,
      wrapperWidth,
    })
  }

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    function handleMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      const table = target.closest("table") as HTMLTableElement | null
      const onBar = target.closest("[data-table-bar]")

      if (table || onBar) cancelHide()

      if (table) {
        setHoveredTable(table)
        updatePos(table)
      }
    }

    function handleMouseOut(e: MouseEvent) {
      const related = e.relatedTarget as HTMLElement | null
      const onTable = related?.closest("table")
      const onBar = related?.closest("[data-table-bar]")
      if (!onTable && !onBar) scheduleHide()
    }

    function handleScroll() {
      if (hoveredTable && document.contains(hoveredTable)) {
        updatePos(hoveredTable)
      }
    }

    // Also listen to wrapper scroll (horizontal)
    function handleWrapperScroll(e: Event) {
      const target = e.target as HTMLElement
      if (
        target.classList.contains("tableWrapper") &&
        hoveredTable &&
        target.contains(hoveredTable)
      ) {
        updatePos(hoveredTable)
      }
    }

    container.addEventListener("mouseover", handleMouseOver)
    container.addEventListener("mouseout", handleMouseOut)
    container.addEventListener("scroll", handleScroll, { passive: true })
    container.addEventListener("scroll", handleWrapperScroll, {
      passive: true,
      capture: true,
    })

    return () => {
      container.removeEventListener("mouseover", handleMouseOver)
      container.removeEventListener("mouseout", handleMouseOut)
      container.removeEventListener("scroll", handleScroll)
      container.removeEventListener("scroll", handleWrapperScroll, {
        capture: true,
      })
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [scrollContainerRef, hoveredTable]) // eslint-disable-line react-hooks/exhaustive-deps

  function focusCell(selector: string) {
    if (!editor || !hoveredTable) return
    const cell = hoveredTable.querySelector(selector)
    if (cell) {
      const view = editor.view
      const pos = view.posAtDOM(cell, 0)
      if (pos !== undefined) {
        view.dispatch(
          view.state.tr.setSelection(
            Selection.near(view.state.doc.resolve(pos))
          )
        )
      }
    }
  }

  function handleSelectTable(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!editor || !hoveredTable) return
    const view = editor.view
    const pos = view.posAtDOM(hoveredTable, 0)
    if (pos == null) return
    // Walk back to find the table node position
    const resolved = view.state.doc.resolve(pos)
    for (let d = resolved.depth; d > 0; d--) {
      if (resolved.node(d).type.name === "table") {
        const tablePos = resolved.before(d)
        view.dispatch(
          view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, tablePos)
          )
        )
        view.focus()
        return
      }
    }
  }

  function handleAddRow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!editor) return
    focusCell("tr:last-child td, tr:last-child th")
    editor.chain().focus().addRowAfter().run()
    setTimeout(() => {
      if (hoveredTable && document.contains(hoveredTable)) {
        updatePos(hoveredTable)
      }
    }, 50)
  }

  function handleAddCol(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!editor) return
    focusCell(
      "tr:first-child th:last-child, tr:first-child td:last-child"
    )
    editor.chain().focus().addColumnAfter().run()
    setTimeout(() => {
      if (hoveredTable && document.contains(hoveredTable)) {
        updatePos(hoveredTable)
      }
    }, 50)
  }

  if (!hoveredTable || !pos) return null

  return (
    <>
      {/* Select Table Grip (top-left corner) */}
      <button
        data-table-bar="grip"
        className="table-select-grip"
        style={{
          position: "absolute",
          top: `${pos.colTop - 22}px`,
          left: `${pos.rowLeft - 2}px`,
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        onMouseDown={handleSelectTable}
        title="Select table"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </button>

      {/* Add Row Bar */}
      <button
        data-table-bar="row"
        className="table-add-row-bar"
        style={{
          position: "absolute",
          top: `${pos.rowTop}px`,
          left: `${pos.rowLeft}px`,
          width: `${pos.rowWidth}px`,
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        onMouseDown={handleAddRow}
        title="Add row"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Add Column Bar */}
      <button
        data-table-bar="col"
        className="table-add-col-bar"
        style={{
          position: "absolute",
          top: `${pos.colTop}px`,
          left: `${pos.colLeft}px`,
          height: `${pos.colHeight}px`,
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        onMouseDown={handleAddCol}
        title="Add column"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  )
}
