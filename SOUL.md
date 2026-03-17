# The openvlt Manifesto

## Your notes are yours

openvlt exists because we believe your notes belong to you. Not to a company, not to a cloud provider, not to a proprietary database. Every decision we make starts from this principle.

## Plain files on disk, always

Your notes are Markdown files in a folder. Open them in Finder, edit them in Vim, back them up with rsync, read them in 20 years. There is no proprietary format, no binary blob, no database you need to query to see your own writing. The `.md` file on disk is always the source of truth.

## No lock-in, by design

If you use Obsidian today, you can point openvlt at your vault and everything works. If you decide to leave openvlt tomorrow, you take your folder of Markdown files with you -- no export step, no conversion, no data loss. We succeed only if leaving is easy.

## An open standard, not a product

We want the openvlt vault format (directories + Markdown + attachments) to be something any app can read and write without reverse-engineering anything. We avoid custom file formats, proprietary metadata schemas, and non-standard conventions wherever possible. The litmus test for every design decision: "Can another tool work with this vault without knowing openvlt exists?"

## Self-hosted and private

Your notes never touch a server you don't control. openvlt is self-hosted. You run it on your own hardware, your own cloud instance, your own NAS. Sync is peer-to-peer between your own instances, authenticated with shared secrets. No central server ever sees your content.

## Offline-first

You should be able to write, organize, and search your notes without an internet connection. Sync happens when peers reconnect, and conflicts are resolved transparently. The app never blocks you because a server is unreachable.

## Open source, truly

The code is open. Not "source-available with a commercial license". Open. You can read it, modify it, self-host it, and contribute to it. We believe the best way to earn trust with a tool that holds your private thoughts is to let you verify exactly what it does.

## Minimal proprietary surface

When we need metadata beyond what Markdown provides (tags, favorites, version history), we store it in SQLite, an open, universally-supported format. We never invent a new format when a standard one exists. We never add a feature that compromises the portability of the vault.

## Encryption that respects you

Locked notes use AES-256-GCM with keys derived from your password. We never hold your encryption keys. If you forget your password, even we cannot read your notes. That's the point. Recovery is through a mnemonic you control, not a "forgot password" flow that requires trusting us.

## Built for people who care about their data

openvlt is for people who have been burned by apps that shut down, lock you out, or hold your data hostage behind an export button. We are building the notes app we wished existed. One that treats your data with the respect it deserves.
