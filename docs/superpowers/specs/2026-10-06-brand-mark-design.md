# Spec: one `<BrandMark>`, its artwork served from a CDN

Date: 2026-10-06. Issue: #24.

## Why

`@zeroxsolutions/icons` ships 201 brand marks as 201 React components under `brands/<name>`, each a
compound (`.Color`, `.Mono`, `.Avatar`, `.Text`, `.Combine`) carrying whichever variants its source
had. A caller cannot name a mark by a value, cannot set a style once for an app, and every mark is
inline JS: the 201 together are about 890 KB, 250 KB gzipped. Three org apps hand-draw marks the set
already has (travel's footer and its sign-in buttons, classify's Google button).

`@zeroxsolutions/fluent-emoji` already answers the same problem for emoji: one component, one style
axis with an app-wide default, and artwork served as files from `fluent-emoji.zeroxsolutions.com`.
This spec gives brand marks that shape.

## What changes for a caller

```tsx
import { BrandMark, BrandMarkStyleProvider, setBrandMarkBase } from '@zeroxsolutions/icons/brand-mark';

<BrandMark name="facebook" />                      // variant 'color': the brand's own colours
<BrandMark name="openai" variant="mono" />         // one colour, the text colour around it
<BrandMark name="claude" variant="avatar" size={32} />
<BrandMark name="google" label="Google" />         // named; without `label` it is decorative
```

- `name` is `BrandMarkName`, a union generated from the manifest; a mistyped name does not compile.
- `variant` is `'color' | 'mono' | 'avatar' | 'combine'`, default `'color'`. `'outline'` is added
  later without changing this API (see **Not in this spec**).
- `size` is a number of pixels or a CSS length, default `'1em'`; the mark keeps its own aspect ratio.
- `label` gives the mark an accessible name. Without it the mark is `alt=""` / `aria-hidden`, since
  in a button or a link the text beside it is the name.
- `base` on one call, `setBrandMarkBase(url)` for the module, default
  `https://icons.zeroxsolutions.com/brands`.
- `BrandMarkStyleProvider` (`defaultStyle`, `style`, `onStyleChange`) makes the style ambient, as
  `FluentEmojiStyleProvider` does; a call's own `variant` wins over it.
- `brandMarkUrl(name, { variant, base })` returns the file URL, or `undefined` where the manifest has
  no file for that variant, for callers outside React.

Removed, a breaking change: every `@zeroxsolutions/icons/brands/<name>` subpath and the components it
exported, and `brands/internal/*`. `AiProviderIcon` keeps its props and its `type` values; inside, it
maps a provider key to a `BrandMarkName` and renders `<BrandMark>`. `material/` does not change.

## How each variant draws

| Variant   | Element                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `color`   | `<img src="<base>/color/<name>.svg">`                                                                                                    |
| `combine` | a `<span>` masked by `<base>/combine/<name>.svg` over `currentColor`, the mark beside its wordmark, as `mono` is drawn                   |
| `mono`    | `<span>` whose `mask-image` is `<base>/mono/<name>.svg` over `background-color: currentColor`, so it takes the text colour and the theme |
| `avatar`  | `<img src="<base>/avatar/<name>.svg">`, rounded by `border-radius` per `shape`                                                           |

`shape` (`'circle' | 'square'`, default `'circle'`) applies to `avatar` alone, so one file serves the
round and the square avatar `AiProviderIcon` already offers.

An `<img>` cannot take `currentColor`, which is why `mono` and `combine` are masks; today's
`.Combine` paints its name in `currentColor` too. A mask gives no load or error event, so a masked
mark also renders a hidden `<img>` of the same URL whose `onError` drives the fallback below; the
browser fetches the file once.

### When a variant is missing or fails

The manifest says which variants a mark has, so a missing one is resolved before any request:
`combine` and `avatar` fall to `color`, and `color` falls to `mono`. A file
the manifest lists that fails to load falls the same way, after the attempt. When `mono` itself
fails, the mark renders the first letter of its name in a round `<span>`, so nothing is ever blank.

A file that fails before React hydrates fires its `error` before the handler exists, so on mount the
component also treats an `<img>` that is `complete` with a `naturalWidth` of 0 as failed.

## The artwork

### One conversion, then files are the source

`packages/icons/tools/export-brand-svgs.mts` runs once. It renders every component's `Base`,
`.Color`, `.Mono`, `.Combine` and `.Avatar` with `renderToStaticMarkup` to
`packages/icons/assets/brands/<variant>/<name>.svg`:

- `Base` goes to `mono` where the mark has no `.Mono`, and to `color` where it has no `.Color` and
  its base is the full-colour artwork (`microsoft-teams`, `outlook`, `onedrive`, `monday`,
  `google-play`).
