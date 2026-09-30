# Spec (c3): the logo, the home page, and what c2 left unfinished

Date: 2026-10-01. Follows spec (c2) (`2026-09-30-rebuild-on-nova-design.md`), whose rules 1-7 still
hold for everything this spec adds. The research this spec cites is in the session scratchpad and is
summarised where it decides something; each claim below names its source.

## Why

The docs site has no brand: the header opens on a `Home` link, the favicon is the Next default, and
the share images carry text only. The home page is a heading, one paragraph, an install command and
two buttons. And c2 shipped with part of its own scope open (listed under "What c2 left").

## The logo

**The mark is a 3x3 grid of square modules with the centre and the two anti-diagonal corners left
out.** The empty centre is the zero, the missing diagonal is the X, and the six modules are the
components a registry is built from. The user chose it (candidate D) over a cut tile, a slashed
zero, a chamfered zero and opposed chevrons, after seeing each in the header, in a browser tab and
at 16 pixels.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <rect x="2" y="2" width="6" height="6" rx="1" />
  <rect x="9" y="2" width="6" height="6" rx="1" />
  <rect x="2" y="9" width="6" height="6" rx="1" />
  <rect x="16" y="9" width="6" height="6" rx="1" />
  <rect x="9" y="16" width="6" height="6" rx="1" />
  <rect x="16" y="16" width="6" height="6" rx="1" />
