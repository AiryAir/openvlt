import fs from "fs"
import path from "path"
import { createNote } from "@/lib/notes"
import { saveAttachment } from "@/lib/attachments"
import { getVaultPath } from "@/lib/vaults/service"
import type { NoteMetadata } from "@/types"

/**
 * Generate a sample SVG image as a Buffer.
 */
function generateSampleImage(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e94560"/>
      <stop offset="100%" style="stop-color:#ff6b6b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#bg)" rx="12"/>
  <rect x="40" y="180" width="120" height="4" fill="url(#accent)" rx="2" opacity="0.8"/>
  <text x="40" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" fill="#ffffff">openvlt</text>
  <text x="40" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#a0a0b8">Your notes, your files, your vault.</text>
  <g transform="translate(580, 100)" opacity="0.15">
    <rect x="0" y="0" width="180" height="220" rx="8" fill="#ffffff"/>
    <rect x="20" y="30" width="100" height="8" rx="4" fill="#333"/>
    <rect x="20" y="50" width="140" height="6" rx="3" fill="#666"/>
    <rect x="20" y="66" width="120" height="6" rx="3" fill="#666"/>
    <rect x="20" y="82" width="130" height="6" rx="3" fill="#666"/>
    <rect x="20" y="108" width="80" height="8" rx="4" fill="#333"/>
    <rect x="20" y="128" width="140" height="6" rx="3" fill="#666"/>
    <rect x="20" y="144" width="100" height="6" rx="3" fill="#666"/>
  </g>
  <g transform="translate(620, 280)" opacity="0.1">
    <circle cx="30" cy="30" r="30" fill="#e94560"/>
    <circle cx="90" cy="30" r="30" fill="#ffffff"/>
    <circle cx="60" cy="60" r="30" fill="#533483"/>
  </g>
</svg>`
  return Buffer.from(svg, "utf-8")
}

/**
 * Generate a minimal valid PDF as a Buffer.
 */
function generateSamplePdf(): Buffer {
  const title = "openvlt Sample Document"
  const lines = [
    "Welcome to openvlt!",
    "",
    "This is a sample PDF document embedded in your welcome note.",
    "openvlt supports inline PDF viewing — click the attachment to",
    "open it in the built-in viewer.",
    "",
    "You can attach PDFs to any note by dragging them into the",
    "editor or using the attachment button in the toolbar.",
  ]

  // Build PDF objects
  const objects: string[] = []

  // Obj 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")

  // Obj 2: Pages
  objects.push(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj"
  )

  // Obj 3: Page
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj"
  )

  // Build content stream
  const contentLines = [
    "BT",
    "/F2 24 Tf",
    "72 700 Td",
    `(${title}) Tj`,
    "/F1 12 Tf",
    "0 -40 Td",
  ]
  for (const line of lines) {
    contentLines.push(`(${line}) Tj`)
    contentLines.push("0 -18 Td")
  }
  contentLines.push("ET")
  const stream = contentLines.join("\n")

  // Obj 4: Content stream
  objects.push(
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`
  )

  // Obj 5: Font (regular)
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
  )

  // Obj 6: Font (bold)
  objects.push(
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj"
  )

  // Build the full PDF
  let pdf = "%PDF-1.4\n"
  const offsets: number[] = []
  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj + "\n"
  }

  const xrefOffset = pdf.length
  pdf += "xref\n"
  pdf += `0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  }

  pdf += "trailer\n"
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += "startxref\n"
  pdf += `${xrefOffset}\n`
  pdf += "%%EOF"

  return Buffer.from(pdf, "utf-8")
}

/**
 * Generate a minimal valid DOCX as a Buffer.
 * A DOCX is a ZIP containing XML files.
 */
function generateSampleDocx(): Buffer {
  // We'll create the DOCX by constructing the ZIP manually using a minimal approach.
  // A DOCX needs: [Content_Types].xml, _rels/.rels, word/document.xml, word/_rels/document.xml.rels

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="48"/></w:rPr><w:t>openvlt Sample Document</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:t>This is a sample DOCX document embedded in your welcome note.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>openvlt supports DOCX preview — click the attachment to open it in the built-in viewer.</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:t>You can attach Word documents to any note by dragging them into the editor or using the attachment button in the toolbar.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`

  // Build ZIP file manually (store method, no compression)
  const files: { name: string; data: Buffer }[] = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes) },
    { name: "_rels/.rels", data: Buffer.from(rels) },
    { name: "word/document.xml", data: Buffer.from(document) },
    {
      name: "word/_rels/document.xml.rels",
      data: Buffer.from(documentRels),
    },
  ]

  return buildZip(files)
}

