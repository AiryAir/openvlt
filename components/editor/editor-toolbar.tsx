"use client"

import type { Editor } from "@tiptap/react"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Undo2Icon,
  Redo2Icon,
  ChevronDownIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  ListIcon,
  ListOrderedIcon,
  ListChecksIcon,
  QuoteIcon,
  FileCodeIcon,
  MinusIcon,
  TableIcon,
  LinkIcon,
  ImageIcon,
  PaperclipIcon,
} from "lucide-react"
import { pickAndUpload } from "@/lib/editor/upload"

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px bg-border" />
}

interface EditorToolbarProps {
  editor: Editor | null
  noteId: string
}

export function EditorToolbar({ editor, noteId }: EditorToolbarProps) {
  if (!editor) return null

  const currentHeadingLabel = editor.isActive("heading", { level: 1 })
    ? "Heading 1"
    : editor.isActive("heading", { level: 2 })
      ? "Heading 2"
      : editor.isActive("heading", { level: 3 })
        ? "Heading 3"
        : "Normal"

  const handleInsertLink = () => {
    const url = window.prompt("Enter URL")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="sticky top-0 z-[5] flex items-center gap-0.5 overflow-x-auto border-b bg-background/95 px-2 py-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Undo / Redo */}
      <Toggle
        size="sm"
        variant="outline"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        onMouseDown={(e) => e.preventDefault()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2Icon className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        variant="outline"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        onMouseDown={(e) => e.preventDefault()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2Icon className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      {/* Heading dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm">
            {currentHeadingLabel}
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
            Normal text
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarSeparator />

      {/* Text formatting */}
      <Toggle size="sm" variant="outline" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} onMouseDown={(e) => e.preventDefault()} title="Bold (Ctrl+B)">
        <BoldIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} onMouseDown={(e) => e.preventDefault()} title="Italic (Ctrl+I)">
        <ItalicIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} onMouseDown={(e) => e.preventDefault()} title="Underline (Ctrl+U)">
        <UnderlineIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} onMouseDown={(e) => e.preventDefault()} title="Strikethrough">
        <StrikethroughIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()} onMouseDown={(e) => e.preventDefault()} title="Inline Code">
        <CodeIcon className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      {/* Lists */}
      <Toggle size="sm" variant="outline" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} onMouseDown={(e) => e.preventDefault()} title="Bullet List">
        <ListIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} onMouseDown={(e) => e.preventDefault()} title="Ordered List">
        <ListOrderedIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("taskList")} onPressedChange={() => editor.chain().focus().toggleTaskList().run()} onMouseDown={(e) => e.preventDefault()} title="Task List">
        <ListChecksIcon className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      {/* Block elements */}
      <Toggle size="sm" variant="outline" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} onMouseDown={(e) => e.preventDefault()} title="Blockquote">
        <QuoteIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("codeBlock")} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} onMouseDown={(e) => e.preventDefault()} title="Code Block">
        <FileCodeIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => editor.chain().focus().setHorizontalRule().run()} onMouseDown={(e) => e.preventDefault()} title="Horizontal Rule">
        <MinusIcon className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      {/* Table, Link, Image, Attach */}
      <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} onMouseDown={(e) => e.preventDefault()} title="Insert Table">
        <TableIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={editor.isActive("link")} onPressedChange={handleInsertLink} onMouseDown={(e) => e.preventDefault()} title="Insert Link">
        <LinkIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => pickAndUpload(editor, noteId, "image/*")} onMouseDown={(e) => e.preventDefault()} title="Insert Image">
        <ImageIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => pickAndUpload(editor, noteId)} onMouseDown={(e) => e.preventDefault()} title="Attach File">
        <PaperclipIcon className="size-4" />
      </Toggle>
    </div>
  )
}
