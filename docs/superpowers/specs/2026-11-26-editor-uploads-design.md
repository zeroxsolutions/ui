# Uploads in the editors

Decided 2026-11-26 with the owner, during the review of block presets: an author can only type an image's
address today; they must be able to upload a file. One more web extension, before native (project 4).

## Why

Every place a block takes an image or a file asks for a URL: the Document Editor's image, file and media
blocks, and the email editor's `imageUrl` fields (image, hero, card, two-up's images, social icons). An author
has a file on their machine, not a URL. Storage is the host's (travel owns its bucket and public URLs), so the
editors cannot upload by themselves.

## Goals

1. A host hands the editors one callback:
   `upload(file: File, options: { signal: AbortSignal; onProgress(fraction: number): void }) => Promise<{ url: string }>`.
   The Document Editor's `image()`, `file()` and `media()` features take it as an option; `EmailEditor` takes
   it as a prop `upload` and passes it to every `imageUrl` field.
2. Where a block asks for an image or a file, its popover has two tabs, "Upload" and "Link". Upload picks a
   file or takes one dropped on it. Without `upload`, only Link shows, as today.
3. While a file uploads, the block shows it (a local preview for an image, name and size for a file) dimmed,
   with progress and a cancel button. On failure the block says so and offers retry; on cancel it returns to
   its state before.
4. Pasting or dropping an image file into the editor creates an image block and uploads it. In the Document
   Editor, another file creates a file attachment (and a video or audio file a media block when `media()` is
   present). The email editor takes images only.
5. Docs: each feature's page and the email editor's page document `upload`; demos use a fake upload that
   reads the file to a blob URL with simulated progress and sends nothing anywhere.
   Revised 2026-11-26 during the build: the demos' fake upload answers an `https://` sample address the site
   already serves, not a blob URL. The store refuses any answer that is not a web address, as the anti-goals
   require, so a blob answer would fail every demo upload; the picked file still shows as a local preview while
   it uploads.

## Non-goals

- Storage, resizing, or image processing: the host's.
- Upload in the SMS editor (no images).
- Native (project 4).

## Anti-goals

- A local blob or data URL reaching the document, `onChange`, an export or a render. Only the URL the host
  returns is stored.
- An email image stored with an address the email refuses: the returned URL goes through the same checks as a
  typed one (`https`), and a refused one shows the same error.
- An upload that keeps running after its block is deleted, the editor unmounts, or the author cancels: the
  signal aborts it.

## Approaches

1. A host callback on the features and the email editor (owner picked): the editor owns the UI and the
   in-flight state; the host owns storage.
2. A host-rendered picker (the host opens its own media library): more flexible, but every host rebuilds the
   UI. A later `pick` callback can add it beside `upload`.

## Design notes

- Accepted types per place: image blocks and `imageUrl` fields take `image/*`; file takes any; media takes
  `video/*` and `audio/*`. A host may narrow with `accept` and cap with `maxBytes` (refused before upload,
  with a message from `messages`).
- In-flight state lives outside the document (a plugin state or a store keyed by the block's key), so undo,
  `onChange` and exports never see it; the block's stored attribute changes once, when the URL arrives, as one
  undo step.
- The file name fills the file block's name and size; an image's alt stays for the author (the email
  validate keeps asking for it).
- Every string comes from `messages`, English defaults.