/** Build a minimal ZIP file from an array of {name, data} entries (store method). */
function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const localHeaders: Buffer[] = []
  const centralHeaders: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf-8")
    const data = file.data

    // Local file header (30 bytes + name + data)
    const local = Buffer.alloc(30 + nameBuffer.length)
    local.writeUInt32LE(0x04034b50, 0) // signature
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(0, 8) // compression (store)
    local.writeUInt16LE(0, 10) // mod time
    local.writeUInt16LE(0, 12) // mod date
    local.writeUInt32LE(crc32(data), 14) // crc32
    local.writeUInt32LE(data.length, 18) // compressed size
    local.writeUInt32LE(data.length, 22) // uncompressed size
    local.writeUInt16LE(nameBuffer.length, 26) // name length
    local.writeUInt16LE(0, 28) // extra length
    nameBuffer.copy(local, 30)

    localHeaders.push(local)
    localHeaders.push(data)

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuffer.length)
    central.writeUInt32LE(0x02014b50, 0) // signature
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0, 8) // flags
    central.writeUInt16LE(0, 10) // compression
    central.writeUInt16LE(0, 12) // mod time
    central.writeUInt16LE(0, 14) // mod date
    central.writeUInt32LE(crc32(data), 16) // crc32
    central.writeUInt32LE(data.length, 20) // compressed size
    central.writeUInt32LE(data.length, 24) // uncompressed size
    central.writeUInt16LE(nameBuffer.length, 28) // name length
    central.writeUInt16LE(0, 30) // extra length
    central.writeUInt16LE(0, 32) // comment length
    central.writeUInt16LE(0, 34) // disk start
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0, 38) // external attrs
    central.writeUInt32LE(offset, 42) // local header offset
    nameBuffer.copy(central, 46)

    centralHeaders.push(central)
    offset += local.length + data.length
  }

  const centralDirOffset = offset
  const centralDir = Buffer.concat(centralHeaders)
  const centralDirSize = centralDir.length

  // End of central directory (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // signature
  eocd.writeUInt16LE(0, 4) // disk number
  eocd.writeUInt16LE(0, 6) // central dir disk
  eocd.writeUInt16LE(files.length, 8) // entries on disk
  eocd.writeUInt16LE(files.length, 10) // total entries
  eocd.writeUInt32LE(centralDirSize, 12) // central dir size
  eocd.writeUInt32LE(centralDirOffset, 16) // central dir offset
  eocd.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...localHeaders, centralDir, eocd])
}

/** Simple CRC-32 implementation for ZIP. */
function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

/**
 * Build welcome note markdown with real attachment IDs embedded.
 */
