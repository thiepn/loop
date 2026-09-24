# Loop — Worlds, Snapshots & Persistence

## Status
Phase 10 implementation contract.

Phase 10 makes Loop durable without introducing accounts, cloud sync, or a backend.

Persistence is browser-local and uses IndexedDB.

## State boundaries

Loop now distinguishes three kinds of state.

### 1. WorldDocument
The serializable creative document.

Contains:
- musical settings;
- Sound Orbs;
- patterns;
- Motion;
- Effect Fields;
- playground toys;
- Links;
- Snapshots.

### 2. Library metadata
Stored outside the World.

Contains:
- last-opened time;
- deleted/trash time;
- active-World pointer.

These values describe how the app manages a World rather than what the World sounds like.

### 3. Transient application state
Not persisted as part of the World.

Examples:
- current selection;
- open sheets/palettes;
- playback state;
- Magic preview transaction;
- Motion frame positions;
- undo/redo stacks;
- autosave status;
- queued Snapshot recall.

## World schema v8

Phase 10 advances:

v7 → v8

The only persistent creative-model change is replacing:

`snapshots: string[]`

with:

`snapshots: SnapshotDocument[]`

A Snapshot stores a playable creative payload but **does not contain the World Snapshot list**.

This avoids recursive documents.

## Snapshot model

A Snapshot contains:
- id;
- name;
- createdAt;
- state.

Snapshot state contains:
- music;
- Sound Orbs;
- Effect Fields;
- playground toys;
- Links.

Snapshot count is capped at **8 per World**.

### Recall behavior
Recall preserves:
- World id;
- World name;
- createdAt;
- Snapshot collection.

It replaces only the playable creative state.

If playback is stopped, recall is immediate.

If playback is running, recall is queued to the next bar using the existing MusicalTransport quantization clock.

If another material World edit occurs before a queued recall fires, the pending recall is cancelled rather than overwriting the newer edit.

Snapshots remain states, not a song timeline.

## IndexedDB layout

Database:
`loop-local`

Current IndexedDB schema version:
`1`

Object stores:

### worlds
Key:
`id`

Record:
- id;
- raw World payload;
- lastOpenedAt;
- deletedAt.

### meta
Stores the active-World pointer.

Current key:
`active-world`

### quarantine
Stores unrecoverable records removed from the active library.

A versionchange event closes the current connection so another tab/version can upgrade rather than remaining blocked by a stale connection.

## Repository boundary

App does not issue IndexedDB requests directly.

`WorldRepository` owns:
- library listing;
- load;
- save;
- active World;
- Trash;
- restore;
- permanent delete;
- duplicate;
- imported-copy creation;
- migration on load;
- quarantine.

A MemoryWorldStorage implements the same interface for deterministic unit tests.

## Startup restoration

At startup:

1. open IndexedDB;
2. read the active World id;
3. migrate/validate that World;
4. restore it into the playground;
5. keep playback stopped because browser audio requires a fresh user gesture.

The restored screen tells the user to press Play.

If there is no active World, Loop opens Home normally.

If the user begins navigating before asynchronous startup hydration finishes, that explicit user choice wins and the older active World is not allowed to overwrite it.

## Active World semantics

While a World is open in the playground, its id is stored as the active World.

When the user intentionally returns Home:
- the latest World state is saved;
- active World is cleared;
- the Home library becomes the startup destination.

Therefore:
- refresh/restart while editing → restore that World;
- return Home, then refresh → remain at Home.

## Autosave

Material World changes are debounced for approximately **450 ms**.

Autosave ignores:
- selection changes;
- open/closed panels;
- playback state;
- Magic preview Worlds.

A Magic preview is not persisted.

After Keep, the accepted World becomes eligible for autosave.

After Revert, the base World remains authoritative.

### Hidden-page flush
When the document becomes hidden, Loop attempts to flush a pending autosave.

This reduces loss when:
- switching apps;
- changing tabs;
- putting a mobile browser in the background.

### Home transition
Returning Home performs a final save.

Library operations wait for that save to settle, preventing races such as:

save old World ↔ Trash old World

or:

save old World ↔ make a new active World

Starter audio initialization is started before persistence awaits, preserving the browser user gesture required by Web Audio.

## World library

Home now contains **Your Worlds** above the starter templates.

Each saved World supports:
- Open;
- Rename;
- Duplicate;
- Backup;
- Trash.

Creating any starter World creates a normal saved World.

There is no separate starter-project format.

## Trash and recovery

Delete from the active library means **move to Recently Deleted**.

The record remains in IndexedDB with `deletedAt`.

