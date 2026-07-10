# document-editor-core Specification

## Purpose

Define the core of the document editor SDK: a stable, engine-agnostic façade over the underlying rich-text engine, a builder for composing editor instances, a validated command layer, a delta-first change model with snapshot checkpoints, and a pluggable document backend.

## Requirements

### Requirement: Hidden Engine Behind a Stable Façade

The editor's underlying rich-text engine MUST be an implementation detail. The package's public type surface MUST NOT expose engine (`@tiptap/*`, `prosemirror-*`) types on any exported signature, except under the explicitly-unstable `advanced` entry point. Consumers interact only through the SDK's own `IEditor` façade.

#### Scenario: Public surface is engine-free

- **WHEN** the package's emitted declaration files (`dist/**/*.d.ts`) are inspected, excluding the `advanced` entry
- **THEN** no exported type, parameter, or return value references a `@tiptap/*` or `prosemirror-*` type

#### Scenario: Consumer drives the editor through the façade

- **WHEN** a consumer holds an `IEditor` instance
- **THEN** it can read content, run commands, subscribe to changes, and manage focus/selection without importing any engine package

### Requirement: Builder Composition

An editor MUST be assembled through a builder that registers features, a document backend, change handlers, and a theme, and returns a wired editor. Registration MUST be explicit and ordered; the same builder configuration MUST be reusable to create independent editor instances.

#### Scenario: Compose and build

- **WHEN** a consumer calls the builder with a set of features and then builds
- **THEN** an `IEditor` is returned with exactly the registered features active and their UI contributions available

#### Scenario: Independent instances

- **WHEN** the same builder configuration is built twice
- **THEN** two independent editor instances exist that do not share mutable state

### Requirement: Command Layer With Validated Arguments

All editor mutations MUST be expressed as named commands. A command MAY declare a schema for its arguments; when it does, arguments MUST be validated before the command executes, and invalid arguments MUST reject the command without mutating the document.

#### Scenario: Valid command executes

- **WHEN** a named command is dispatched with arguments satisfying its schema
- **THEN** the command runs and the resulting change is emitted through the change model

#### Scenario: Invalid command arguments are rejected

- **WHEN** a named command is dispatched with arguments that violate its declared schema
- **THEN** the command does not mutate the document and the failure is surfaced to the caller

### Requirement: Delta-First Change Model

Every edit MUST emit an incremental delta describing only what changed, not a full-document serialization. Consumers subscribing to changes MUST receive step-sized payloads suitable for incremental persistence or transport.

#### Scenario: Single edit emits a small delta

- **WHEN** a user makes one localized edit in a large document
- **THEN** the emitted delta describes only the changed region and is not proportional to the whole document size

### Requirement: Snapshot Checkpoints

The change model MUST provide full-document snapshots as recovery checkpoints, produced on a debounced/idle cadence and on demand, separate from the per-edit delta stream.

#### Scenario: Debounced snapshot after activity

- **WHEN** a burst of edits settles
- **THEN** at most one snapshot is produced for the burst rather than one per edit

#### Scenario: On-demand snapshot

- **WHEN** a consumer requests the current document
- **THEN** a full JSON snapshot is returned that reconstructs the document exactly

### Requirement: Pluggable Document Backend

The change model MUST sit behind a document-backend interface with a default backend that emits engine-step deltas. The interface MUST admit an alternative backend (e.g. a CRDT backend) without changing the editor façade or feature contracts.

#### Scenario: Default backend is active without extra configuration

- **WHEN** an editor is built without specifying a backend
- **THEN** the default step-delta backend is used

#### Scenario: Backend is swappable

- **WHEN** an alternative backend implementing the interface is supplied to the builder
- **THEN** the editor uses it, and no feature or façade type signature changes as a result
