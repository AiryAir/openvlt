"use client"

import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeSelection } from "@tiptap/pm/state"
import { isImageMime, isPdfMime, isDocxMime } from "./embeds/mime-utils"
import { AttachmentToolbar } from "./embeds/attachment-toolbar"
import { ImageEmbed } from "./embeds/image-embed"
import { PdfEmbed } from "./embeds/pdf-embed"
import { DocxEmbed } from "./embeds/docx-embed"
import { FileEmbed } from "./embeds/file-embed"

export function AttachmentEmbedView({
  node,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const {
    attachmentId,
    fileName,
    mimeType,
    sizeBytes,
    displaySize,
  } = node.attrs

  async function handleDelete() {
    try {
      await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" })
    } catch {
      // best-effort server cleanup
    }
    deleteNode()
  }

  function selectNode() {
    if (editor && typeof getPos === "function") {
      const pos = getPos()
      if (typeof pos === "number") {
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, pos)
          )
        )
        editor.view.focus()
      }
    }
  }

  function handleCopy() {
    selectNode()
    document.execCommand("copy")
  }

  function handleCut() {
    selectNode()
    document.execCommand("cut")
  }

  const isImage = isImageMime(mimeType)

  return (
    <NodeViewWrapper
      className={`group/embed relative my-3 w-fit ${selected ? "ring-2 ring-primary/40 rounded-lg" : ""}`}
      data-drag-handle=""
    >
      <AttachmentToolbar
        attachmentId={attachmentId}
        displaySize={displaySize}
        onResize={(size) => updateAttributes({ displaySize: size })}
        onDelete={handleDelete}
        onCut={handleCut}
        onCopy={handleCopy}
      />

      {isImage ? (
        <ImageEmbed
          attachmentId={attachmentId}
          fileName={fileName}
          displaySize={displaySize}
        />
      ) : isPdfMime(mimeType) ? (
        <PdfEmbed
          attachmentId={attachmentId}
          fileName={fileName}
          sizeBytes={sizeBytes}
          displaySize={displaySize}
        />
      ) : isDocxMime(mimeType) ? (
        <DocxEmbed
          attachmentId={attachmentId}
          fileName={fileName}
          sizeBytes={sizeBytes}
          displaySize={displaySize}
        />
      ) : (
        <FileEmbed
          attachmentId={attachmentId}
          fileName={fileName}
          mimeType={mimeType}
          sizeBytes={sizeBytes}
          displaySize={displaySize}
        />
      )}
    </NodeViewWrapper>
  )
}
