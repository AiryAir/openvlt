import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

/**
 * Prevents tables from being inserted inside table cells.
 * Works at the ProseMirror transaction level so it blocks all paths:
 * toolbar buttons, slash commands, paste, drag-drop, etc.
 */
export const NoNestedTables = Extension.create({
  name: "noNestedTables",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("noNestedTables"),
        filterTransaction(tr) {
          if (!tr.docChanged) return true

          let hasNested = false
          tr.doc.descendants((node) => {
            if (hasNested) return false
            if (
              node.type.name === "tableCell" ||
              node.type.name === "tableHeader"
            ) {
              node.descendants((child) => {
                if (hasNested) return false
                if (child.type.name === "table") {
                  hasNested = true
                  return false
                }
              })
              return false
            }
          })

          return !hasNested
        },
      }),
    ]
  },
})
