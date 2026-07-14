## Write Authored Text in Plain ASCII; No Smart Punctuation or Invisible Unicode
`[MEDIUM]` `plain-ascii-typography`

Every run of text an agent authors -- user-facing UI copy and i18n message strings, code
comments and identifiers, commit and PR/issue bodies, Markdown docs -- is written in **plain
ASCII typography**. Do not emit the "smart" typographic glyphs an editor or a language model
silently substitutes for ASCII: a reader spots them at a glance as machine-generated, and the
invisible ones (non-breaking and zero-width spaces, BOM) corrupt `grep`, diffs, and sometimes the
build. Type the ASCII form and let the *rendering* layer -- CSS, a Markdown processor, an
i18n/date formatter -- do any typographic prettification; never bake the fancy glyph into the
source.

Banned glyph, and the ASCII you write instead:

| Banned | Name | Write instead |
| --- | --- | --- |
| em dash, en dash | long dashes | `-`, ` - ` (spaced hyphen), or `--`; often just restructure the sentence |
| curly quotes and apostrophe | typographic quotes | straight `"` and `'` |
| ellipsis character | one-glyph `...` | `...` (three periods) |
| middle dot, bullet | decorative separators | `-`, `,`, `:`; a UI separator is a styled element or a gap, not a glyph in the string; a list is a Markdown `-` |
| arrows (right/left/double/both) | arrow glyphs | `->`, `<-`, `=>`, `<->` |
| multiplication sign | times glyph | `x` |
| U+00A0, U+200B/C/D, U+FEFF | nbsp, zero-width, BOM | a normal space, or delete it |

**This bans decorative substitution, not legitimate non-ASCII content.** A translated string in a
non-Latin script, a person's name, a currency symbol the locale needs, a code point a test
asserts, a real path or identifier, or third-party data you quote verbatim is **content**, not
typography -- keep it exact (the platform is i18n; see `stack-utc-locale-per-request`). The rule
is narrow: do not reach for a fancy dash, quote, dot, or arrow when a plain ASCII character
carries the same meaning.

**Incorrect -- smart punctuation baked into a source string or comment:**
```tsx
// Deploy the app, then verify -- but with an em dash and a non-breaking space here
<PermissionDescription>GitHub - open an issue - always allow</PermissionDescription> {/* a real one would use the bullet/ellipsis glyphs */}
const label = "Do not allow"; // a real offender writes the curly apostrophe in "Don't"
```

**Correct -- ASCII in source; the render layer does the typography:**
```tsx
// Deploy the app, then verify
<PermissionDescription>GitHub: open an issue</PermissionDescription>
const label = "Don't allow"; // straight apostrophe
```

**Rules of thumb:**
- UI copy is ASCII in the source. If a surface genuinely needs a rendered em dash or a dot
  separator, that is a CSS/typography or component concern (a styled separator element between two
  spans), not a glyph pasted into the string.
- Invisible unicode is never acceptable in source -- it is unreviewable and breaks tooling; an
  eslint `no-irregular-whitespace` catches the whitespace class, and a pre-commit grep can catch
  the visible glyphs.
- The rule governs text you **author or edit** this change; it does not command a repo-wide
  rewrite -- convert a file's legacy glyphs only when you are already editing that text.

**Why:**
- Smart-quote and em-dash output is the single most recognizable "an LLM wrote this" signal in
  shipped copy and in diffs, and invisible unicode silently corrupts search and builds; writing
  ASCII and leaving typography to the render layer keeps authored text portable, greppable,
  diff-clean, and free of the machine-generated tell.

Reference: see `naming-files-and-symbols`, `commit-conventions`, `stack-utc-locale-per-request`
