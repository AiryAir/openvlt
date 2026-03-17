# Frequently Asked Questions

## Why doesn't openvlt sync instantly like Google Docs?

This is an intentional architectural decision. Our sync is **peer-to-peer (P2P) between self-hosted openvlt instances**, not client-to-centralized-server like Google Docs.

### How our sync works

1. The editor waits 800ms after your last keystroke, then saves the note
2. The save writes the `.md` file to disk and appends an entry to the sync log
3. A file watcher detects the change and broadcasts it via Server-Sent Events (SSE) to connected peers
4. The remote peer receives the event, pulls the changes, and applies them with a three-way merge

Total propagation latency is roughly 1.3-2 seconds from keystroke to remote peer.

### Why it's different from Google Docs

Google Docs uses Operational Transform (OT) with a centralized server -- every keystroke is sent as a micro-operation and merged in real-time. That requires:

- A **central server** mediating all edits (openvlt is decentralized and self-hosted)
- **Character-level conflict resolution** (openvlt works at the document level with three-way merge)
- An **always-online** assumption (openvlt supports offline-first with queued sync)

Our architecture is closer to Git -- document-level snapshots synced between peers. This is intentional because:

- **Files on disk are the source of truth.** Your notes are browseable `.md` files, not entries in a proprietary database.
- **Offline-first.** You keep working without a connection. Changes sync when peers reconnect.
- **Privacy.** No central server ever sees your content. Sync is peer-to-peer with HMAC-signed requests.
- **Simplicity.** OT/CRDT at the character level is enormously complex to implement and maintain correctly.

### The tradeoff

We sacrifice keystroke-level collaboration (two people editing the same note simultaneously) in exchange for privacy, offline support, and the open `.md` file format. If two peers edit the same note at the same time, conflicts are resolved via three-way merge or a `.conflict.md` file the user can review.

openvlt is more like **Obsidian Sync** (document-level, async) than **Google Docs** (character-level, real-time) -- and that's by design.
