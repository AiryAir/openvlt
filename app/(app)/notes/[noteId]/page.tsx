import { notFound } from "next/navigation"
import { getNote } from "@/lib/notes"
import { requireAuthWithVault } from "@/lib/auth/middleware"
import { TabActivator } from "@/components/tab-activator"

export default async function NotePage({
  params,
}: {
  params: Promise<{ noteId: string }>
}) {
  const { user, vaultId } = await requireAuthWithVault()
  const { noteId } = await params
  const note = getNote(noteId, user.id, vaultId)

  if (!note) {
    notFound()
  }

  return <TabActivator noteId={note.metadata.id} title={note.metadata.title} />
}
