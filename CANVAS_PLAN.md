# Canvas Note Feature — Implementation Plan

## Overview

A hybrid canvas + document experience (like OneNote/GoodNotes) where markdown text and freeform drawing coexist on the same surface. Built on tldraw with custom text shapes powered by TipTap.

### Key Decisions
- **File format**: `.canvas.json` for now → `.openvlt` (ZIP) later
- **Canvas engine**: tldraw
- **Text input**: Model C — invisible text regions, borderless until selected
- **Note types**: Markdown (`.md`) and Canvas (`.canvas.json`) coexist
- **Input**: Apple Pencil/stylus = active tool, finger = pan/zoom

---

## Phase 1: Minimal Working Canvas ✅

- [x] Install `@tldraw/tldraw`
- [x] DB migration v7: add `note_type` column to notes table
- [x] Update TypeScript types (`NoteType`, `noteType` on `NoteMetadata`)
- [x] Update `createNote()` to support `noteType` param and `.canvas.json` extension
- [x] Update `updateNoteContent()` to skip merge for canvas/excalidraw notes
- [x] Update `updateNoteTitle()` to preserve `.canvas.json` extension on rename
- [x] Update API route (`POST /api/notes`) to accept `noteType`
- [x] Create `canvas-editor.tsx` — tldraw canvas with auto-save (1s debounce)
- [x] Route canvas notes in `tab-panel.tsx` to `CanvasEditor`
- [x] Add "+Canvas" button in sidebar (`app-sidebar.tsx`)
- [x] Add "New canvas" to folder context menu (`sidebar-tree.tsx`)
- [x] Canvas-specific icon (`LayoutDashboardIcon`) in file tree
- [x] Disable tldraw's built-in text tool and double-click-to-create-text

## Phase 2: Text Blocks with Mini TipTap ✅

- [x] Custom tldraw shape: `text-note` — renders mini TipTap editor inside
- [x] Augment `TLGlobalShapePropsMap` to register custom shape type
- [x] Custom tool: `TextNoteTool` — click anywhere to create text block
- [x] Markdown support: headings, bold, italic, lists, blockquotes, code blocks
- [x] Model C behavior: invisible borders, blue highlight on edit
- [x] Double-click/double-tap on empty canvas creates text block
- [x] Empty text blocks auto-delete on edit end
- [x] Auto-resize text blocks based on content (line counting)
- [x] `immediatelyRender: false` to fix SSR hydration error
- [x] Text note style bar: font (draw/sans/serif/mono), size (S/M/L/XL), 13 colors
- [x] Style bar rendered outside tldraw (overlay) so button clicks work
- [x] Style bar updates live when changing properties
- [x] "Set as default" button with visual feedback — saves to localStorage
- [x] New text blocks use saved defaults

## Phase 3: Custom Canvas Toolbar ✅

- [x] Hide tldraw's default UI (`hideUi` prop)
- [x] Inline toolbar integrated into note header bar
- [x] Tools: Select, Hand, Pen, Eraser, Shapes (dropdown: rectangle/ellipse/triangle/line/arrow), Text, Undo/Redo
- [x] Shapes dropdown with active shape indicator
- [x] Style bar closes when switching away from select tool
- [ ] Pen settings panel (color picker, stroke width slider)
- [ ] Pressure sensitivity toggle in pen settings
- [ ] Collapsible toolbar (show/hide ribbon)
- [ ] Compact toolbar mode (smaller buttons)

## Phase 4: Pages and Backgrounds

- [ ] Page size system — constants for A4, Letter, Legal, infinite
- [ ] Store selected page size in canvas JSON metadata
- [ ] Background pattern rendering: ruled lines, grid, dot grid, blank
- [ ] Custom SVG pattern backgrounds via tldraw's background component override
- [ ] Page/background selector UI in toolbar
- [ ] Dynamic page size switching per note (not permanent)
- [ ] Camera bounds enforcement for fixed-size pages
- [ ] Visual page boundary indicator (shadow/border)
- [ ] Standard notebook rule sizes (college ruled, wide ruled, square grid)
- [ ] Custom line spacing option

## Phase 5: Layers Panel

- [ ] Side panel listing all shapes sorted by z-index
- [ ] Drag to reorder layers
- [ ] Click to select shape from layer list
- [ ] Eye icon to toggle visibility per layer
- [ ] Uses tldraw's `editor.sendToBack()`, `editor.bringToFront()`, etc.
- [ ] Toggle button in toolbar to show/hide layer panel

## Phase 6: `.openvlt` ZIP Format

- [ ] Add `yauzl-promise` dependency for reading ZIP files
- [ ] Create `openvlt-file.ts` service:
  - `createOpenvltFile(canvasJson, textContent, assets)` — create ZIP
  - `readOpenvltFile(filePath)` — extract canvas JSON and assets
  - `updateOpenvltFile(filePath, canvasJson, textContent)` — rewrite ZIP
- [ ] Migrate note CRUD to use `.openvlt` files for canvas notes
- [ ] Text extraction from text-note shapes into `content.md` inside ZIP
- [ ] Migration tool: convert existing `.canvas.json` → `.openvlt`
- [ ] Update FTS index with extracted text content for search

## Phase 7: Stylus vs Finger Input ✅

- [x] Detect `pointerType` from native DOM `PointerEvent`
- [x] Finger = always pan (single finger) / pinch-to-zoom (two fingers)
- [x] Manual touch handling: block all touch events from tldraw, handle pan/zoom ourselves
- [x] Pinch-to-zoom anchored to midpoint between fingers
- [x] Pen/stylus = uses active tool (draw by default)
- [x] Double-tap detection for creating text blocks on touch
- [ ] "Draw with finger" toggle option (when enabled, finger draws too)
- [ ] Store preference in localStorage

## Phase 8: Snap-to-Shape + Lasso Select

- [ ] Shape recognition on stroke completion:
  - Detect approximate circles, rectangles, triangles, lines
  - Confidence threshold → replace freehand stroke with clean tldraw geo shape
- [ ] Toggle snap-to-shape in toolbar/settings
- [ ] Lasso select tool:
  - Draw freeform selection loop
  - Select all shapes inside the lasso polygon
  - Works across layers (text AND drawings)
- [ ] Selected content can be moved, copied, resized, deleted as group

## Phase 9: Eraser Modes

- [ ] Stroke eraser (tldraw built-in) — erases entire stroke on touch
- [ ] Pixel eraser (custom tool):
  - Compute intersection of eraser circle with freehand paths
  - Split affected paths at intersection points
  - Remove intersecting segments
- [ ] Toggle between stroke/pixel eraser in toolbar

## Phase 10: Version History for Canvas

- [ ] Canvas JSON snapshots in existing TimeMachine version system
- [ ] Existing `saveVersionGrouped()` works for canvas content (JSON string)
- [ ] Read-only canvas preview component for historical versions
- [ ] Integrate canvas preview into TimeMachine panel
- [ ] Detect canvas note type in version diff view

---

## Future Enhancements (Post-MVP)

- [ ] PDF export — render canvas as-is (drawings + text + layout)
- [ ] Markdown export — extract text, convert drawings to inline SVG/PNG
- [ ] XY/XYZ graph shape templates
- [ ] Highlighter pen tool
- [ ] Pencil (textured) pen tool
- [ ] Import Excalidraw notes into canvas system
- [ ] Collaboration / real-time sync for canvas notes
