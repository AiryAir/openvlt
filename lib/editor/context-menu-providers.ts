import { promptDialog } from "@/lib/dialogs"
import type { Editor } from "@tiptap/core"
import type { ComponentType } from "react"
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  TableIcon,
  MinusIcon,
  FileCodeIcon,
  QuoteIcon,
  ListIcon,
  ListOrderedIcon,
  ListChecksIcon,
  LinkIcon,
  ImageIcon,
  PaperclipIcon,
  Trash2Icon,
  ArrowRightIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  BookmarkPlusIcon,
} from "lucide-react"
import { pickAndUpload } from "@/lib/editor/upload"

// ─── Types ───

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
  action?: () => void
  active?: boolean
  disabled?: boolean
  destructive?: boolean
  shortcut?: string
  type?: "item" | "sub"
  children?: ContextMenuItem[]
}

export interface ContextMenuGroup {
  id: string
  label?: string
  items: ContextMenuItem[]
}

// ─── Provider: Text Formatting ───
// Always shown — basic text formatting actions

export function getTextFormattingItems(editor: Editor): ContextMenuGroup {
  return {
    id: "text-formatting",
    items: [
      {
        id: "bold",
        label: "Bold",
        icon: BoldIcon,
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
        shortcut: "⌘B",
      },
      {
        id: "italic",
        label: "Italic",
        icon: ItalicIcon,
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
        shortcut: "⌘I",
      },
      {
        id: "underline",
        label: "Underline",
        icon: UnderlineIcon,
        action: () => editor.chain().focus().toggleUnderline().run(),
        active: editor.isActive("underline"),
        shortcut: "⌘U",
      },
      {
        id: "strikethrough",
        label: "Strikethrough",
        icon: StrikethroughIcon,
        action: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive("strike"),
      },
      {
        id: "code",
        label: "Inline Code",
        icon: CodeIcon,
        action: () => editor.chain().focus().toggleCode().run(),
        active: editor.isActive("code"),
        shortcut: "⌘E",
      },
    ],
  }
}

// ─── Provider: Table ───
// Only shown when the cursor is inside a table

export function getTableItems(editor: Editor): ContextMenuGroup {
  const inTable = editor.isActive("table")

  if (!inTable) {
    return { id: "table", items: [] }
  }

  return {
    id: "table",
    label: "Table",
    items: [
      {
        id: "add-row-above",
        label: "Insert row above",
        icon: ArrowUpIcon,
        action: () => editor.chain().focus().addRowBefore().run(),
      },
      {
        id: "add-row-below",
        label: "Insert row below",
        icon: ArrowDownIcon,
        action: () => editor.chain().focus().addRowAfter().run(),
      },
      {
        id: "add-col-left",
        label: "Insert column left",
        icon: ArrowLeftIcon,
        action: () => editor.chain().focus().addColumnBefore().run(),
      },
      {
        id: "add-col-right",
        label: "Insert column right",
        icon: ArrowRightIcon,
        action: () => editor.chain().focus().addColumnAfter().run(),
      },
      {
        id: "delete-row",
        label: "Delete row",
        icon: Trash2Icon,
        action: () => editor.chain().focus().deleteRow().run(),
        destructive: true,
      },
      {
        id: "delete-col",
        label: "Delete column",
        icon: Trash2Icon,
        action: () => editor.chain().focus().deleteColumn().run(),
        destructive: true,
      },
      {
        id: "delete-table",
        label: "Delete table",
        icon: Trash2Icon,
        action: () => editor.chain().focus().deleteTable().run(),
        destructive: true,
      },
    ],
  }
}

// ─── Provider: Lists ───
// Always shown

export function getListItems(editor: Editor): ContextMenuGroup {
  return {
    id: "lists",
    items: [
      {
        id: "bullet-list",
        label: "Bullet List",
        icon: ListIcon,
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
      },
      {
        id: "ordered-list",
        label: "Ordered List",
        icon: ListOrderedIcon,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
      },
      {
        id: "task-list",
        label: "Task List",
        icon: ListChecksIcon,
        action: () => editor.chain().focus().toggleTaskList().run(),
        active: editor.isActive("taskList"),
      },
    ],
  }
}

// ─── Provider: Insert ───
// Shown when NOT inside a table (can't nest tables)

export function getInsertItems(editor: Editor): ContextMenuGroup {
  const inTable = editor.isActive("table")

  const items: ContextMenuItem[] = []

  if (!inTable) {
    items.push({
      id: "insert-table",
      label: "Insert Table",
      icon: TableIcon,
      action: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    })
  }

  items.push(
    {
      id: "horizontal-rule",
      label: "Horizontal Rule",
      icon: MinusIcon,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      id: "code-block",
      label: "Code Block",
      icon: FileCodeIcon,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
    },
    {
      id: "blockquote",
      label: "Blockquote",
      icon: QuoteIcon,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    }
  )

  return { id: "insert", items }
}

// ─── Provider: Link, Image & Attachments ───
// Always shown

export function getLinkImageItems(
  editor: Editor,
  noteId: string
): ContextMenuGroup {
  return {
    id: "link-image",
    items: [
      {
        id: "insert-link",
        label: editor.isActive("link") ? "Edit Link" : "Insert Link",
        icon: LinkIcon,
        action: async () => {
          const existing = editor.getAttributes("link").href
          const url = await promptDialog({ title: editor.isActive("link") ? "Edit link" : "Insert link", description: "Enter URL:", defaultValue: existing || "", placeholder: "https://" })
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          } else if (url === "") {
            editor.chain().focus().unsetLink().run()
          }
        },
        active: editor.isActive("link"),
      },
      {
        id: "insert-image",
        label: "Insert Image",
        icon: ImageIcon,
        action: () => pickAndUpload(editor, noteId, "image/*"),
      },
      {
        id: "attach-file",
        label: "Attach File",
        icon: PaperclipIcon,
        action: () => pickAndUpload(editor, noteId),
      },
    ],
  }
}

// ─── Provider: Bookmark Heading ───
// Shown only when cursor is inside a heading node

export function getBookmarkItems(
  editor: Editor,
  noteId: string
): ContextMenuGroup {
  const { $from } = editor.state.selection
  const headingNode = $from.node($from.depth)

  if (headingNode?.type.name !== "heading") {
    return { id: "bookmark", items: [] }
  }

  const headingText = headingNode.textContent

  return {
    id: "bookmark",
    items: [
      {
        id: "bookmark-heading",
        label: "Bookmark this heading",
        icon: BookmarkPlusIcon,
        action: () => {
          window.dispatchEvent(
            new CustomEvent("openvlt:add-bookmark", {
              detail: {
                type: "heading",
                label: headingText,
                targetId: noteId,
                data: headingText,
              },
            })
          )
        },
      },
    ],
  }
}
