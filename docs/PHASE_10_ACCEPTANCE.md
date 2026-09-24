# Phase 10 — Worlds, Snapshots & Persistence Acceptance

## World schema
- [x] World schema advanced to version 8.
- [x] Snapshot placeholder strings replaced by typed SnapshotDocument values.
- [x] Snapshot state excludes the Snapshot collection itself.
- [x] Current starter Worlds remain ordinary WorldDocument values.

## IndexedDB
- [x] Native IndexedDB backend exists.
- [x] No persistence dependency/library was added.
- [x] worlds object store exists.
- [x] meta object store exists.
- [x] quarantine object store exists.
- [x] Active World metadata is stored separately from creative World data.
- [x] versionchange closes stale DB connections.
- [x] Browser-storage failures are classified.

## Repository
- [x] App does not directly issue IndexedDB requests.
- [x] WorldRepository lists Worlds.
- [x] WorldRepository loads/saves Worlds.
- [x] Active World get/set exists.
- [x] Trash exists.
- [x] Restore exists.
- [x] Permanent delete exists.
- [x] Duplicate creates a new World id.
- [x] Import creates new World ids rather than overwriting.
- [x] Non-destructive read can avoid changing lastOpenedAt.
- [x] MemoryWorldStorage supports deterministic tests.

## Startup / restore
- [x] Last active World restores after refresh/restart.
- [x] Restored playback remains stopped until a new user gesture.
- [x] Returning Home clears active World.
- [x] User navigation during async bootstrap wins over stale startup restore.
- [x] New starter playback begins audio initialization before IndexedDB awaits.

## Autosave
- [x] World changes autosave.
- [x] Autosave is debounced.
- [x] UI-only AppState changes do not create World saves.
- [x] Magic previews are excluded.
- [x] Kept Magic becomes savable.
- [x] Hidden-page event attempts pending-save flush.
- [x] Returning Home performs a final save.
- [x] Home save is serialized before library destructive operations.
- [x] Home save cannot later re-mark the old World active after navigation.
- [x] Save status is visible.
- [x] Quota failure produces a recoverable app state rather than fatal startup failure.

## Library
- [x] Home displays Your Worlds.
- [x] Saved World can open.
- [x] Saved World can rename.
- [x] Saved World can duplicate.
- [x] Saved World can back up.
- [x] World can move to Recently Deleted.
- [x] Recently Deleted World can restore.
- [x] Recently Deleted World can delete permanently.
- [x] Backup All exists.
- [x] Import Backup exists.
- [x] Starter templates remain visible below the library.

## Migration
- [x] v1–v4 can recover core music/Sound Orbs.
- [x] v5 can recover Effect Fields.
- [x] v6 can recover toys/Motion.
- [x] v7 can recover typed Links.
- [x] v7 legacy Snapshot placeholders migrate to empty typed Snapshots.
- [x] v8 typed Snapshots are preserved.
- [x] Unsupported future schema is rejected explicitly.
- [x] Invalid root is rejected.
- [x] Invalid recoverable child records can be dropped with warnings.
- [x] Current Link rules are revalidated during migration.

## Corruption / quarantine
- [x] Unrecoverable stored World is quarantined best-effort.
- [x] Corrupt primary record is removed from normal library.
- [x] One corrupt World does not block listing other recoverable Worlds.
- [x] Corruption is distinct from user Trash.

## Snapshots
- [x] Snapshot cap is 8.
- [x] Save Snapshot exists.
- [x] Cancelled name prompt does not create a Snapshot.
- [x] Snapshot rename exists.
- [x] Snapshot delete exists.
- [x] Snapshot recall preserves World id/name/Snapshot list.
- [x] Paused recall is immediate.
- [x] Playing recall queues to next bar.
- [x] New material edit cancels a pending queued recall.
- [x] Snapshot add/rename/delete/recall participates in general history.
- [x] Snapshots serialize in backups.

## Undo / redo
- [x] General World history exists.
- [x] History is bounded to 64 past states.
- [x] UI-only changes are not history entries.
- [x] Magic preview retries are not history entries.
- [x] Magic Keep becomes one history entry.
- [x] Redo clears after a new branch.
- [x] History resets when switching Worlds.
- [x] Undo button exists.
- [x] Redo button exists.
- [x] Ctrl/Cmd+Z exists.
- [x] Ctrl/Cmd+Shift+Z exists.
- [x] Ctrl/Cmd+Y exists.
- [x] Shortcuts ignore text-entry/contenteditable controls.
- [x] Undo/redo Worlds autosave normally.

## Backup
- [x] Backup envelope has explicit format identifier.
- [x] Backup envelope version is 1.
- [x] Backup contains exportedAt.
- [x] Current Worlds round-trip.
- [x] Typed Snapshots round-trip.
- [x] Recoverable legacy Worlds migrate during import.
- [x] Bad backup JSON is rejected.
- [x] Wrong backup format/version is rejected.
- [x] A bad World can be skipped when other backup Worlds recover.
- [x] Backup with no recoverable Worlds is rejected.
- [x] Import does not overwrite existing World ids.

## Automated coverage
Tests cover:
- Snapshot capture/recall/rename/delete/cap;
- bounded undo/redo branching/reset;
- v7→v8 migration;
- old missing-collection migration;
- typed v8 Snapshot migration;
- corrupt child recovery;
- invalid root rejection;
- future-schema rejection;
- backup round-trip;
- backup Snapshot preservation;
- legacy backup migration;
- malformed backup rejection;
- partial backup recovery;
- repository save/list/active restore;
- Trash/restore/purge;
- duplicate/import identities;
- corruption quarantine;
- non-destructive reads;
- quota classification;
- all Phase 1–9 regression tests.

## Scope protection
- [x] No account system.
- [x] No cloud backend.
- [x] No cross-device sync.
- [x] No collaboration.
- [x] No persistent cross-session undo stack.
- [x] No recording/export implemented early.
- [x] No PWA/offline service-worker work implemented early.

## Final CI verification

GitHub Actions passed on the completed Phase 10 implementation with:

- dependency installation;
- strict TypeScript typecheck;
- **30 test files**;
- **150 tests**;
- production Vite build.

## Exit condition
- [x] Dependency installation passes.
- [x] Strict TypeScript typecheck passes.
- [x] Complete unit-test suite passes.
- [x] Production Vite build passes.

**Phase 10 status: complete and CI-verified.**