- `.Avatar` renders as an HTML `<span>` around the mark, so the script draws it as SVG instead: a
  square filled with that avatar's own `background` (a colour or a gradient), the mark's `mono` paths
  in its `color`, scaled by its `iconMultiple` and centred. Each avatar keeps the parameters its
  `makeAvatar` call holds today; 191 marks have one, and the 10 without fall to `color`.
- `.Combine` is today an HTML `<span>` holding the mark and the brand's name typed as text in the
  page's font, which a file opened as an image cannot load. The script draws `combine` as SVG
  instead, from the brand's own wordmark: the mark's `mono` paths, then its `.Text` paths, placed
  with the `spaceMultiple` gap and scaled to the `textMultiple` height its `makeCombine` call holds
  today, all filled black for the mask. 91 marks have both a `.Combine` and a `.Text`; the 4 with a
  `.Combine` and no `.Text` get no `combine` file and fall to `color`.
- `.Text` gets no variant of its own: no caller draws a wordmark alone, and it survives inside
  `combine`.
- `<title>` is stripped; the name is `<BrandMark>`'s to give.
- An id `useId` generated becomes a fixed one, which is safe because each file is its own document.
- A `mono` file is filled black, since a mask reads only its alpha.

The commit that runs it deletes the 201 `src/brands/*.tsx`, `src/brands/internal/` and the script
itself. From then on a brand is added by adding its files.

### The manifest

`brand-manifest` (`nx:run-commands`, `node tools/build-brand-manifest.mts`, output
`{projectRoot}/src/lib/brand-manifest.ts`) reads `assets/brands/` and writes, for every name, the
variants it has and its aspect ratio, read from each file's `viewBox`. It mirrors fluent-emoji's `emoji-manifest`.
The generated file is never edited by hand, and `BrandMarkName` is derived from it.

No colour is kept beside the files. A logo's colours are in its `color` file and an avatar's in its
`avatar` file, so `colorPrimary`, a single colour no multi-colour logo fits, goes away.

The manifest lives under `src/lib/`, and the entry glob in `vite.config.mts` gains `src/lib/**` among
its ignores. Every other file under `src/` is a public subpath, so without that line the generated
table would become one, a contract no caller asked for.

### Packaging

A vite plugin copies `assets/` to `dist/assets/`, as fluent-emoji's `copy-emoji-assets` does, so the
tarball carries `dist/assets/brands/` (about 1 MB of SVG). An app that wants to serve the files itself
copies that folder and calls `setBrandMarkBase`.

`brand-mark.tsx` sits at `src/` beside `ai-provider-icon.tsx`, so the existing per-file entry glob
publishes it as `@zeroxsolutions/icons/brand-mark` with no change to `exports`; the manifest it imports
is bundled into it. Nothing in the package
runs at load, so `sideEffects: false` stays.

### The CDN

| Piece         | Value                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 bucket     | logical `icons`, created as `ui-sdk-icons-production`                                                                                                                  |
| Custom domain | `icons.zeroxsolutions.com`, serving from the bucket root                                                                                                               |
| Object keys   | `brands/<variant>/<name>.svg`; the bucket root leaves room for `material/` and `outline` later                                                                         |
| Upload        | `rclone:sync` on `@zeroxsolutions/icons`, `tools/rclone-sync.sh`, the same flags as fluent-emoji's                                                                     |
| Cache         | `Cache-Control: public, max-age=31536000, immutable`, so artwork re-sourced under the same key goes under a `v2/` prefix and the default base moves; nothing is purged |

The `cd.yml` job `rclone-sync` already runs `nx run-many -t rclone:sync` on every push to
`production`, so the new target needs no new job. It does need its bucket: today the step passes one
`S3_BUCKET`, which names neither the project it belongs to nor anything but the vendor's protocol.
Both packages move to `<CONCERN>_BUCKET`, the name `configuring-a-worker` gives a bucket, and the
step's `env` passes `FLUENT_EMOJI_BUCKET: ${{ vars.FLUENT_EMOJI_BUCKET }}` and
`ICONS_BUCKET: ${{ vars.ICONS_BUCKET }}` in place of `S3_BUCKET`. Each script checks its own variable
in the `missing` list fluent-emoji's script already keeps.

| Variable              | Value                            | Read by                             |
| --------------------- | -------------------------------- | ----------------------------------- |
| `FLUENT_EMOJI_BUCKET` | `ui-sdk-fluent-emoji-production` | `fluent-emoji/tools/rclone-sync.sh` |
| `ICONS_BUCKET`        | `ui-sdk-icons-production`        | `icons/tools/rclone-sync.sh`        |

Both are set on the repository's `production` environment already. `RCLONE_S3_ENDPOINT`,
`RCLONE_S3_ACCESS_KEY_ID` and `RCLONE_S3_SECRET_ACCESS_KEY` keep their names, which are rclone's own,
and stay shared: the one key is granted the second bucket.

