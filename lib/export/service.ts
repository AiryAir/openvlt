import fs from "fs"
import archiver from "archiver"
import { getVaultPath } from "@/lib/vaults/service"

export async function exportAllNotes(vaultId: string): Promise<Buffer> {
  const vaultDir = getVaultPath(vaultId)

  if (!fs.existsSync(vaultDir)) {
    throw new Error("Vault directory not found")
  }

  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk)
    })

    archive.on("end", () => {
      resolve(Buffer.concat(chunks))
    })

    archive.on("error", (err: Error) => {
      reject(err)
    })

    archive.directory(vaultDir, false)
    archive.finalize()
  })
}
