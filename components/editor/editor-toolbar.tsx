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
  ClipboardCopyIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { promptDialog } from "@/lib/dialogs"
import { pickAndUpload } from "@/lib/editor/upload"

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px bg-border" />
}

function Tip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
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

  const handleCopyMarkdown = () => {
    const md = (editor as any).getMarkdown?.()
    if (md) {
      navigator.clipboard.writeText(md).then(() => {
        toast.success("Markdown copied to clipboard")
      })
    }
  }

  const handleInsertLink = async () => {
    const url = await promptDialog({ title: "Insert link", description: "Enter URL:", placeholder: "https://" })
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="sticky top-0 z-[5] flex items-center gap-0.5 overflow-x-auto border-b bg-background/95 px-2 py-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Undo / Redo */}
      <Tip label="Undo (⌘Z)">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => editor.chain().focus().undo().run()} onMouseDown={(e) => e.preventDefault()}>
          <Undo2Icon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Redo (⌘Y)">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => editor.chain().focus().redo().run()} onMouseDown={(e) => e.preventDefault()}>
          <Redo2Icon className="size-4" />
        </Toggle>
      </Tip>

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
      <Tip label="Bold (⌘B)">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} onMouseDown={(e) => e.preventDefault()}>
          <BoldIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Italic (⌘I)">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} onMouseDown={(e) => e.preventDefault()}>
          <ItalicIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Underline (⌘U)">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} onMouseDown={(e) => e.preventDefault()}>
          <UnderlineIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Strikethrough">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} onMouseDown={(e) => e.preventDefault()}>
          <StrikethroughIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Inline Code">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()} onMouseDown={(e) => e.preventDefault()}>
          <CodeIcon className="size-4" />
        </Toggle>
      </Tip>

      <ToolbarSeparator />

      {/* Lists */}
      <Tip label="Bullet List">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} onMouseDown={(e) => e.preventDefault()}>
          <ListIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Ordered List">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} onMouseDown={(e) => e.preventDefault()}>
          <ListOrderedIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Task List">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("taskList")} onPressedChange={() => editor.chain().focus().toggleTaskList().run()} onMouseDown={(e) => e.preventDefault()}>
          <ListChecksIcon className="size-4" />
        </Toggle>
      </Tip>

      <ToolbarSeparator />

      {/* Block elements */}
      <Tip label="Blockquote">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} onMouseDown={(e) => e.preventDefault()}>
          <QuoteIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Code Block">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("codeBlock")} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} onMouseDown={(e) => e.preventDefault()}>
          <FileCodeIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Horizontal Rule">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => editor.chain().focus().setHorizontalRule().run()} onMouseDown={(e) => e.preventDefault()}>
          <MinusIcon className="size-4" />
        </Toggle>
      </Tip>

      <ToolbarSeparator />

      {/* Table, Link, Image, Attach */}
      <Tip label="Insert Table">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} onMouseDown={(e) => e.preventDefault()}>
          <TableIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Insert Link">
        <Toggle size="sm" variant="outline" pressed={editor.isActive("link")} onPressedChange={handleInsertLink} onMouseDown={(e) => e.preventDefault()}>
          <LinkIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Insert Image">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => pickAndUpload(editor, noteId, "image/*")} onMouseDown={(e) => e.preventDefault()}>
          <ImageIcon className="size-4" />
        </Toggle>
      </Tip>
      <Tip label="Attach File">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={() => pickAndUpload(editor, noteId)} onMouseDown={(e) => e.preventDefault()}>
          <PaperclipIcon className="size-4" />
        </Toggle>
      </Tip>

      <ToolbarSeparator />

      <Tip label="Copy as Markdown">
        <Toggle size="sm" variant="outline" pressed={false} onPressedChange={handleCopyMarkdown} onMouseDown={(e) => e.preventDefault()}>
          <ClipboardCopyIcon className="size-4" />
        </Toggle>
      </Tip>
    </div>
  )
}