### What a human does

These grant access or create infrastructure, so they are not CI's and not an agent's.

1. Add the bucket and its domain to the production var-file `iac/production.tfvars`:

   ```hcl
   cloudflare_r2_buckets = ["fluent-emoji", "icons"]

   cloudflare_r2_custom_domains = [
     {
       bucket    = "fluent-emoji"
       domain    = "fluent-emoji.zeroxsolutions.com"
       zone_name = "zeroxsolutions.com"
     },
     {
       bucket    = "icons"
       domain    = "icons.zeroxsolutions.com"
       zone_name = "zeroxsolutions.com"
     },
   ]
   ```

   then apply it:

   ```sh
   cd iac
   terraform init -backend-config=backend.config
   terraform workspace select production
   terraform plan -var-file=production.tfvars -out=production.tfplan
   terraform apply production.tfplan
   ```

   The plan adds one bucket and one custom domain and changes nothing else.

2. In the Cloudflare dashboard, R2, **Manage API tokens**, edit the token whose key is in
   `RCLONE_S3_ACCESS_KEY_ID` and add `ui-sdk-icons-production` under **Apply to specific buckets
   only**. The permission stays Object Read & Write.

3. After the first `rclone-sync` run that reads the new names is green, remove the old variable:

   ```sh
   gh variable delete S3_BUCKET --env production -R zeroxsolutions/ui
   ```

## Tests

In `packages/icons`, in jsdom as the package's other specs are:

- **The manifest and the files agree**: every name and variant in `brand-manifest.ts` has its file
  under `assets/brands/`, and every file is in the manifest. This replaces `brand-marks.spec.tsx`,
  which globs the components that no longer exist.
- **`<BrandMark>` draws each variant** as the table above says: the `<img>` and its URL for `color`
  and `combine`; for `mono`, a `mask-image` naming the `mono` URL and a `currentColor` background; for
  `avatar`, the `<img>` and a `border-radius` per `shape`.
- **A missing variant falls back with no request**: a mark with no `combine` renders its `color` URL.
- **A failed file falls back**: an `error` on the `color` image renders the `mono` mask, and an
  `error` on the `mono` probe renders the letter. This is the same seam fluent-emoji's
  `falls back to the native glyph when the image fails to load` case uses.
- **A failure before hydration is caught**: an `<img>` mounted `complete` with `naturalWidth` 0 falls
  back.
- **Naming**: with `label` the mark has that accessible name; without it, it has none.
- **The ambient style and base**: `BrandMarkStyleProvider` and `setBrandMarkBase` change what a call
  without its own `variant` or `base` resolves to, and a call's own value wins.
- **`AiProviderIcon`** keeps its existing cases, which now pass through `<BrandMark>`.

In `apps/registry-ui`: `icons-demo` and the package's docs page (`content/docs/packages/icons.mdx`)
move to `<BrandMark>`. A mask is a browser fact jsdom cannot draw, so the registry's e2e suite, in a
real browser, asserts that a `mono` mark on the icons page has the `mono` URL as its computed
`mask-image` and a box larger than zero; the rest of the suite stays green.

## Release, in this order

The default base is the CDN, so a release before the CDN serves the files renders every mark as its
letter.

1. A human does steps 1 and 2 above.
2. The PR merges. Its commit is `refactor(icons)!: serve brand marks as files behind one BrandMark`
   with a `BREAKING CHANGE:` trailer naming the removed `brands/*` subpaths.
3. `git push origin master:production` runs `rclone-sync`, which uploads both packages. Then
   `curl -I https://icons.zeroxsolutions.com/brands/color/facebook.svg` answers 200, and fluent-emoji's
   `curl -I https://fluent-emoji.zeroxsolutions.com/3d/1f92f.webp` still does.
4. A human does step 3 above.
5. `nx release` for `@zeroxsolutions/icons`. Under 0.x a breaking change is a minor bump, so the
   expected number is 0.2.0; the number published is the one the run prints.

## Not in this spec

- **Moving the apps.** travel's marketing-site footer (Facebook, Instagram and YouTube in colour, and
  the store buttons), travel's web-app sign-in buttons and classify's Google button each move to
  `<BrandMark>` in their own repository, with travel.pen's footer redrawn in colour to match. Each is
  a short design of its own after this ships.
- **`outline`.** No outline source is chosen; Tabler's 376 `brand-*` glyphs are the candidate.
- **`material/` on the CDN.** It stays inline components.
- **Naming a CI variable for a project's resource.** `configuring-a-worker` names a worker's bucket
  binding `<CONCERN>_BUCKET`, and this spec applies that to a CI variable; `writing-a-ci-workflow` says
  nothing about it, which is how `S3_BUCKET` came about. That gap goes to agent-plugins separately.