function buildWelcomeContent(
  imageId: string,
  imageSize: number,
  pdfId: string,
  pdfSize: number,
  docxId: string,
  docxSize: number
): string {
  return `# Welcome to openvlt

Welcome to your new vault! This note showcases everything the editor can do. Feel free to edit, experiment, or delete it.

---

## Text Formatting

You can write in **bold**, *italic*, __underline__, and ~~strikethrough~~. Combine them for ***bold italic*** text. Use \`inline code\` for technical terms.

[Links](https://openvlt.com) work just like standard Markdown.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

> **Tip:** Click the chevron next to any heading to fold/collapse the section beneath it.

---

## Lists

### Bullet List

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Numbered List

1. Step one
2. Step two
   1. Sub-step
   2. Another sub-step
3. Step three

### Task List

- [x] Create a vault
- [x] Open the welcome note
- [ ] Try the slash command menu (type \`/\`)
- [ ] Create your first note
- [ ] Explore the command palette (\`Cmd+K\`)

---

## Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

> Blockquotes can contain **formatted text**, *italics*, and even nested content.

---

## Code Blocks

Inline: \`const x = 42\`

Fenced code block with syntax highlighting:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}! Welcome to openvlt.\`
}
\`\`\`

\`\`\`python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

---

## Tables

| Feature        | Shortcut       | Description                    |
| -------------- | -------------- | ------------------------------ |
| New Note       | \`Cmd+O\`      | Create a new note              |
| Command Palette| \`Cmd+K\`      | Search notes and run actions   |
| Daily Note     | \`Cmd+Shift+D\`| Open or create today's note    |
| Graph View     | \`Cmd+Shift+G\`| Visualize note connections     |
| Toggle Sidebar | \`Cmd+B\`      | Show or hide the sidebar       |

> **Tip:** Tables are resizable — drag column borders to adjust widths.

---

## Callout Blocks

> [!NOTE]
> This is a **note** callout. Use it for general information.

> [!TIP]
> This is a **tip** callout. Use it for helpful suggestions.

> [!WARNING]
> This is a **warning** callout. Use it for important cautions.

> [!DANGER]
> This is a **danger** callout. Use it for critical warnings.

---

## Toggle Blocks

<details open>
<summary>Click to collapse this section</summary>
<div data-toggle-content>

Toggle blocks let you hide content behind a clickable header. They're great for FAQs, spoilers, or keeping long notes tidy.

</div>
</details>

<details>
<summary>Keyboard shortcuts cheat sheet</summary>
<div data-toggle-content>

- **Cmd+O** — New note
- **Cmd+K** — Command palette
- **Cmd+B** — Toggle sidebar
- **Cmd+Shift+D** — Daily note
- **Cmd+Shift+G** — Graph view
- **Cmd+Shift+F** — Advanced search
- **Cmd+W** — Close tab
- **Cmd+,** — Settings

</div>
</details>

---

## Horizontal Rules

Use three dashes to create a divider:

---

## Images & Attachments

You can add images and files to any note:

- **Drag and drop** a file into the editor
- **Paste** an image from your clipboard
- **Use the toolbar** — click the image or attachment button

### Sample Image

Here's an embedded image — right-click it to resize, or drag the handles:

<div data-image-embed><img src="/api/attachments/${imageId}" alt="openvlt-sample.svg" width="640" data-attachment-id="${imageId}" data-mimetype="image/svg+xml" data-size-bytes="${imageSize}"></div>

### Sample PDF

Click the attachment below to open the built-in PDF viewer:

<div data-attachment data-attachment-id="${pdfId}" data-filename="openvlt-sample.pdf" data-mimetype="application/pdf" data-size-bytes="${pdfSize}" data-display-size="medium"></div>

### Sample Word Document

Click to preview this DOCX file in the built-in viewer:

<div data-attachment data-attachment-id="${docxId}" data-filename="openvlt-sample.docx" data-mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-size-bytes="${docxSize}" data-display-size="medium"></div>

### Image Sizes

Images can be resized to these presets:
- **Extra small** — 150px
- **Small** — 240px
- **Medium** — 400px
- **Large** — 640px
- **Full width** — stretches to fit

### Supported File Types

- **Images:** PNG, JPEG, GIF, WebP, SVG
- **Documents:** PDF (with embedded viewer), DOCX (with preview)
- **Any file** can be attached and will appear as a download link

---

## Slash Commands

Type \`/\` anywhere in the editor to open the command menu. Available commands:

- \`/Heading 1\`, \`/Heading 2\`, \`/Heading 3\`
- \`/Bullet List\`, \`/Numbered List\`, \`/Task List\`
- \`/Blockquote\`, \`/Code Block\`
- \`/Table\`, \`/Horizontal Rule\`
- \`/Callout\` (Note, Tip, Warning, Danger)
- \`/Toggle Block\`

---

## More Features

### Favorites
Star any note to pin it in the **Favorites** section of the sidebar.

### Tags
Organize notes with tags. Add them from the note header.

### Version History
Every save creates a snapshot. Browse and restore previous versions from the note menu.

### Note Linking
Link to other notes using \`[[Note Title]]\` syntax. View backlinks in the panel.

### Graph View
Open with \`Cmd+Shift+G\` to see how your notes connect to each other.

### Full-Text Search
Find anything with \`Cmd+K\` or use **Advanced Search** (\`Cmd+Shift+F\`) for filters.

### Locked Notes
Encrypt sensitive notes with a password using AES-256 encryption.

### Export
Export your entire vault as a ZIP from Settings.

### Templates
Use templates for common note types: meeting notes, daily journals, project briefs.

---

Happy writing!
`
}

export function createWelcomeNote(userId: string, vaultId: string): NoteMetadata {
  // Create the note first with placeholder content
  const note = createNote(
    "Welcome to openvlt",
    userId,
    vaultId,
    null,
    "# Welcome to openvlt\n"
  )

  // Generate and attach sample files
  const imageBuffer = generateSampleImage()
  const pdfBuffer = generateSamplePdf()
  const docxBuffer = generateSampleDocx()

  const image = saveAttachment(
    note.id,
    userId,
    vaultId,
    "openvlt-sample.svg",
    imageBuffer,
    "image/svg+xml"
  )

  const pdf = saveAttachment(
    note.id,
    userId,
    vaultId,
    "openvlt-sample.pdf",
    pdfBuffer,
    "application/pdf"
  )

  const docx = saveAttachment(
    note.id,
    userId,
    vaultId,
    "openvlt-sample.docx",
    docxBuffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )

  // Build final content with real attachment IDs
  const content = buildWelcomeContent(
    image.id,
    image.sizeBytes,
    pdf.id,
    pdf.sizeBytes,
    docx.id,
    docx.sizeBytes
  )

  // Update the note file on disk
  const vaultRoot = getVaultPath(vaultId)
  const fullPath = path.join(vaultRoot, note.filePath)
  fs.writeFileSync(fullPath, content, "utf-8")

  return note
}
