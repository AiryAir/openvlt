"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import { CheckIcon } from "lucide-react"
import {
  getTextFormattingItems,
  getTableItems,
  getListItems,
  getInsertItems,
  getLinkImageItems,
  getBookmarkItems,
} from "@/lib/editor/context-menu-providers"
import type { ContextMenuGroup } from "@/lib/editor/context-menu-providers"

interface EditorContextMenuProps {
  editor: Editor | null
  noteId: string
  children: React.ReactNode
}

export function EditorContextMenu({
  editor,
  noteId,
  children,
}: EditorContextMenuProps) {
  if (!editor) return <>{children}</>

  // Collect groups from all providers — each provider decides
  // whether it's relevant to the current editor context
  const groups: ContextMenuGroup[] = [
    getTextFormattingItems(editor),
    getTableItems(editor),
    getListItems(editor),
    getInsertItems(editor),
    getLinkImageItems(editor, noteId),
    getBookmarkItems(editor, noteId),
  ].filter((g) => g.items.length > 0)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {groups.map((group, gi) => (
          <React.Fragment key={group.id}>
            {gi > 0 && <ContextMenuSeparator />}
            {group.label && (
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              if (item.type === "sub") {
                return (
                  <ContextMenuSub key={item.id}>
                    <ContextMenuSubTrigger>
                      {item.icon && (
                        <item.icon className="mr-2 size-4 shrink-0" />
                      )}
                      {item.label}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                      {item.children?.map((child) => (
                        <ContextMenuItem
                          key={child.id}
                          onSelect={child.action}
                          disabled={child.disabled}
                        >
                          {child.icon && (
                            <child.icon className="mr-2 size-4 shrink-0" />
                          )}
                          <span className="flex-1">{child.label}</span>
                          {child.active && (
                            <CheckIcon className="ml-auto size-3 text-primary" />
                          )}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                )
              }

              return (
                <ContextMenuItem
                  key={item.id}
                  onSelect={item.action}
                  disabled={item.disabled}
                  variant={item.destructive ? "destructive" : "default"}
                >
                  {item.icon && (
                    <item.icon className="mr-2 size-4 shrink-0" />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.active && (
                    <CheckIcon className="ml-auto size-3 text-primary" />
                  )}
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.shortcut}
                    </span>
                  )}
                </ContextMenuItem>
              )
            })}
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}