Trash supports:
- Restore;
- Delete permanently.

A trashed World cannot be restored as the active World automatically.

Permanent delete removes the record.

Trash is user-facing recovery.

## Quarantine

Quarantine is separate from Trash.

Trash contains valid Worlds intentionally deleted by the user.

Quarantine contains structurally unrecoverable persistence records.

On migration/load failure:
1. best-effort copy raw payload into quarantine;
2. remove the invalid primary library record;
3. continue loading recoverable Worlds.

This prevents one corrupt record from crashing the entire library.

## Schema migration

`migrateWorldDocument(raw)` accepts historical Loop schemas.

Current behavior:

### v1–v4
Keeps recoverable Sound Orbs/music.

Collections that had not become real systems yet are initialized safely.

### v5
Effect Fields can migrate.

### v6
Motion/playground toys can migrate.

### v7
Typed Links can migrate.

Legacy Snapshot placeholders are discarded.

### v8
Typed Snapshots are validated and preserved.

### Future versions
A World whose schema version is newer than the current runtime is rejected explicitly.

Loop does not guess how to downgrade unknown future data.

## Migration sanitation

Child objects are checked independently.

Recoverable World roots can survive individual damaged child records.

Migration can:
- clamp normalized coordinates;
- normalize pattern arrays;
- normalize Motion values;
- enforce current field/toy types;
- enforce current Link validation rules;
- drop duplicate/invalid child ids;
- report warnings.

Invalid root documents, such as missing World ids, are treated as corruption.

## Undo / redo

Phase 10 adds general in-memory World history.

History:
- records immutable World-document changes;
- ignores UI-only state;
- ignores transient Magic previews;
- resets when switching Worlds;
- clears redo after a new branch;
- keeps at most **64 past World states**.

Controls:
- top-bar Undo;
- top-bar Redo.

Keyboard:
- Ctrl/Cmd + Z → Undo;
- Ctrl/Cmd + Shift + Z → Redo;
- Ctrl/Cmd + Y → Redo.

Keyboard shortcuts do not intercept text-entry/contenteditable controls.

Undo/redo results autosave like ordinary material changes.

The history stack itself is intentionally not persisted across browser restarts.

## Magic and history

Phase 9 preview semantics remain intact.

During Magic preview:
- history does not record Retry attempts;
- autosave does not persist the preview.

On Keep:
- the final accepted World becomes one history step.

On Revert:
- history remains at the original World.

The Phase 9 one-step Undo Magic continues to coexist with general Phase 10 history.

## Backup format

Backup envelope:

- format: `loop-world-backup`;
- version: `1`;
- exportedAt;
- Worlds array.

The envelope is ordinary JSON.

Home supports:
- Backup one World;
- Backup All;
- Import Backup.

The Snapshot sheet can also back up the current World.

## Import safety

Backup decoding:
- validates the envelope;
- migrates each recoverable World;
- reports per-World warnings;
- skips unrecoverable Worlds when other valid Worlds remain;
- rejects a backup with no recoverable Worlds.

Imported Worlds are always created as **new local copies** with new World ids.

Import never silently overwrites an existing local World.

Snapshot ids inside an imported World may remain unchanged because they are scoped to that new World.

## Storage errors

Persistence errors are classified.

Important categories:
- unavailable;
- quota;
- corrupt;
- future-version;
- invalid-backup;
- unknown.

Quota errors produce actionable messaging telling the user to export/remove Worlds.

Storage failure does not crash the musical app; Loop can continue as an unsaved playground.

## Save status

The playground top bar exposes a minimal state:

- Local
- Saving…
- Saved
- Save failed / Not saved

No filesystem concepts are required.

## Performance

Persistence is event/debounce driven.

Phase 10 adds no:
- render loop;
- audio processing;
- worker;
- network request;
- backend.

IndexedDB writes store the bounded World document.

Motion live positions are not serialized.

## Scope boundary

Phase 10 does not add:
- cloud sync;
- accounts;
- collaboration;
- server database;
- multi-device sync;
- persistent cross-session undo history;
- recording/audio export;
- PWA service worker/offline shell.

Recording/export belongs to Phase 11.

PWA/offline hardening belongs to Phase 13.

## Acceptance principle

Phase 10 succeeds when a user can:

1. create a World;
2. edit it;
3. refresh the browser;
4. get that World back;
5. return Home and see it in Your Worlds;
6. rename/duplicate/trash/restore it;
7. save and recall Snapshots;
8. undo/redo creative edits;
9. export a JSON backup;
10. import it safely as a new World;
11. recover from an old schema/corrupt sibling record without losing the whole library.
