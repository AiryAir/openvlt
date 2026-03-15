import type { Editor } from "@tiptap/core"
import { toast } from "sonner"

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
])

interface UploadResult {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

async function uploadFile(
  noteId: string,
  file: File
): Promise<UploadResult> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`/api/notes/${noteId}/attachments`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Upload failed")
  }

  return res.json()
}

function insertAttachment(editor: Editor, result: UploadResult) {
  editor.commands.insertAttachmentEmbed({
    attachmentId: result.id,
    fileName: result.fileName,
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    displaySize: IMAGE_TYPES.has(result.mimeType) ? "large" : "medium",
  })
}

/**
 * Upload one or more files and insert them into the editor.
 */
function isDirectory(file: File): boolean {
  return file.size === 0 && file.type === ""
}

export async function uploadAndInsert(
  editor: Editor,
  noteId: string,
  files: FileList | File[]
) {
  for (const file of Array.from(files)) {
    if (isDirectory(file)) {
      toast.error(`"${file.name}" is a folder. Only files can be attached to notes.`)
      continue
    }
    try {
      const result = await uploadFile(noteId, file)
      insertAttachment(editor, result)
    } catch (e) {
      console.error("Attachment upload failed:", e)
    }
  }
}

/**
 * Open a file picker and upload the selected files.
 */
export function pickAndUpload(
  editor: Editor,
  noteId: string,
  accept?: string
) {
  const input = document.createElement("input")
  input.type = "file"
  input.multiple = true
  if (accept) input.accept = accept

  input.addEventListener("change", () => {
    if (input.files?.length) {
      uploadAndInsert(editor, noteId, input.files)
    }
  })

  input.click()
}
