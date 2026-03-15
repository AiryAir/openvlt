import {
  FileTextIcon,
  FileIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileCodeIcon,
  ImageIcon,
} from "lucide-react"
import type { ComponentType } from "react"

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/")
}

export function isPdfMime(mime: string): boolean {
  return mime === "application/pdf"
}

export function isDocxMime(mime: string): boolean {
  return mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

export function getFileIcon(
  mime: string
): ComponentType<{ className?: string }> {
  if (isImageMime(mime)) return ImageIcon
  if (isPdfMime(mime)) return FileTextIcon
  if (isDocxMime(mime)) return FileTextIcon
  if (mime.startsWith("video/")) return FileVideoIcon
  if (mime.startsWith("audio/")) return FileAudioIcon
  if (mime === "application/zip" || mime === "application/x-tar")
    return FileArchiveIcon
  if (mime === "text/csv" || mime === "application/json")
    return FileSpreadsheetIcon
  if (
    mime === "text/javascript" ||
    mime === "text/html" ||
    mime === "text/css" ||
    mime === "application/xml"
  )
    return FileCodeIcon
  return FileIcon
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const PRESET_PX: Record<string, number | undefined> = {
  xs: 150,
  small: 240,
  medium: 400,
  large: 640,
  full: undefined,
}

export function resolveWidth(
  displaySize: string
): { widthPx: number | undefined; heightPx: number | undefined; isFull: boolean } {
  if (displaySize in PRESET_PX)
    return { widthPx: PRESET_PX[displaySize], heightPx: undefined, isFull: displaySize === "full" }

  // Custom format: "400", "400x300", "400x", "x300"
  if (displaySize.includes("x")) {
    const [wStr, hStr] = displaySize.split("x")
    const w = parseInt(wStr, 10)
    const h = parseInt(hStr, 10)
    return {
      widthPx: w > 0 ? w : undefined,
      heightPx: h > 0 ? h : undefined,
      isFull: false,
    }
  }

  const px = parseInt(displaySize, 10)
  return { widthPx: px > 0 ? px : undefined, heightPx: undefined, isFull: false }
}

export function getFileLabel(mime: string): string {
  if (isImageMime(mime)) return "Image"
  if (isPdfMime(mime)) return "PDF"
  if (isDocxMime(mime)) return "DOCX"
  if (mime.startsWith("video/")) return "Video"
  if (mime.startsWith("audio/")) return "Audio"
  if (mime === "application/zip") return "ZIP"
  if (mime === "text/csv") return "CSV"
  if (mime === "application/json") return "JSON"
  return "File"
}