</svg>
```

**It is one colour, `currentColor`,** so it takes the foreground token in light and dark and needs
no second file per theme.

**The wordmark is "ZeroXSolutions UI" in the site's own sans (Geist), never "ZeroX" alone.**

- A live registration of "ZEROX" covers software services (class 042, serial 88245661, per the
  Trademarkia record).
- The 0x Protocol's wordmark is the characters "0" and "x" set side by side (0x.org media kit).
- So the mark draws no "0" or "x" glyph, and the name is always the full house name.
- Geist is OFL 1.1 and may be used unmodified in a logo lockup.

**Which shapes are out, and why.** The mark stays clear of:

| Shape                      | Too close to |
| -------------------------- | ------------ |
| a solid triangle           | Vercel       |
| a ring around a cut letter | Next.js      |
| angled panels              | Framer       |
| a pair of slashes          | shadcn/ui    |
| an even two-stroke X       | X Corp       |

**Clearance is not finished.** The research reached USPTO and WIPO only through mirrors, since both
refuse scripted search. A person searches both registries by hand before the mark is used outside
this site. Until then it is the site's logo and nothing more.

**Where it appears:**

- **The header.** The mark and the wordmark, at the start of the header, link to the home page with
  the accessible name `ZeroXSolutions UI`. The `Home` item leaves the nav, as upstream's header uses
  its logo for home.
- **The favicon.** `app/icon.svg` from the mark, plus a 32-pixel `favicon.ico` in place of the Next
  default. At 16 pixels on a 1x screen the module gaps render soft, which the user accepted when
  choosing D. A retina tab draws it at 32 pixels.
- **An apple touch icon.** `app/apple-icon.png`, 180 pixels, the mark on the background token.
- **The share images.** The mark beside the site name in the docs page image.

The mark is a site component, `SiteLogo` in `src/components/general/site-logo.tsx`. It is not a
registry item, because it brands this site and no consuming app installs it.

## The home page

The page follows the section order the research derived from the comparable sites and from the
usability studies. Each section below names the evidence that put it there.

### Hero, above the fold

- **Headline:** "Composed React components for shadcn, on Base UI." It is the one-line tagline that
  says what the site is. NN/g lists this as the most-violated home page guideline, met by 27% of
  sites (nngroup.com/articles/most-violated-homepage-guidelines).
- **Sub-headline:** "Install any item with the shadcn CLI from its URL. The code it writes is
  yours."
- **Two actions:** `Browse components` (primary, the components index) and `Get started`
  (secondary, the installation page). NN/g's home page guidance names one to four top tasks.
- **The install command:** one real item's `pnpm dlx shadcn@latest add <url>` in the registry's
  `CodeBlock`, with its language and its copy button. Developer-tool home pages that put the first
  command on the first screen shorten the time to a first working install
  (everydeveloper.com/developer-tool-homepages). Of the twelve registries surveyed, only 21st.dev
  does it.

### The shader behind the hero

It is decoration only, and every rule below comes from the accessibility and performance sources in
the research:

- **What it draws.** A field of square modules on the logo's grid. The modules fade in and out slowly
  in the foreground token at low opacity, so it reads as the mark at scale and stays monochrome.
- **Hidden from assistive technology.** The canvas is `aria-hidden` and carries no content, since a
  canvas's pixels are invisible to assistive technology (MDN, `canvas`).
- **Static by default.** The server renders a static poster, a CSS background matching the first
  frame. The shader starts on the client once the page is idle. It never starts under any of these:
  - `prefers-reduced-motion: reduce`;
  - no WebGL;
  - no JavaScript.

  Sources: web.dev "Learn Accessibility: Motion"; MDN `prefers-reduced-motion`.

- **It settles within five seconds, then stops.** Motion that starts automatically and lasts more
  than five seconds needs a pause control (WCAG 2.2.2, level A). Settling is the answer that adds no
  control to the hero.
- **No flashes, and no reaction to the pointer** (WCAG 2.3.1, 2.3.3).
- **Contrast.** The headline and sub-headline keep 4.5:1, and the buttons and command block 3:1,
  against the brightest and the darkest frame in both themes (WCAG 1.4.3, 1.4.11).
- **Frame budget.**
  - The device pixel ratio is capped at 1.5 and the loop at 30 frames a second.
  - The loop pauses while the tab is hidden or the hero is off screen.
  - It never runs before the headline, which is the page's largest contentful paint.
- **No shader library.** One hand-written fragment shader and a few dozen lines of WebGL setup, in a
  lazy client chunk. The worker is already 5220 KiB gzipped against the free plan's 3 MiB (AGENTS.md),
  and a shader library would add to it for effects this page does not use.

The shader is a site component, `HomeShader` in `src/app/(app)/_components/home-shader.tsx`, beside
the one page that uses it.

### Live items, within the first two screens

A static grid of six registry items, each rendered by its own demo, not by a screenshot. Each card
names the item and links to its docs page. The items are:

- Chat Message
- Code Block
- File Tree
- Tag Input
- Password Input
- Status Indicator

Evidence for this section:

- NN/g measured 74% of viewing time in the first two screenfuls (nngroup.com/articles/scrolling-and-attention).
- "Specifics beat abstractions" (NN/g top ten home page guidelines).
- shadcn/ui, Radix and Kibo UI each lead with their own components.
- The grid is still, never a carousel: auto-forwarding content fails users (nngroup.com/articles/auto-forwarding).

Each card is the site's `ComponentPreview` family, a `ComponentPreviewStage` holding the
`RegistryExample`, with a caption beneath it. That is the same frame the docs pages use, so the grid
adds no second frame.

### The block

The AI Provider Picker, rendered live in the `BlockFrame` the blocks page uses, with a link to
`/blocks`. shadcn/ui and Kibo UI each give blocks their own section on the home page.

### How it installs

Three steps, each with its code:

1. Run the item's `shadcn add` command.
2. The CLI writes the item's files into the app under `components/<folder>/`.
3. Import the family and compose its parts.

Tailwind CSS and Radix both show code beside what it does, and 21st.dev states that the code
becomes the app's own. The snippets are the registry's `CodeBlock` with their language shown.

### What the page leaves out

| Left out                          | Why                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------- |
| A GitHub link                     | The repository is private.                                                        |
| An FAQ                            | No questions have been collected to answer.                                       |
| Logo walls, testimonials, pricing | They belong to paid registries, and the free developer-tool sites leave them out. |
| Scroll-triggered reveal animation | nngroup.com/articles/scroll-animations                                            |
| Any auto-rotating gallery         | nngroup.com/articles/auto-forwarding                                              |

The site footer stays as c2 left it.

### Where the page's parts live

Sections only the home page composes sit in `src/app/(app)/_components/`, beside `page.tsx`, so
deleting or moving the page takes them with it and nothing else imports them. The header's `SiteLogo` and the preview family stay in
`src/components/`, because more than one route uses them.

## What c2 left

Each item below was in c2's scope and did not ship.

1. **A fresh audit of every component against `writing-a-component` as it now reads.** That covers
   the site's own components under `src/` and the registry's. The skill now asks every part to carry
   a `data-slot` naming it, and the earlier audit was made on the code before the fixes and on the
   older skill. The audit writes one row per violation; the rows are then fixed a family per commit.
2. **The site's rows from the first audit:**
   - `ExamplePreview` switches its structure on `view`. It splits into a demo preview and a block
     preview.
   - `SourceCodeBlock` and `ComponentSource` take boolean flags (`collapsible`, `copyable`,
     `lineNumbers`) that decide which parts render. The caller composes the parts instead.
   - Components only one route composes move beside that route.
   - `MainNav` and `MobileNav` each carry their own rule for which link is current. It becomes one
     rule, in one place.
3. **Three docblocks show a removed API:**
   - `tool-call-card.tsx` and `permission-card.tsx` show a `CodeBlock` with no parts, which renders
     nothing.
   - `reasoning-collapsible.tsx` shows `MarkdownView codeBlocks`.
4. **The avatar picker's emoji pane lost its "No emoji found" line.** The emoji picker now leaves that
   line to its caller, so the avatar picker's demo and docs compose `EmojiPickerEmpty`.
5. **Two icon sizes the fixes left in place stay, and both say why.** base-nova's `Badge` sizes
   only its direct `svg` children (`[&>svg]:size-3!`). An animated icon wraps its `svg` in a `div`,
   so the badge's rule does not reach it:
   - Without `size={12}`, the permission card's check icon draws at the icon's 28-pixel default.
   - Without `*:size-3!`, the tool call card's status icons draw at the 16 pixels its trigger
     button's descendant rule sets.

   The tool call card already carries that comment. The permission card gets the same one.

6. **The Status Indicator page repeats its demo five times.** The demo already shows every tone
   (online, idle, busy, offline) and the pulse. The five single-state examples are deleted, along
   with:
   - their files;
   - their `registry.json` entries;
   - the page's `Examples` section.

   The tones stay listed in the page's API reference under `tone`.

7. **The screenshots c2's verification asked for**, taken with this spec's own (below).

## Verification

- The unit gate, the build, `wrangler:build`, and `shadcn build` pass.
- The e2e suite passes on the worker, and it adds two cases:
  - **The home page.** The headline is the page's first heading. The install command copies. Each
    of the six items renders. The block frame loads. The header's logo link has the name
    `ZeroXSolutions UI` and leads home.
  - **The shader.** With `prefers-reduced-motion: reduce` emulated, the page starts no WebGL
    context. Without it, the shader starts and stops requesting frames within five seconds.
- The favicon, the apple icon and the share image are fetched from the worker and are the mark.
- Screenshots of `/`, `/docs`, one component page and `/blocks`, at 1440 and 390 wide, in light and
  dark. They are compared by eye against the base-nova preview, and the home page is also compared
  against the section list above. They go in the final report.
- The worker's gzipped size is measured again and recorded in AGENTS.md.

## Out of scope

- The trademark search itself, which a person makes.
- The deploy.
- The editor (spec d).
