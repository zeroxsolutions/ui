# Uploads in the editors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An author uploads a file wherever a block of the Document Editor or the email editor asks for an image or
a file address, through a callback the host hands in.

**Architecture:** A per-editor upload store in the ui registry holds every upload in flight outside the document,
each at the position of its block, mapped through every transaction; a deleted block, a cancel or the editor's
destroy aborts its signal. The block's attribute changes once, in its own undo step, when the host's URL lands. A
`UploadTabs` control puts "Upload" beside the "Link" field a block already has; an `UploadStatus` draws progress,
cancel, failure and retry. Paste and drop route each file to the feature that takes its type.

**Tech Stack:** TypeScript, React, ProseMirror through editor-core's `advanced` subpath, registry Tabs, Popover,
Progress and Button, vitest in Chromium.

**Spec:** `docs/superpowers/specs/2026-11-26-editor-uploads-design.md`

## Global Constraints

- The host's callback: `upload(file, { signal, onProgress }) => Promise<{ url: string }>`.
- No `blob:` or `data:` address reaches the document, `onChange`, an export or the email's render: the local
  preview lives in the store only, and a returned address that is not a web one is refused.
- A returned email image address goes through `emailAddressProblems`, the check a typed one goes through.
- Every string from `messages`, English defaults. Document Editor look, light and dark.
- Waits in tests are conditions. Commit per part.

## Task 1: The store, the controls, paste and drop

**Files:** create `packages/ui/registry/bases/base-ui/editor/document/uploads/` (`upload.ts`, `upload-store.ts`,
`use-block-upload.ts`, `upload-tabs.tsx`, `upload-status.tsx`, `index.ts`, specs); modify editor-core
`NodeViewProps` (`getPos`) and `advanced` (`closeHistory`), `node-view-adapter.tsx`, `registry.json`.

- [ ] Failing specs: refusal by `accept` and `maxBytes` before the host is called; cancel aborts the signal and
      leaves the document as it was; a deleted block and a destroyed editor abort; a failure keeps the entry with
      retry; a landing URL is one undo step; a returned `blob:` URL is refused.
- [ ] Implement; `pnpm nx build editor-core`; run the specs green; commit.

## Task 2: The Document Editor's image, file, media and card

- [ ] Failing browser specs per feature: only Link without `upload`; Upload tab picks a file by keyboard;
      in-flight preview dimmed with progress and cancel; failure and retry; paste and drop create a block (image,
      file, media); no `blob:` in `getJSON` or the HTML export.
- [ ] Implement `upload`, `accept`, `maxBytes` and `messages` options on `image()`, `file()`, `media()` and
      `card()`; commit.

## Task 3: The email editor

- [ ] Failing browser specs: `upload` prop reaches the image block, hero, card, product image fields and social
      icons; an `http:` answer shows the email's existing error; paste and drop of an image create an image block;
      `onChange` never holds a `blob:` address.
- [ ] Implement through `emailKit`'s options and the kit context; messages in `ProfileEditorMessages.uploads`;
      commit.

## Task 4: Docs and demos

- [ ] A fake upload for the demos: simulated progress, sends nothing; demos on the image, file, media and email
      editor pages; each page documents `upload`; rebuild the examples index and registry; check each page in the
      browser at 1280 and 375, light and dark; commit.
