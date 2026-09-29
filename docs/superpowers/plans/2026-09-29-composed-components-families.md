# Composed Components Families Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every composed family under `apps/registry-ui/registry/bases/base-ui/components/` takes its content as children through parts that follow upstream's composition, carries its state on `data-*`, keeps its classes in recipes, spreads its props and marks every part with `data-slot`; types, helpers and hooks live in `types/`, `lib/` and `hooks/`; the three defects the spec names are fixed test-first; and three scripts hold the rules no grep can.

**Architecture:** Task 1 moves types, helpers and hooks out of component files. Tasks 2 to 30 then take one family (or a few tiny ones) each through every remaining rule at once, one commit per task, with the family's specs rewritten to its new parts and every importer (`editor/`, `examples/`, `blocks/`, `pages/`, `src/`) updated in the same commit. Tasks 31 and 32 fold the cross-family leftovers and add the three check scripts. Every task was rehearsed on a throwaway worktree; each `Expected:` line is real output.

**Tech Stack:** React 19, Base UI, shadcn 4.21.0 (base-vega), Tailwind CSS v4, cva, Vitest + Testing Library (jsdom), TypeScript, Python 3 (the checks), nx 23, pnpm 10.33.0.

**Spec:** `docs/superpowers/specs/2026-09-28-composed-components-design.md` - this plan carries pass-2 rules 4 to 9, split by family (the spec's Order section says so), plus the three renames that come with a reshape (`LabeledControl` to `PanelFieldLabel`, `ChatEmptyState` to `ChatSuggestionItem`, `LanguageSwitcher` to `LanguageCombobox` + `LanguageToggleGroup`).

## Global Constraints

- Nothing is published and nothing consumes the registry: no compatibility shims, no deprecated aliases, no re-exports kept for old names.
- `registry/bases/base-ui/ui/` stays exactly as `shadcn add` wrote it. A family wraps an upstream part; it never edits one. A part that wraps an upstream part whose own recipes select on upstream's `data-slot` keeps that `data-slot`.
- A family: plain `function` components, one `export { }` and one `export type { }` at the foot, every exported name opening with the root's name, each part `<Root><Slot>` with the slot naming what belongs there. Content arrives as children, never as a string prop. State that parts style off sits on a `data-*` attribute of the root. A class string lives in a recipe, on the element, or as an `@utility`, never in a module `const`; `cva` only where a variant exists; no arbitrary px or rem where the scale has a step. Every part spreads its element's props after composing its own handlers, and carries `data-slot`.
- A value enters `constants/` only at its second consumer; before that it stays inline in its one reader. A type the code beside it also uses goes to `types/`, one subject per file.
- Every `registry.json` item declares what its files import: `@shadcn/<item>` for a `ui/` import, this registry's item URL for another item's file, the npm name in `dependencies` for a bare import. Item names, titles and categories are not this plan's.
- Every behaviour change is test-first: the failing spec, its real RED output, the change, GREEN. A pure reshape keeps the family's spec, with its queries moved to the new parts.
- Every command runs from `apps/registry-ui` unless the step says otherwise. `$S` is a scratch directory outside the repository: `S=$(mktemp -d)` once, before Task 1, reused by every task for logs and message files.
- Full-suite counts: each task's `Expected` gives the family specs' exact counts. Its full-suite totals were measured with only its own group's earlier tasks applied, so in plan order the totals are higher; what must hold at every task is `0 failed`, `tsc` printing exactly the one baseline line `registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307`, and `Checked 1 registry file and 22 items.` Tasks 31 and 32 were measured on the whole plan and their totals are exact: `Test Files  79 passed (79)` / `Tests  428 passed (428)` at the end.
- Commits name their paths (`git commit -F "$S/msg-tN.txt" -- <paths>`; a new file is `git add`ed first), the message comes from a file, and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never `--no-verify`, never `HUSKY=0`. The pre-commit hook formats staged files and must print `Successfully ran targets lint, typecheck, build, test for 5 projects`. After the commit, `git status --short` is empty and `git diff HEAD` is empty (stale index entries the hook's formatter leaves with an empty `git diff HEAD` are cleared by `git add` of those paths, no new commit).
- Authored text (code comments, messages, docs) is plain ASCII; comments name no rule and no skill.

## Review Focus

- A keyboard-only user must be able to select an `AiProviderCard` (Tab to it, Enter or Space) while its `AiProviderCardAction` stays clickable on its own; the spec pins the covering trigger's role and focusability, and the reviewer checks the stacking by reading the recipe (Task 10).
- A consumer writing `data-unavailable={false}` on a `ModelList` item must see it undimmed; React renders the value as the string `"false"` (Task 31's spec).
- A caller's own `onClick`, `onSelect`, `onPointerDown` or `onDoubleClick` on a part must run beside the part's own handler, never replace it or be replaced: DataTable column actions (Task 13), CopyButton (Task 7), CommandMenu items (Task 8), ResizeHandle (Task 24), FrontmatterForm controls (Task 29).
- `shadcn add <item>` of any item must write files that compile in a base-vega app that has none of this registry's files: every import an item's files make is declared by that item (Task 32's `registry-deps.py`).
- A family's visual result must not silently change where the spec did not ask it to; the known changes are stated at their task (root margins `my-2` dropped as placement, a 10px badge moved onto `text-xs`, the docs pages' code blocks losing their header until spec (c)). No automated check covers appearance; the reviewer reads each task's class diff against the old recipe.

---

## Extraction

### Task 1: Move types, constants, helpers and hooks out of component files

Pass 2 rule 4. Every type, constant, pure helper and hook that a component file declared for more than its own root moves into `types/`, `constants/`, `lib/` or `hooks/`; `HighlightedCode` becomes its own component file. No behaviour changes: the moved code is the same code, and the four pure helper modules gain specs that pin what they already do.

**Files:**

- Create: `types/chat-role.ts`, `types/chat-agent-identity.ts`, `types/chat-suggestion.ts`, `types/language-option.ts`, `constants/code-languages.ts`, `lib/language-options.tsx` + `lib/language-options.spec.tsx`, `lib/file-type.ts` + `.spec.ts`, `lib/font-format.ts` + `.spec.ts`, `lib/code-language.ts` + `.spec.ts`, `hooks/use-controllable-state.ts`, `hooks/use-highlighted-lines.ts`, `components/data-display/highlighted-code.tsx` (all under `apps/registry-ui/registry/bases/base-ui/`)
- Delete: `components/chat/chat-types.ts` (and so `components/chat/`), `components/language-switcher-data.tsx`
- Modify: `components/data-display/code-block.tsx` (rewritten), `components/data-display/file-type-icon.tsx` (rewritten), `components/data-display/font-preview.tsx`, `components/data-display/chat-message.tsx`, `components/data-entry/chat-empty-state.tsx`, `components/data-entry/chat-empty-state.spec.tsx`, `components/data-entry/language-switcher.tsx`, `components/data-entry/language-switcher.spec.tsx`, `components/layout/file-tree.tsx`, `editor/document/features/mermaid/mermaid.tsx`, `apps/registry-ui/registry.json` (the `chat-message` item's files)

**Interfaces:**

- Consumes: the plan A tree (master `a81125a`).
- Produces, each imported through `@/registry/bases/base-ui/...`:
  - `types/chat-role`: `type ChatRole`; `types/chat-agent-identity`: `interface ChatAgentIdentity`; `types/chat-suggestion`: `interface ChatSuggestion`; `types/language-option`: `type LanguageKind`, `interface LanguageOption`, `type LanguageIcon`
  - `constants/code-languages`: `CODE_LANGUAGES`, `CODE_ALIASES`
  - `lib/language-options`: `canonicalCodeId(value: string): string`, `codeLanguageIcon(id: string): LanguageIcon`, `codeLanguageOptions(): LanguageOption[]`, `localeOptions(codes: readonly string[]): LanguageOption[]`
  - `lib/file-type`: `fileTypeIcon(name: string): LucideIcon`
  - `lib/font-format`: `formatOf(src: string): string | undefined`
  - `lib/code-language`: `isPlainLanguage(language: string | undefined): boolean`, `languageLabel(language: string): string`
  - `hooks/use-controllable-state`: `useControllableState<T>({ prop, defaultProp, onChange }): [T, (next: T) => void]`, `type UseControllableStateOptions<T>`
  - `hooks/use-highlighted-lines`: `useHighlightedLines(code: string, language: string | undefined): HighlightLine[] | null`
  - `components/data-display/highlighted-code`: `HighlightedCode({ lines })`, `type HighlightedCodeProps`
- Removed: `CODE_LANGUAGE_OPTION_IDS` (its one reader, the drift spec, now reads `codeLanguageOptions()`); the `codeLanguageOptions`, `localeOptions`, `LanguageKind` and `LanguageOption` re-exports from `language-switcher.tsx`; the `fileTypeIcon` export from `file-type-icon.tsx`.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the specs for the four helper modules**

The two `language-options` describes move out of `language-switcher.spec.tsx` (Step 7 removes them there); the drift case reads the ids off `codeLanguageOptions()` instead of the deleted `CODE_LANGUAGE_OPTION_IDS`. The other cases are new and pin what the helpers already do.

`apps/registry-ui/registry/bases/base-ui/lib/language-options.spec.tsx`:

```text
import { cleanup, render } from '@testing-library/react';
import { DocumentIcon } from '@zeroxsolutions/icons/material/document';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import { afterEach, describe, expect, it } from 'vitest';

import { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, localeOptions } from './language-options';
import { CODE_LANGUAGE_IDS } from './shiki';

afterEach(cleanup);

describe('canonicalCodeId', () => {
  it('resolves a code-fence alias to its canonical id', () => {
    expect(canonicalCodeId('ts')).toBe('typescript');
    expect(canonicalCodeId('sh')).toBe('shellscript');
    expect(canonicalCodeId('c++')).toBe('cpp');
  });

  it('returns a canonical or unknown id unchanged', () => {
    expect(canonicalCodeId('typescript')).toBe('typescript');
    expect(canonicalCodeId('brainfuck')).toBe('brainfuck');
  });
});

describe('codeLanguageIcon', () => {
  it('finds the icon through an alias', () => {
    expect(codeLanguageIcon('ts')).toBe(TypescriptIcon);
    expect(codeLanguageIcon('typescript')).toBe(TypescriptIcon);
  });

  it('falls back to the document icon for a language outside the highlightable set', () => {
    expect(codeLanguageIcon('brainfuck')).toBe(DocumentIcon);
  });
});

describe('codeLanguageOptions', () => {
  it('offers every highlightable language, each labelled and iconed', () => {
    const options = codeLanguageOptions();
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.value).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.icon).toBeTruthy();
    }
  });

  it('renders a Material svg icon for a code language', () => {
    const ts = codeLanguageOptions().find((o) => o.value === 'typescript');
    const { container } = render(<>{ts?.icon}</>);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('stays in sync with the highlighter language set (no drift)', () => {
    const ids = codeLanguageOptions().map((o) => o.value);
    expect([...ids].sort()).toEqual([...CODE_LANGUAGE_IDS].sort());
  });
});

describe('localeOptions', () => {
  it('labels each BCP-47 code with its native language name', () => {
    const byValue = Object.fromEntries(localeOptions(['en', 'vi', 'ja']).map((o) => [o.value, o.label]));
    expect(byValue.en).toBe('English');
    // A name was resolved (not the raw code) for the non-English locales.
    expect(byValue.vi).not.toBe('vi');
    expect(byValue.ja).not.toBe('ja');
  });

  it('falls back to the raw code when it is not a valid language tag', () => {
    expect(localeOptions(['not a tag'])).toEqual([{ value: 'not a tag', label: 'not a tag' }]);
  });
});
```

`apps/registry-ui/registry/bases/base-ui/lib/file-type.spec.ts`:

```text
import { File, FileCode, FileImage, FileText, FileType } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { fileTypeIcon } from './file-type';

describe('fileTypeIcon', () => {
  it('maps a file name to the icon of its extension', () => {
    expect(fileTypeIcon('run.py')).toBe(FileCode);
    expect(fileTypeIcon('logo.png')).toBe(FileImage);
    expect(fileTypeIcon('Inter.woff2')).toBe(FileType);
    expect(fileTypeIcon('README.md')).toBe(FileText);
  });

  it('reads the extension case-insensitively, off the last segment of a path', () => {
    expect(fileTypeIcon('assets/LOGO.PNG')).toBe(FileImage);
    expect(fileTypeIcon('C:\\docs\\notes.md')).toBe(FileText);
    expect(fileTypeIcon('v1.2/Makefile')).toBe(File);
  });

  it('treats a leading dot as part of the name, not an extension', () => {
    expect(fileTypeIcon('.env')).toBe(File);
  });

  it('falls back to the generic file icon for no or an unlisted extension', () => {
    expect(fileTypeIcon('Dockerfile')).toBe(File);
    expect(fileTypeIcon('model.onnx')).toBe(File);
  });
});
```

`apps/registry-ui/registry/bases/base-ui/lib/font-format.spec.ts`:

```text
import { describe, expect, it } from 'vitest';

import { formatOf } from './font-format';

describe('formatOf', () => {
  it('maps each font extension to its CSS format() hint', () => {
    expect(formatOf('/fonts/Inter.woff2')).toBe('woff2');
    expect(formatOf('/fonts/Inter.woff')).toBe('woff');
    expect(formatOf('/fonts/Inter.ttf')).toBe('truetype');
    expect(formatOf('/fonts/Inter.otf')).toBe('opentype');
    expect(formatOf('/fonts/Inter.eot')).toBe('embedded-opentype');
  });

  it('ignores a query string or fragment and the extension case', () => {
    expect(formatOf('https://cdn.example.com/Inter.TTF?v=3#x')).toBe('truetype');
  });

  it('gives no hint for an unknown extension', () => {
    expect(formatOf('/fonts/Inter.svg')).toBeUndefined();
  });
});
```

`apps/registry-ui/registry/bases/base-ui/lib/code-language.spec.ts`:

```text
import { describe, expect, it } from 'vitest';

import { isPlainLanguage, languageLabel } from './code-language';

describe('isPlainLanguage', () => {
  it('holds for no language and for the plain-text names, in any case', () => {
    expect(isPlainLanguage(undefined)).toBe(true);
    expect(isPlainLanguage('')).toBe(true);
    expect(isPlainLanguage('text')).toBe(true);
    expect(isPlainLanguage('PlainText')).toBe(true);
    expect(isPlainLanguage('txt')).toBe(true);
  });

  it('does not hold for a language with a grammar', () => {
    expect(isPlainLanguage('ts')).toBe(false);
  });
});

describe('languageLabel', () => {
  it('names a language id or alias, case-insensitively', () => {
    expect(languageLabel('ts')).toBe('TypeScript');
    expect(languageLabel('TSX')).toBe('TSX');
    expect(languageLabel('bash')).toBe('Shell');
  });

  it('returns an unlisted id as given', () => {
    expect(languageLabel('Brainfuck')).toBe('Brainfuck');
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/lib/file-type.spec.ts registry/bases/base-ui/lib/font-format.spec.ts registry/bases/base-ui/lib/code-language.spec.ts registry/bases/base-ui/lib/language-options.spec.tsx
```

Expected (the modules do not exist yet):

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/code-language.spec.ts [ registry/bases/base-ui/lib/code-language.spec.ts ]
Error: Failed to resolve import "./code-language" from "registry/bases/base-ui/lib/code-language.spec.ts". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/file-type.spec.ts [ registry/bases/base-ui/lib/file-type.spec.ts ]
Error: Failed to resolve import "./file-type" from "registry/bases/base-ui/lib/file-type.spec.ts". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/font-format.spec.ts [ registry/bases/base-ui/lib/font-format.spec.ts ]
Error: Failed to resolve import "./font-format" from "registry/bases/base-ui/lib/font-format.spec.ts". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/language-options.spec.tsx [ registry/bases/base-ui/lib/language-options.spec.tsx ]
Error: Failed to resolve import "./language-options" from "registry/bases/base-ui/lib/language-options.spec.tsx". Does the file exist?
 Test Files  4 failed (4)
      Tests  no tests
```

- [ ] **Step 3: Create the types**

`apps/registry-ui/registry/bases/base-ui/types/chat-role.ts`:

```text
/** Sender of a chat message row. */
type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export type { ChatRole };
```

`apps/registry-ui/registry/bases/base-ui/types/chat-agent-identity.ts`:

```text
import type { ComponentType } from 'react';

/**
 * How the agent that owns an assistant message is shown: the identity row and
 * the streaming-accent colour. A host app's richer agent record is structurally
 * assignable to it, so the component never imports app state.
 */
interface ChatAgentIdentity {
  name?: string;
  /** Any CSS colour; used for the identity dot and the streaming accent. */
  color?: string;
  /** A brand or avatar glyph rendered in place of the colour dot (e.g. a provider mark). Takes `className` for sizing. */
  icon?: ComponentType<{ className?: string }>;
}

export type { ChatAgentIdentity };
```

`apps/registry-ui/registry/bases/base-ui/types/chat-suggestion.ts`:

```text
import type { ComponentType, ReactNode } from 'react';

/** One empty-state suggestion card. `prompt` is reported back when the card is picked; the rest is display. */
interface ChatSuggestion {
  /** Leading glyph (a lucide icon component, or any icon taking `className`). */
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  prompt: string;
}

export type { ChatSuggestion };
```

`apps/registry-ui/registry/bases/base-ui/types/language-option.ts`:

```text
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

/** The domain a language picker's built-in options are drawn from. */
type LanguageKind = 'locale' | 'code';

/** One selectable language: a stable `value`, a display `label`, an optional leading icon. */
interface LanguageOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/** A Material icon component: scales by `size` and accepts the usual svg props (`className`, ...). */
type LanguageIcon = FC<{ size?: string | number } & ComponentPropsWithoutRef<'svg'>>;

export type { LanguageKind, LanguageOption, LanguageIcon };
```

- [ ] **Step 4: Create the code-language table and the four helper modules**

`CODE_LANGUAGES` and `CODE_ALIASES` keep their declarations as they were; only their comments change (ASCII, and the drift spec's new home). `lib/language-options` is `.tsx` because `codeLanguageOptions` renders each icon element.

`apps/registry-ui/registry/bases/base-ui/constants/code-languages.ts`:

```text
import { CIcon } from '@zeroxsolutions/icons/material/c';
import { ConsoleIcon } from '@zeroxsolutions/icons/material/console';
import { CppIcon } from '@zeroxsolutions/icons/material/cpp';
import { CssIcon } from '@zeroxsolutions/icons/material/css';
import { CsharpIcon } from '@zeroxsolutions/icons/material/csharp';
import { DatabaseIcon } from '@zeroxsolutions/icons/material/database';
import { DockerIcon } from '@zeroxsolutions/icons/material/docker';
import { DocumentIcon } from '@zeroxsolutions/icons/material/document';
import { GoIcon } from '@zeroxsolutions/icons/material/go';
import { HtmlIcon } from '@zeroxsolutions/icons/material/html';
import { JavaIcon } from '@zeroxsolutions/icons/material/java';
import { JavascriptIcon } from '@zeroxsolutions/icons/material/javascript';
import { JsonIcon } from '@zeroxsolutions/icons/material/json';
import { KotlinIcon } from '@zeroxsolutions/icons/material/kotlin';
import { LessIcon } from '@zeroxsolutions/icons/material/less';
import { LuaIcon } from '@zeroxsolutions/icons/material/lua';
import { MarkdownIcon } from '@zeroxsolutions/icons/material/markdown';
import { MermaidIcon } from '@zeroxsolutions/icons/material/mermaid';
import { PhpIcon } from '@zeroxsolutions/icons/material/php';
import { PythonIcon } from '@zeroxsolutions/icons/material/python';
import { ReactIcon } from '@zeroxsolutions/icons/material/react';
import { RubyIcon } from '@zeroxsolutions/icons/material/ruby';
import { RustIcon } from '@zeroxsolutions/icons/material/rust';
import { SassIcon } from '@zeroxsolutions/icons/material/sass';
import { SwiftIcon } from '@zeroxsolutions/icons/material/swift';
import { TexIcon } from '@zeroxsolutions/icons/material/tex';
import { TomlIcon } from '@zeroxsolutions/icons/material/toml';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import { XmlIcon } from '@zeroxsolutions/icons/material/xml';
import { YamlIcon } from '@zeroxsolutions/icons/material/yaml';

import type { LanguageIcon } from '@/registry/bases/base-ui/types/language-option';

/**
 * The programming languages the design system can syntax-highlight (the Shiki
 * registry in `lib/shiki.ts`), each with a display label and its full-color
 * Material file-type icon. A self-contained copy of the id set, so importing it
 * loads no Shiki highlighter; `lib/language-options.spec.tsx` fails when it
 * drifts from the highlighter's `CODE_LANGUAGE_IDS`. A few ids reuse a
 * near-neighbour icon (`jsx`/`tsx` -> React, `shellscript` -> console,
 * `dockerfile` -> docker, `sql` -> database, `ini` -> document, `scss` -> sass).
 */
const CODE_LANGUAGES: readonly {
  id: string;
  label: string;
  Icon: LanguageIcon;
}[] = [
  { id: 'markdown', label: 'Markdown', Icon: MarkdownIcon },
  { id: 'mermaid', label: 'Mermaid', Icon: MermaidIcon },
  { id: 'latex', label: 'LaTeX', Icon: TexIcon },
  { id: 'json', label: 'JSON', Icon: JsonIcon },
  { id: 'yaml', label: 'YAML', Icon: YamlIcon },
  { id: 'toml', label: 'TOML', Icon: TomlIcon },
  { id: 'ini', label: 'INI', Icon: DocumentIcon },
  { id: 'xml', label: 'XML', Icon: XmlIcon },
  { id: 'html', label: 'HTML', Icon: HtmlIcon },
  { id: 'css', label: 'CSS', Icon: CssIcon },
  { id: 'scss', label: 'SCSS', Icon: SassIcon },
  { id: 'less', label: 'Less', Icon: LessIcon },
  { id: 'javascript', label: 'JavaScript', Icon: JavascriptIcon },
  { id: 'typescript', label: 'TypeScript', Icon: TypescriptIcon },
  { id: 'jsx', label: 'JSX', Icon: ReactIcon },
  { id: 'tsx', label: 'TSX', Icon: ReactIcon },
  { id: 'python', label: 'Python', Icon: PythonIcon },
  { id: 'shellscript', label: 'Shell', Icon: ConsoleIcon },
  { id: 'sql', label: 'SQL', Icon: DatabaseIcon },
  { id: 'dockerfile', label: 'Dockerfile', Icon: DockerIcon },
  { id: 'go', label: 'Go', Icon: GoIcon },
  { id: 'rust', label: 'Rust', Icon: RustIcon },
  { id: 'java', label: 'Java', Icon: JavaIcon },
  { id: 'kotlin', label: 'Kotlin', Icon: KotlinIcon },
  { id: 'swift', label: 'Swift', Icon: SwiftIcon },
  { id: 'c', label: 'C', Icon: CIcon },
  { id: 'cpp', label: 'C++', Icon: CppIcon },
  { id: 'csharp', label: 'C#', Icon: CsharpIcon },
  { id: 'php', label: 'PHP', Icon: PhpIcon },
  { id: 'ruby', label: 'Ruby', Icon: RubyIcon },
  { id: 'lua', label: 'Lua', Icon: LuaIcon },
];

/**
 * Common code-fence aliases -> the canonical id in {@link CODE_LANGUAGES}, so a
 * value like `ts` or `py` (as stored by an editor code block) still resolves to
 * its option for display. Mirrors the highlighter's alias table for the ids listed here.
 */
const CODE_ALIASES: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  cs: 'csharp',
  'c++': 'cpp',
  sh: 'shellscript',
  shell: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  console: 'shellscript',
  yml: 'yaml',
  md: 'markdown',
  htm: 'html',
};

export { CODE_LANGUAGES, CODE_ALIASES };
```

`apps/registry-ui/registry/bases/base-ui/lib/language-options.tsx`:

```text
import { DocumentIcon } from '@zeroxsolutions/icons/material/document';

import { CODE_ALIASES, CODE_LANGUAGES } from '@/registry/bases/base-ui/constants/code-languages';
import type { LanguageIcon, LanguageOption } from '@/registry/bases/base-ui/types/language-option';

/** The canonical code id for a possibly-aliased value (`ts` -> `typescript`); unchanged if unknown. */
function canonicalCodeId(value: string): string {
  return CODE_ALIASES[value] ?? value;
}

const CODE_ICON_BY_ID: Record<string, LanguageIcon> = Object.fromEntries(CODE_LANGUAGES.map((l) => [l.id, l.Icon]));

/**
 * The full-color Material icon component for a code-language id, resolving
 * aliases (`ts` -> `typescript`) and falling back to a generic document icon for
 * ids outside the highlightable set. Lets other surfaces (e.g. a read-only
 * code-block header) show the same icons the language picker uses. Self-scales
 * at `size="1em"`.
 */
function codeLanguageIcon(id: string): LanguageIcon {
  return CODE_ICON_BY_ID[canonicalCodeId(id)] ?? DocumentIcon;
}

let cachedCodeOptions: LanguageOption[] | null = null;

/**
 * The built-in `kind="code"` options: every highlightable language as a
 * {@link LanguageOption} carrying its Material icon. Computed once; every call
 * returns the same array.
 */
function codeLanguageOptions(): LanguageOption[] {
  cachedCodeOptions ??= CODE_LANGUAGES.map(({ id, label, Icon }) => ({
    value: id,
    label,
    icon: <Icon aria-hidden />,
  }));
  return cachedCodeOptions;
}

/** The native language name for a BCP-47 code (`ja` -> its name in Japanese), or the raw code as fallback. */
function localeLabel(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * The built-in `kind="locale"` options: each BCP-47 code labelled with its own
 * native language name. Pass explicit `options` to the picker to override
 * these labels.
 */
function localeOptions(codes: readonly string[]): LanguageOption[] {
  return codes.map((code) => ({ value: code, label: localeLabel(code) }));
}

export { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, localeOptions };
```

`apps/registry-ui/registry/bases/base-ui/lib/file-type.ts`:

```text
import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType,
  FileVideo,
  type LucideIcon,
} from 'lucide-react';

/** Lowercase extension (no dot) of a file name or path; '' when there is none. */
function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf('.');
  return dot <= 0 ? '' : base.slice(dot + 1).toLowerCase();
}

/** Extension -> lucide icon. Unlisted extensions fall back to a generic file. */
const ICON_BY_EXTENSION: Record<string, LucideIcon> = {
  // instructions / prose
  md: FileText,
  mdx: FileText,
  markdown: FileText,
  txt: FileText,
  rst: FileText,
  pdf: FileText,
  // structured data
  json: FileJson,
  yaml: FileCode,
  yml: FileCode,
  toml: FileCode,
  ini: FileCode,
  env: FileCode,
  // code
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  kt: FileCode,
  c: FileCode,
  h: FileCode,
  cpp: FileCode,
  cc: FileCode,
  cs: FileCode,
  php: FileCode,
  swift: FileCode,
  lua: FileCode,
  sql: FileCode,
  sh: FileCode,
  bash: FileCode,
  zsh: FileCode,
  html: FileCode,
  xml: FileCode,
  css: FileCode,
  scss: FileCode,
  less: FileCode,
  // images
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  avif: FileImage,
  bmp: FileImage,
  ico: FileImage,
  svg: FileImage,
  // fonts
  woff: FileType,
  woff2: FileType,
  ttf: FileType,
  otf: FileType,
  eot: FileType,
  // audio / video
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  m4a: FileAudio,
  mp4: FileVideo,
  webm: FileVideo,
  mov: FileVideo,
  avi: FileVideo,
  mkv: FileVideo,
  // archives
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  tgz: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
};

/** The lucide icon a file name or path maps to by its extension; a generic file icon when unlisted. */
function fileTypeIcon(name: string): LucideIcon {
  return ICON_BY_EXTENSION[extensionOf(name)] ?? File;
}

export { fileTypeIcon };
```

`apps/registry-ui/registry/bases/base-ui/lib/font-format.ts`:

```text
/** Font extension -> CSS `format()` hint. */
const FORMAT_BY_EXTENSION: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
  eot: 'embedded-opentype',
};

/** The CSS `format()` hint for a font URL, read off its extension; `undefined` for an unknown one. */
function formatOf(src: string): string | undefined {
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return ext ? FORMAT_BY_EXTENSION[ext] : undefined;
}

export { formatOf };
```

`apps/registry-ui/registry/bases/base-ui/lib/code-language.ts`:

```text
/** Languages with no real grammar: no header, no highlight (plain `<pre>`). */
const PLAIN_LANGUAGES = new Set(['', 'text', 'plaintext', 'plain', 'txt']);

/** Display name for a language id; falls back to the id itself when unlisted. */
const LANGUAGE_LABEL: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  json: 'JSON',
  jsonc: 'JSON',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  rust: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  kotlin: 'Kotlin',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  csharp: 'C#',
  php: 'PHP',
  swift: 'Swift',
  lua: 'Lua',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  shell: 'Shell',
  shellscript: 'Shell',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  less: 'Less',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  md: 'Markdown',
  mdx: 'MDX',
  markdown: 'Markdown',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  graphql: 'GraphQL',
};

/** True when `language` is absent or names plain text, so a code block shows it unhighlighted and without a header. */
function isPlainLanguage(language: string | undefined): boolean {
  return !language || PLAIN_LANGUAGES.has(language.toLowerCase());
}

/** Display name for a code-fence language id, case-insensitive; the id itself when unlisted. */
function languageLabel(language: string): string {
  return LANGUAGE_LABEL[language.toLowerCase()] ?? language;
}

export { isPlainLanguage, languageLabel };
```

Run (from `apps/registry-ui`) the Step 2 command again.
Expected:

```
 Test Files  4 passed (4)
      Tests  20 passed (20)
```

- [ ] **Step 5: Create the two hooks and `HighlightedCode`**

`useControllableState` is `file-tree.tsx`'s copy, with its options object named. `useHighlightedLines` and `HighlightedCode` are `code-block.tsx`'s, unchanged but for the `isPlainLanguage` import and a named props interface.

`apps/registry-ui/registry/bases/base-ui/hooks/use-controllable-state.ts`:

```text
import * as React from 'react';

interface UseControllableStateOptions<T> {
  /** The controlled value; `undefined` leaves the state uncontrolled. */
  prop: T | undefined;
  /** The initial uncontrolled value. */
  defaultProp: T;
  /** Called with every value set, controlled or not. */
  onChange?: (value: T) => void;
}

/**
 * Controlled/uncontrolled state: uses `prop` when provided, otherwise an
 * internal state seeded from `defaultProp`, the Base UI and Radix triad.
 * Setting a value calls `onChange` in both modes and updates the internal
 * state only when uncontrolled.
 */
function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultProp);
  const controlled = prop !== undefined;
  const value = controlled ? (prop as T) : uncontrolled;
  const setValue = React.useCallback(
    (next: T) => {
      if (!controlled) setUncontrolled(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [value, setValue];
}

export { useControllableState };
export type { UseControllableStateOptions };
```

`apps/registry-ui/registry/bases/base-ui/hooks/use-highlighted-lines.ts`:

```text
import { useEffect, useState } from 'react';

import { isPlainLanguage } from '@/registry/bases/base-ui/lib/code-language';
import { highlightToLines, type HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

/**
 * Tokenize `code` as `language` via the shared Shiki highlighter. Returns `null`
 * until the (async, lazily loaded) grammar resolves, and for plain or unknown
 * languages; the caller renders the raw string meanwhile. Unmount-safe; re-runs
 * on a code or language change.
 */
function useHighlightedLines(code: string, language: string | undefined): HighlightLine[] | null {
  const [lines, setLines] = useState<HighlightLine[] | null>(null);

  useEffect(() => {
    if (isPlainLanguage(language)) {
      setLines(null);
      return undefined;
    }
    let active = true;
    setLines(null);
    highlightToLines(code, language as string).then((result) => {
      if (active) setLines(result);
    });
    return () => {
      active = false;
    };
  }, [code, language]);

  return lines;
}

export { useHighlightedLines };
```

`apps/registry-ui/registry/bases/base-ui/components/data-display/highlighted-code.tsx`:

```text
import { Fragment, type ReactNode } from 'react';

import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

interface HighlightedCodeProps {
  /** Tokenized lines, as `useHighlightedLines` returns them. */
  lines: HighlightLine[];
}

/**
 * The tokens of highlighted source, each styled span in order with a newline
 * between lines. Renders no element of its own; place it inside a `<code>`.
 */
function HighlightedCode({ lines }: HighlightedCodeProps): ReactNode {
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line.map((token, j) =>
            token.style ? (
              <span key={j} style={token.style}>
                {token.content}
              </span>
            ) : (
              <Fragment key={j}>{token.content}</Fragment>
            ),
          )}
          {i < lines.length - 1 ? '\n' : null}
        </Fragment>
      ))}
    </>
  );
}

export { HighlightedCode };
export type { HighlightedCodeProps };
```

- [ ] **Step 6: Point the components at the moved code**

Rewrite `components/data-display/code-block.tsx` in full:

```text
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';
import { ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { useHighlightedLines } from '@/registry/bases/base-ui/hooks/use-highlighted-lines';
import { isPlainLanguage, languageLabel } from '@/registry/bases/base-ui/lib/code-language';
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * CodeBlock — a mono `<pre>` with Shiki syntax highlighting and a copy control,
 * composed from the SDK `Button`. When a `language` is given, the block tokenizes
 * through the shared Shiki highlighter (the same one the code editor uses) and
 * paints each token with a `var(--shiki-token-*)` color mapped to the design
 * tokens, so it tracks light/dark for free; a labelled language header (file-type
 * icon + name) sits above the body. Highlighting is async and degrades to plain
 * mono while the grammar loads and for unknown languages, so the code is always
 * legible. With no language (or `text`/`plaintext`) it stays a borderless plain
 * block with a hover copy button — used for fenced code inside markdown
 * (`MarkdownView codeBlocks`), `ToolCallCard` Parameters/Result panels, and JSON
 * disclosures.
 *
 * A read-only view: it renders the highlighted source, never an editing surface
 * — the editable code surface lives in the composite editor package's code-block
 * feature, which composes this same `CollapsibleCard` chrome so the two read
 * identically.
 *
 * `code` is the source string. Presentational — copy uses the Clipboard API
 * best-effort and resets after ~2s.
 */
interface CodeBlockProps {
  code: string;
  /** Shiki language id (e.g. `ts`, `json`, `bash`); drives highlighting + header. */
  language?: string;
  className?: string;
}

function CodeBlock({ code, language, className }: CodeBlockProps) {
  const lines = useHighlightedLines(code, language);
  const isPlain = isPlainLanguage(language);
  // A block carries the header only when the language is real; an unlabelled
  // block stays a borderless muted surface with a hover copy.
  const hasHeader = !isPlain;
  // The full-color Material icon for the language (shared with the language
  // switcher); it self-scales at 1em, so it carries no size class.
  const LanguageIcon = !isPlain ? codeLanguageIcon(language as string) : null;

  // The code body — a read-only Shiki `<pre>` whose long lines scroll through a
  // Base UI ScrollArea (its styled thin rail), not the OS overlay scrollbar a
  // native `overflow-x-auto` would leave.
  const body = (
    <ScrollAreaPrimitive.Root className="w-full overflow-hidden">
      <ScrollAreaPrimitive.Viewport className="w-full">
        <pre className="m-0 px-3 py-2 text-xs leading-relaxed">
          <code className="font-mono">{lines ? <HighlightedCode lines={lines} /> : code}</code>
        </pre>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );

  // An unlabelled block stays a minimal muted surface with a hover copy — no
  // header, so no CollapsibleCard chrome; used for fenced code inside markdown and JSON
  // panels, where a header/collapse would be noise. Borderless on purpose: the
  // surface is delineated by `bg-muted`, so a block nested inside a card doesn't
  // stack border-inside-border.
  if (!hasHeader) {
    return (
      <div
        data-slot="code-block"
        data-language={language}
        className={cn('group/code bg-muted/50 relative w-full overflow-hidden rounded-md', className)}
      >
        <CopyButton
          value={code}
          label="Copy code"
          className="bg-muted/70 absolute top-1 right-1 z-10 opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
        />
        {body}
      </div>
    );
  }

  // A labelled block composes the shared CollapsibleCard: the language (icon + label)
  // fills the title; copy + the collapse toggle fill the actions; the code body
  // is the collapsible content. `data-slot` stays "code-block" — the editor
  // stylesheet targets it — so the CollapsibleCard root carries it instead of its
  // default "collapsible-card".
  return (
    <CollapsibleCard
      variant="muted"
      data-slot="code-block"
      data-language={language}
      className={cn('group/code', className)}
    >
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          {LanguageIcon ? <LanguageIcon className="shrink-0" /> : null}
          <span className="text-xs">{languageLabel(language as string)}</span>
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CopyButton value={code} label="Copy code" size="icon" />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>{body}</CollapsibleCardContent>
    </CollapsibleCard>
  );
}

export { CodeBlock };
export type { CodeBlockProps };
```

Rewrite `components/data-display/file-type-icon.tsx` in full:

```text
import type { LucideProps } from 'lucide-react';

import { fileTypeIcon } from '@/registry/bases/base-ui/lib/file-type';

interface FileTypeIconProps extends LucideProps {
  /** File name or path; the icon is derived from its extension. */
  name: string;
}

/**
 * A lucide icon chosen for a file's type, derived from its extension
 * (`run.py` → code, `logo.png` → image, `Inter.woff2` → type, unknown → generic
 * file). Decorative — pair it with the visible file name, which supplies the
 * accessible label, or pass `aria-label` when it stands alone. All `LucideProps`
 * (`size`, `className`, `aria-*`) pass through.
 */
function FileTypeIcon({ name, ...props }: FileTypeIconProps) {
  const Icon = fileTypeIcon(name);
  return <Icon {...props} />;
}

export { FileTypeIcon };
export type { FileTypeIconProps };
```

`components/data-display/font-preview.tsx`: Replace (exactly once):

```text
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** Font extension → CSS `format()` hint. */
const FORMAT_BY_EXTENSION: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
  eot: 'embedded-opentype',
};

function formatOf(src: string): string | undefined {
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return ext ? FORMAT_BY_EXTENSION[ext] : undefined;
}

```

with:

```text
import { formatOf } from '@/registry/bases/base-ui/lib/font-format';
import { cn } from '@/registry/bases/base-ui/lib/utils';

```

`components/layout/file-tree.tsx`: Replace (exactly once):

```text
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * Minimal controlled/uncontrolled state: uses `prop` when provided, otherwise an
 * internal state seeded from `defaultProp`. Mirrors the Base UI / Radix triad.
 */
function useControllableState<T>(opts: {
  prop: T | undefined;
  defaultProp: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const { prop, defaultProp, onChange } = opts;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultProp);
  const controlled = prop !== undefined;
  const value = controlled ? (prop as T) : uncontrolled;
  const setValue = React.useCallback(
    (next: T) => {
      if (!controlled) setUncontrolled(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [value, setValue];
}

```

with:

```text
import { useControllableState } from '@/registry/bases/base-ui/hooks/use-controllable-state';
import { cn } from '@/registry/bases/base-ui/lib/utils';

```

`components/data-display/chat-message.tsx`: Replace (exactly once):

```text
import type { ChatAgentIdentity, ChatRole } from '../chat/chat-types';
```

with:

```text
import type { ChatAgentIdentity } from '@/registry/bases/base-ui/types/chat-agent-identity';
import type { ChatRole } from '@/registry/bases/base-ui/types/chat-role';
```

`components/data-entry/chat-empty-state.tsx`: Replace (exactly once):

```text
import type { ChatSuggestion } from '../chat/chat-types';
```

with:

```text
import type { ChatSuggestion } from '@/registry/bases/base-ui/types/chat-suggestion';
```

`components/data-entry/chat-empty-state.spec.tsx`: Replace (exactly once):

```text
import type { ChatSuggestion } from '../chat/chat-types';
```

with:

```text
import type { ChatSuggestion } from '@/registry/bases/base-ui/types/chat-suggestion';
```

`components/data-entry/language-switcher.tsx` (its re-exports go; callers import from `lib/` and `types/`): Replace (exactly once):

```text
import {
  canonicalCodeId,
  codeLanguageOptions,
  localeOptions,
  type LanguageKind,
  type LanguageOption,
} from '../language-switcher-data';

export { codeLanguageOptions, localeOptions } from '../language-switcher-data';
export type { LanguageKind, LanguageOption } from '../language-switcher-data';

```

with:

```text
import { canonicalCodeId, codeLanguageOptions, localeOptions } from '@/registry/bases/base-ui/lib/language-options';
import type { LanguageKind, LanguageOption } from '@/registry/bases/base-ui/types/language-option';

```

`editor/document/features/mermaid/mermaid.tsx`: Replace (exactly once):

```text
import { codeLanguageIcon } from '@/registry/bases/base-ui/components/language-switcher-data';
```

with:

```text
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
```

- [ ] **Step 7: Take the moved describes out of the switcher's spec**

`components/data-entry/language-switcher.spec.tsx`, first edit: Replace (exactly once):

```text
import { CODE_LANGUAGE_IDS } from '../../lib/shiki';
import { LanguageSwitcher, codeLanguageOptions, localeOptions } from './language-switcher';
import { CODE_LANGUAGE_OPTION_IDS } from '../language-switcher-data';
```

with:

```text
import { LanguageSwitcher } from './language-switcher';
```

Second edit: delete this block (it now lives in `lib/language-options.spec.tsx`), leaving `afterEach(cleanup);` followed by one blank line and `describe('LanguageSwitcher display forms'`:

```text
describe('codeLanguageOptions', () => {
  it('offers every highlightable language, each labelled and iconed', () => {
    const options = codeLanguageOptions();
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.value).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.icon).toBeTruthy();
    }
  });

  it('renders a Material svg icon for a code language', () => {
    const ts = codeLanguageOptions().find((o) => o.value === 'typescript');
    const { container } = render(<>{ts?.icon}</>);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('stays in sync with the highlighter language set (no drift)', () => {
    expect([...CODE_LANGUAGE_OPTION_IDS].sort()).toEqual([...CODE_LANGUAGE_IDS].sort());
  });
});

describe('localeOptions', () => {
  it('labels each BCP-47 code with its native language name', () => {
    const byValue = Object.fromEntries(localeOptions(['en', 'vi', 'ja']).map((o) => [o.value, o.label]));
    expect(byValue.en).toBe('English');
    // A name was resolved (not the raw code) for the non-English locales.
    expect(byValue.vi).not.toBe('vi');
    expect(byValue.ja).not.toBe('ja');
  });
});

```

- [ ] **Step 8: Delete the emptied files**

Run (from the repo root):

```bash
git rm -q apps/registry-ui/registry/bases/base-ui/components/chat/chat-types.ts apps/registry-ui/registry/bases/base-ui/components/language-switcher-data.tsx
```

- [ ] **Step 9: Ship the chat types with the `chat-message` item**

`registry:lib` with no `target`: the CLI writes each file under the consumer's `lib` alias and rewrites the component's `@/registry/bases/base-ui/types/...` imports to match. Checked with `shadcn add public/r/chat-message.json --dry-run --view` in a throwaway project with default aliases: the files land at `src/lib/chat-role.ts` and `src/lib/chat-agent-identity.ts` and the component imports `@/lib/chat-role` and `@/lib/chat-agent-identity`.

`apps/registry-ui/registry.json`: replace (exactly once)

```text
        {
          "path": "registry/bases/base-ui/components/chat/chat-types.ts",
          "type": "registry:component"
        }
```

with:

```text
        {
          "path": "registry/bases/base-ui/types/chat-role.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/types/chat-agent-identity.ts",
          "type": "registry:lib"
        }
```

No other item's files import a moved module: `code-block`, `file-tree`, `font-preview`, `file-type-icon` and `language-switcher` are not published items.

- [ ] **Step 10: Check nothing names the old homes and the spec's checks hold**

Run (from `apps/registry-ui`):

```bash
git grep -n -e 'chat-types' -e 'language-switcher-data' -e 'CODE_LANGUAGE_OPTION_IDS' -- registry src registry.json
(
  cd registry/bases/base-ui
  find components -mindepth 1 -maxdepth 1 -type d ! -name docs ! -name data-entry \
    ! -name navigation ! -name feedback ! -name data-display ! -name layout ! -name general
  find components -maxdepth 1 -type f
  grep -rlnE '^export (function|const [A-Z])' components types constants hooks lib --include='*.ts' --include='*.tsx' \
    | grep -v /docs/ | grep -E 'components/|types/|constants/|use-controllable-state|use-highlighted-lines|code-language|file-type|font-format|language-options'
)
```

Expected: nothing at all. (The spec's kind-folder and loose-file checks printed `components/chat` and `components/language-switcher-data.tsx` before this task.)

- [ ] **Step 11: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/lib registry/bases/base-ui/components/data-display registry/bases/base-ui/components/data-entry/chat-empty-state.spec.tsx registry/bases/base-ui/components/data-entry/language-switcher.spec.tsx registry/bases/base-ui/components/layout/file-tree.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-b1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-b1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-b1.log" 2>&1; grep 'error TS' "$S/tsc-b1.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/types registry/bases/base-ui/constants registry/bases/base-ui/lib registry/bases/base-ui/hooks registry/bases/base-ui/components/data-display registry/bases/base-ui/components/data-entry registry/bases/base-ui/components/layout/file-tree.tsx registry/bases/base-ui/editor/document/features/mermaid/mermaid.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-b1.log" 2>&1; tail -1 "$S/sb-b1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  15 passed (15)
      Tests  92 passed (92)
 Test Files  72 passed (72)
      Tests  379 passed (379)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

- [ ] **Step 12: Commit**

`$S/msg-b1.txt`:

```
refactor(registry-ui): move types, helpers and hooks out of components

Why: component files declared the chat and language types, the code
language table, file-type and font-format helpers and two hooks next
to the roots that happened to use them first, so a second caller
imported a component file for a type or a lookup, and code-block.tsx
carried a hook and a second component. Each now sits in the bucket its
kind names (types/, constants/, lib/, hooks/), and the four pure helper
modules carry specs of their own.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/types $B/constants $B/lib/language-options.tsx $B/lib/language-options.spec.tsx \
  $B/lib/file-type.ts $B/lib/file-type.spec.ts $B/lib/font-format.ts $B/lib/font-format.spec.ts \
  $B/lib/code-language.ts $B/lib/code-language.spec.ts $B/hooks/use-controllable-state.ts \
  $B/hooks/use-highlighted-lines.ts $B/components/data-display/highlighted-code.tsx
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-b1.txt" -- apps/registry-ui/registry apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

## Code and preview families

### Task 2: CollapsibleCard on upstream `ui/collapsible`, with a `plain` variant

**Files:**

- Create: `apps/registry-ui/registry/bases/base-ui/components/layout/collapsible-card.spec.tsx`
- Modify (rewritten): `apps/registry-ui/registry/bases/base-ui/components/layout/collapsible-card.tsx`

**Interfaces:**

- Consumes: the b1 tree; `ui/collapsible.tsx` (`Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`) as `shadcn add` wrote it.
- Produces: `CollapsibleCard`, `CollapsibleCardHeader`, `CollapsibleCardTitle`, `CollapsibleCardActions`, `CollapsibleCardTrigger`, `CollapsibleCardContent` with the same names and props as before, plus `variant="plain"` (replaces the removed `Section`), `data-variant` on the root (`default` | `muted` | `plain`), a `CollapsibleCardTrigger` whose `children` replace the chevron, and `export type { CollapsibleCardProps }`. Every other group composes these parts; none of their call sites change.

- [ ] **Step 1: Write the family's spec (there was none)**

`apps/registry-ui/registry/bases/base-ui/components/layout/collapsible-card.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from './collapsible-card';

afterEach(cleanup);

function renderCard(props: ComponentProps<typeof CollapsibleCard> = {}) {
  return render(
    <CollapsibleCard {...props}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>Layers</CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>Body</CollapsibleCardContent>
    </CollapsibleCard>,
  );
}

describe('CollapsibleCard', () => {
  it('opens by default and collapses from its trigger', () => {
    renderCard();
    expect(screen.getByText('Body')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.queryByText('Body')).toBeNull();
  });

  it('starts collapsed when defaultOpen is false', () => {
    renderCard({ defaultOpen: false });
    expect(screen.queryByText('Body')).toBeNull();
    expect(screen.getByRole('button', { name: 'Toggle' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('stamps its variant on the root, default when none is given', () => {
    const { container } = renderCard();
    const root = container.querySelector('[data-slot="collapsible-card"]');
    expect(root?.getAttribute('data-variant')).toBe('default');
  });

  it('takes the plain variant', () => {
    const { container } = renderCard({ variant: 'plain' });
    const root = container.querySelector('[data-slot="collapsible-card"]');
    expect(root?.getAttribute('data-variant')).toBe('plain');
  });

  it('lets the trigger take its own content and name', () => {
    render(
      <CollapsibleCard>
        <CollapsibleCardTrigger aria-label="Collapse layers">Layers</CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    const trigger = screen.getByRole('button', { name: 'Collapse layers' });
    expect(trigger.textContent).toBe('Layers');
  });

  it('composes a caller onClick on the trigger with the toggle', () => {
    let clicks = 0;
    render(
      <CollapsibleCard>
        <CollapsibleCardTrigger onClick={() => (clicks += 1)} />
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(clicks).toBe(1);
    expect(screen.queryByText('Body')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch the new behaviour fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/layout/collapsible-card.spec.tsx`
Expected (RED, real output):

```
     ✓ opens by default and collapses from its trigger 39ms
     ✓ starts collapsed when defaultOpen is false 4ms
     × stamps its variant on the root, default when none is given 5ms
     × takes the plain variant 3ms
     × lets the trigger take its own content and name 4ms
     ✓ composes a caller onClick on the trigger with the toggle 4ms
AssertionError: expected null to be 'default' // Object.is equality
AssertionError: expected null to be 'plain' // Object.is equality
AssertionError: expected '' to be 'Layers' // Object.is equality
      Tests  3 failed | 3 passed (6)
```

The three passing cases pin the open/close behaviour the rewrite must keep.

- [ ] **Step 3: Rewrite the family on `ui/collapsible`**

`apps/registry-ui/registry/bases/base-ui/components/layout/collapsible-card.tsx`:

```text
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A header over a collapsible body, open by default. Compose
 * `CollapsibleCardHeader` (holding `CollapsibleCardTitle` and
 * `CollapsibleCardActions`, where `CollapsibleCardTrigger` usually sits) above
 * `CollapsibleCardContent`. `variant` picks the surface: `default` a bordered
 * card, `muted` a borderless fill for a block nested in another card, `plain` no
 * surface and a rule underneath, for a titled group of rows in a panel.
 */
const collapsibleCardVariants = cva('group/collapsible-card flex w-full flex-col overflow-hidden text-sm', {
  variants: {
    variant: {
      default: 'rounded-md border border-border bg-card text-card-foreground',
      muted: 'rounded-md bg-muted/50',
      plain: 'border-b border-border',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CollapsibleCardProps = ComponentProps<typeof Collapsible> & VariantProps<typeof collapsibleCardVariants>;

function CollapsibleCard({
  className,
  variant = 'default',
  defaultOpen = true,
  ...props
}: CollapsibleCardProps): ReactNode {
  return (
    <Collapsible
      data-slot="collapsible-card"
      data-variant={variant}
      defaultOpen={defaultOpen}
      className={cn(collapsibleCardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CollapsibleCardHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="collapsible-card-header"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 group-data-[variant=plain]/collapsible-card:px-2.5 has-data-[slot=collapsible-card-actions]:justify-between',
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleCardTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="collapsible-card-title"
      // A child combinator, so an icon inside a nested control the title holds
      // (a combobox trigger) keeps its own size.
      className={cn(
        "text-muted-foreground flex min-w-0 items-center gap-1.5 font-medium [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleCardActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="collapsible-card-actions" className={cn('flex items-center gap-0.5', className)} {...props} />;
}

function CollapsibleCardTrigger({
  className,
  children = <ChevronDown className="transition-transform group-aria-expanded/collapsible-card-trigger:rotate-180" />,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  return (
    <CollapsibleTrigger
      data-slot="collapsible-card-trigger"
      aria-label="Toggle"
      render={<Button variant="ghost" size="icon" />}
      className={cn('group/collapsible-card-trigger text-muted-foreground', className)}
      {...props}
    >
      {children}
    </CollapsibleTrigger>
  );
}

function CollapsibleCardContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent data-slot="collapsible-card-content" className={cn('overflow-hidden', className)} {...props} />
  );
}

export {
  CollapsibleCard,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardActions,
  CollapsibleCardTrigger,
  CollapsibleCardContent,
  collapsibleCardVariants,
};
export type { CollapsibleCardProps };
```

- [ ] **Step 4: Run the spec, the suite, the type check, lint, format and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/collapsible-card.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'error TS'
pnpm exec eslint registry/bases/base-ui/components/layout/collapsible-card.tsx registry/bases/base-ui/components/layout/collapsible-card.spec.tsx
pnpm exec prettier --check registry/bases/base-ui/components/layout/collapsible-card.tsx registry/bases/base-ui/components/layout/collapsible-card.spec.tsx
pnpm exec shadcn build >/dev/null && pnpm exec shadcn registry validate registry.json
```

Expected: `Test Files  1 passed (1)`, `Tests  6 passed (6)`; `Test Files  73 passed (73)`, `Tests  385 passed (385)`; `1` (the baseline TS6307 in `components/docs/installation.spec.tsx`); eslint prints only the `No cached ProjectGraph` warning for `@nx/enforce-module-boundaries`, exit 0; `All matched files use Prettier code style!`; `Checked 1 registry file and 22 items.`

- [ ] **Step 5: Commit**

`$S/msg-code-1.txt`:

```
refactor(registry-ui): build collapsible-card on the upstream collapsible

Why: the card re-wrapped the Base UI primitive that ui/collapsible
already wraps, so it bypassed the vendored part every other surface
composes. It now stamps data-variant on its root and takes a plain
variant, which is what the removed Section's callers compose instead,
and its trigger takes children so a caller can replace the chevron.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
L=apps/registry-ui/registry/bases/base-ui/components/layout
git add "$L/collapsible-card.spec.tsx"
git commit -q -F "$S/msg-code-1.txt" -- "$L/collapsible-card.tsx" "$L/collapsible-card.spec.tsx"
git log -1 --format='%h %s'
```

Expected: the hook's `Successfully ran targets lint, typecheck, build, test for 5 projects`; the subject above.

---

### Task 3: CodeBlock takes its header as children; HighlightedCode owns its `<code>`

**Files:**

- Modify (rewritten): `apps/registry-ui/registry/bases/base-ui/components/data-display/code-block.tsx`, `.../data-display/highlighted-code.tsx`, `.../data-display/code-block.spec.tsx`
- Modify: `.../data-display/markdown-view.tsx` and `.../data-display/markdown-view.spec.tsx` (the fenced-code renderer composes the header), `.../editor/document/features/code-block/code-block.tsx`, `.../editor/document/features/mermaid/mermaid.tsx`, `.../editor/mermaid/react/viewer.tsx` (their read-only `CodeBlock`s compose the header)

**Interfaces:**

- Consumes: Task 2's `CollapsibleCard` parts; b1's `hooks/use-highlighted-lines.ts`, `lib/code-language.ts` (`isPlainLanguage`, `languageLabel`), `lib/language-options.tsx` (`codeLanguageIcon`), `feedback/copy-button.tsx` (`CopyButton`, `CopyButtonProps`).
- Produces: `CodeBlock({ code, language?, children?, ...CollapsibleCardProps })` (variant defaults to `muted`; `data-slot="code-block"` and `data-language` kept on the root, which the editor stylesheet targets); `CodeBlockLanguage` (`ComponentProps<'span'>`, `data-slot="code-block-language"`); `CodeBlockCopy` (`CopyButtonProps` minus `value`, `data-slot="code-block-copy"`); `HighlightedCode({ lines: HighlightLine[] | null, ...ComponentProps<'code'> })`, which renders its `children` until `lines` arrive. `CodeBlock code language` with no children now renders no header at any language: the header is the caller's composition.
- Callers left headerless on purpose (source not edited): `layout/tool-call-card.tsx` (4 JSON blocks under a `Parameters`/`Result` label, which the old doc comment already named as headerless use) and `components/docs/{usage,installation,preview-code}.tsx` (spec c). They compile unchanged.

- [ ] **Step 1: Rewrite the CodeBlock spec for the composed header**

`apps/registry-ui/registry/bases/base-ui/components/data-display/code-block.spec.tsx` (the two header cases are replaced; five cases are new):

```text
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Highlighting is async + pulls the heavy Shiki highlighter; stub it so the
// component's rendering logic is tested deterministically. The default resolves
// `null` (degrade to plain text); individual cases override with real tokens.
vi.mock('../../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import { CodeBlock, CodeBlockCopy, CodeBlockLanguage } from './code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '../layout/collapsible-card';
import { highlightToLines } from '../../lib/shiki';

beforeAll(() => {
  // Base UI ScrollArea measures its viewport with a ResizeObserver and queries
  // Element.getAnimations — both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

describe('CodeBlock', () => {
  it('renders the code string', () => {
    render(<CodeBlock code={'{ "a": 1 }'} />);
    expect(screen.getByText('{ "a": 1 }')).toBeTruthy();
  });

  it('stamps the language as data-language', () => {
    const { container } = render(<CodeBlock code="x" language="json" />);
    expect(container.querySelector('[data-language="json"]')).toBeTruthy();
  });

  it('renders no header of its own, whatever the language', () => {
    const { container } = render(<CodeBlock code="const x = 1" language="ts" />);
    expect(container.querySelector('[data-slot="collapsible-card-header"]')).toBeNull();
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('takes a composed header in place of the floating copy', () => {
    const { container } = render(
      <CodeBlock code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <CodeBlockLanguage />
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeBlockCopy />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      </CodeBlock>,
    );
    expect(container.querySelector('[data-slot="code-block-language"]')?.textContent).toBe('TypeScript');
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(1);
    expect(container.querySelector('[data-slot="code-block-copy"]')).toBeTruthy();
  });

  it('collapses the code from a composed trigger', () => {
    render(
      <CodeBlock code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTrigger />
        </CollapsibleCardHeader>
      </CodeBlock>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.queryByText('const x = 1')).toBeNull();
  });

  it('copies the root code from CodeBlockCopy', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <CodeBlock code="payload" language="json">
        <CodeBlockCopy label="Copy payload" />
      </CodeBlock>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy payload' }));

    expect(writeText).toHaveBeenCalledWith('payload');
  });

  it('labels a plain block as plain text', () => {
    render(
      <CodeBlock code="hello">
        <CodeBlockLanguage />
      </CodeBlock>,
    );
    expect(screen.getByText('Plain text')).toBeTruthy();
  });

  it('paints highlighted token spans when the highlighter resolves lines', async () => {
    // jsdom's CSS parser drops `var()` colors, so assert with a parseable value;
    // the real `var(--shiki-token-*)` palette is covered by the lib spec.
    vi.mocked(highlightToLines).mockResolvedValueOnce([
      [{ content: 'const', style: { color: 'rgb(1, 2, 3)' } }, { content: ' x' }],
    ]);
    render(<CodeBlock code="const x" language="ts" />);

    const keyword = await screen.findByText('const');
    expect(keyword.tagName).toBe('SPAN');
    expect(keyword.style.color).toBe('rgb(1, 2, 3)');
  });

  it('copies the code and flips the label to Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="payload" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('payload');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy());
  });

  it('no-ops when the clipboard API is unavailable', () => {
    Object.assign(navigator, { clipboard: undefined });
    render(<CodeBlock code="payload" />);
    // Clicking must not throw, and the label stays "Copy code".
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });
});
```

Add two cases to `apps/registry-ui/registry/bases/base-ui/components/data-display/markdown-view.spec.tsx`; they pin today's fenced-code header and pass before and after this task:

In `apps/registry-ui/registry/bases/base-ui/components/data-display/markdown-view.spec.tsx` replace

```text
    it('keeps inline code as a plain chip (no copy button)', () => {
```

with

````text
    it('heads a fenced block that names a language with that language', () => {
      const { container } = render(<MarkdownView codeBlocks>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      expect(screen.getByText('JSON')).toBeTruthy();
      expect(container.querySelector('[data-slot="collapsible-card-header"]')).toBeTruthy();
    });

    it('leaves a fenced block with no language headerless', () => {
      const { container } = render(<MarkdownView codeBlocks>{'```\nline one\nline two\n```'}</MarkdownView>);
      expect(container.querySelector('[data-slot="collapsible-card-header"]')).toBeNull();
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
    });

    it('keeps inline code as a plain chip (no copy button)', () => {
````

- [ ] **Step 2: Run both specs and watch the new cases fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/data-display/code-block.spec.tsx registry/bases/base-ui/components/data-display/markdown-view.spec.tsx`
Expected (RED, real output for code-block.spec; markdown-view.spec `8 passed`):

```
     ✓ renders the code string 23ms
     ✓ stamps the language as data-language 15ms
     × renders no header of its own, whatever the language 9ms
     × takes a composed header in place of the floating copy 5ms
     ✓ collapses the code from a composed trigger 13ms
     × copies the root code from CodeBlockCopy 19ms
     × labels a plain block as plain text 2ms
     ✓ paints highlighted token spans when the highlighter resolves lines 9ms
     ✓ copies the code and flips the label to Copied 8ms
     ✓ no-ops when the clipboard API is unavailable 4ms
AssertionError: expected <div …(2)>…(2)</div> to be null
AssertionError: expected undefined to be 'TypeScript' // Object.is equality
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Copy payload"
TestingLibraryElementError: Unable to find an element with the text: Plain text. ...
```

`collapses the code from a composed trigger` passes before the change only because today's built-in header carries a trigger; after it, the composed trigger is the only one.

- [ ] **Step 3: Rewrite HighlightedCode and CodeBlock**

`apps/registry-ui/registry/bases/base-ui/components/data-display/highlighted-code.tsx`:

```text
import { Fragment, type ComponentProps, type ReactNode } from 'react';

import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface HighlightedCodeProps extends ComponentProps<'code'> {
  /** Tokenized lines, as `useHighlightedLines` returns them; `null` renders `children` instead. */
  lines: HighlightLine[] | null;
}

/**
 * A mono `<code>` holding highlighted source, each styled token span in order
 * with a newline between lines. Until `lines` arrive it renders `children`, the
 * raw source, so the code is readable while the grammar loads.
 */
function HighlightedCode({ lines, className, children, ...props }: HighlightedCodeProps): ReactNode {
  return (
    <code data-slot="highlighted-code" className={cn('font-mono', className)} {...props}>
      {lines
        ? lines.map((line, i) => (
            <Fragment key={i}>
              {line.map((token, j) =>
                token.style ? (
                  <span key={j} style={token.style}>
                    {token.content}
                  </span>
                ) : (
                  <Fragment key={j}>{token.content}</Fragment>
                ),
              )}
              {i < lines.length - 1 ? '\n' : null}
            </Fragment>
          ))
        : children}
    </code>
  );
}

export { HighlightedCode };
export type { HighlightedCodeProps };
```

`apps/registry-ui/registry/bases/base-ui/components/data-display/code-block.tsx`:

````text
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';

import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';
import { CopyButton, type CopyButtonProps } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { CollapsibleCard, CollapsibleCardContent } from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { useHighlightedLines } from '@/registry/bases/base-ui/hooks/use-highlighted-lines';
import { isPlainLanguage, languageLabel } from '@/registry/bases/base-ui/lib/code-language';
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

interface CodeBlockContextValue {
  code: string;
  language: string | undefined;
}

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

function useCodeBlock(): CodeBlockContextValue {
  const context = useContext(CodeBlockContext);
  if (!context) throw new Error('CodeBlockLanguage and CodeBlockCopy must be placed inside a CodeBlock.');
  return context;
}

interface CodeBlockProps extends ComponentProps<typeof CollapsibleCard> {
  /** The source shown, and what a copy writes to the clipboard. */
  code: string;
  /** Shiki language id (`ts`, `json`, `bash`); absent or plain text renders unhighlighted. */
  language?: string;
  /** The header, composed from `CollapsibleCard` parts; absent, a copy button floats over the code on hover. */
  children?: ReactNode;
}

/**
 * Read-only source over a collapsible card, highlighted through the shared Shiki
 * highlighter and falling back to plain mono while the grammar loads. Compose a
 * header as children:
 *
 * ```tsx
 * <CodeBlock code={source} language="ts">
 *   <CollapsibleCardHeader>
 *     <CollapsibleCardTitle>
 *       <CodeBlockLanguage />
 *     </CollapsibleCardTitle>
 *     <CollapsibleCardActions>
 *       <CodeBlockCopy />
 *       <CollapsibleCardTrigger />
 *     </CollapsibleCardActions>
 *   </CollapsibleCardHeader>
 * </CodeBlock>
 * ```
 *
 * The root keeps `data-slot="code-block"`; the editor stylesheet targets it.
 */
function CodeBlock({ code, language, variant = 'muted', className, children, ...props }: CodeBlockProps): ReactNode {
  const lines = useHighlightedLines(code, language);

  return (
    <CodeBlockContext.Provider value={{ code, language }}>
      <CollapsibleCard
        data-slot="code-block"
        data-language={language}
        variant={variant}
        className={cn('group/code-block relative', className)}
        {...props}
      >
        {children ?? (
          <CopyButton
            value={code}
            label="Copy code"
            className="bg-muted/70 absolute top-1 right-1 z-10 opacity-0 backdrop-blur transition-opacity group-hover/code-block:opacity-100 focus-visible:opacity-100"
          />
        )}
        <CollapsibleCardContent>
          {/* A ScrollArea rather than overflow-x-auto, so long lines scroll on the styled rail instead of the OS overlay bar. */}
          <ScrollAreaPrimitive.Root className="w-full overflow-hidden">
            <ScrollAreaPrimitive.Viewport className="w-full">
              <pre className="m-0 px-3 py-2 text-xs leading-relaxed">
                <HighlightedCode lines={lines}>{code}</HighlightedCode>
              </pre>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="horizontal" />
            <ScrollAreaPrimitive.Corner />
          </ScrollAreaPrimitive.Root>
        </CollapsibleCardContent>
      </CollapsibleCard>
    </CodeBlockContext.Provider>
  );
}

/** The block's language as its icon and display name, `Plain text` when it has none; `children` replace the name. */
function CodeBlockLanguage({ className, children, ...props }: ComponentProps<'span'>): ReactNode {
  const { language } = useCodeBlock();
  const plain = isPlainLanguage(language);
  const LanguageIcon = codeLanguageIcon(plain ? 'text' : (language as string));

  return (
    <span
      data-slot="code-block-language"
      className={cn('flex min-w-0 items-center gap-1.5 text-xs', className)}
      {...props}
    >
      <LanguageIcon aria-hidden className="shrink-0" />
      {children ?? (plain ? 'Plain text' : languageLabel(language as string))}
    </span>
  );
}

type CodeBlockCopyProps = Omit<CopyButtonProps, 'value'>;

/** Copies the block's code; takes every `CopyButton` prop but `value`. */
function CodeBlockCopy({ label = 'Copy code', size = 'icon', ...props }: CodeBlockCopyProps): ReactNode {
  const { code } = useCodeBlock();
  return <CopyButton data-slot="code-block-copy" value={code} label={label} size={size} {...props} />;
}

export { CodeBlock, CodeBlockLanguage, CodeBlockCopy };
export type { CodeBlockProps, CodeBlockCopyProps };
````

- [ ] **Step 4: Compose the header at each caller that showed one**

In `apps/registry-ui/registry/bases/base-ui/components/data-display/markdown-view.tsx` replace

```text
import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';
import { cn } from '@/registry/bases/base-ui/lib/utils';
```

with

```text
import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { isPlainLanguage } from '@/registry/bases/base-ui/lib/code-language';
import { cn } from '@/registry/bases/base-ui/lib/utils';
```

and

```text
    if (isBlock) {
      return <CodeBlock code={text.replace(/\n$/, '')} language={lang ?? 'text'} />;
    }
```

with

```text
    if (isBlock) {
      return (
        <CodeBlock code={text.replace(/\n$/, '')} language={lang ?? 'text'}>
          {isPlainLanguage(lang) ? undefined : (
            <CollapsibleCardHeader>
              <CollapsibleCardTitle>
                <CodeBlockLanguage />
              </CollapsibleCardTitle>
              <CollapsibleCardActions>
                <CodeBlockCopy />
                <CollapsibleCardTrigger />
              </CollapsibleCardActions>
            </CollapsibleCardHeader>
          )}
        </CodeBlock>
      );
    }
```

In `apps/registry-ui/registry/bases/base-ui/editor/document/features/code-block/code-block.tsx` replace

```text
import { CodeBlock as CodeBlockSurface } from '@/registry/bases/base-ui/components/data-display/code-block';
```

with

```text
import {
  CodeBlock as CodeBlockSurface,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
```

and

```text
/**
 * The node view inside a `contentEditable={false}` boundary that stops
```

with

```text
/**
 * The read-only surface: the registry `CodeBlock`, with a language header when
 * the block names a real language and the floating copy when it is plain text.
 */
function ReadOnlyCodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language: string;
  className?: string;
}): React.ReactNode {
  return (
    <CodeBlockSurface code={code} language={language} className={className}>
      {PLAIN_LANGUAGES.has(language.toLowerCase()) ? undefined : (
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <CodeBlockLanguage />
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeBlockCopy />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      )}
    </CodeBlockSurface>
  );
}

/**
 * The node view inside a `contentEditable={false}` boundary that stops
```

and

```text
        <CodeBlockSurface code={attrs.code} language={attrs.language} />
```

with

```text
        <ReadOnlyCodeBlock code={attrs.code} language={attrs.language} />
```

and

```text
    return <CodeBlockSurface code={code} language={language} className="my-4" />;
```

with

```text
    return <ReadOnlyCodeBlock code={code} language={language} className="my-4" />;
```

In `apps/registry-ui/registry/bases/base-ui/editor/document/features/mermaid/mermaid.tsx` replace

```text
import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';
```

with

```text
import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
```

and

```text
    <CodeBlock code={String(node.attrs?.source ?? '')} language="mermaid" className="my-4" />
```

with

```text
    <CodeBlock code={String(node.attrs?.source ?? '')} language="mermaid" className="my-4">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
```

(the file already imports `CollapsibleCardHeader`, `CollapsibleCardTitle`, `CollapsibleCardActions`, `CollapsibleCardTrigger`).

In `apps/registry-ui/registry/bases/base-ui/editor/mermaid/react/viewer.tsx` replace

```text
import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';
```

with

```text
import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
```

and

```text
  return <CodeBlock code={source} language="mermaid" className={className} />;
```

with

```text
  return (
    <CodeBlock code={source} language="mermaid" className={className}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
  );
```

- [ ] **Step 5: Run the specs, the suite, the type check, lint, format and the registry build**

Run (from `apps/registry-ui`), with `F` the eight files of this task:

```bash
D=registry/bases/base-ui
F="$D/components/data-display/code-block.tsx $D/components/data-display/code-block.spec.tsx $D/components/data-display/highlighted-code.tsx $D/components/data-display/markdown-view.tsx $D/components/data-display/markdown-view.spec.tsx $D/editor/document/features/code-block/code-block.tsx $D/editor/document/features/mermaid/mermaid.tsx $D/editor/mermaid/react/viewer.tsx"
pnpm exec vitest run $D/components/data-display/code-block.spec.tsx $D/components/data-display/markdown-view.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'error TS'
pnpm exec eslint $F
pnpm exec prettier --check $F
pnpm exec shadcn build >/dev/null && pnpm exec shadcn registry validate registry.json
```

Expected: `Test Files  2 passed (2)`, `Tests  18 passed (18)`; `Test Files  73 passed (73)`, `Tests  390 passed (390)` (the editor's `code-block.spec.tsx` and `mermaid.spec.tsx` pass unchanged; they query `[data-slot="code-block"]` and `Copy code`); `1`; eslint exit 0 with only the `No cached ProjectGraph` warning; `All matched files use Prettier code style!`; `Checked 1 registry file and 22 items.` No `registry.json` item lists or imports these files, so the file is unchanged.

- [ ] **Step 6: Commit**

`$S/msg-code-2.txt`:

```
refactor(registry-ui): compose the code-block header from collapsible-card parts

Why: CodeBlock decided its own header from the language, so a caller
could neither drop the header on a labelled block nor put anything
else in it, and the editor's editable block re-built the same header
by hand beside it. The header is now the caller's children, over the
CollapsibleCard parts, with CodeBlockLanguage and CodeBlockCopy
reading the root's language and code. HighlightedCode renders its own
code element and the raw source until the tokens arrive.

The tool-call card and the docs pages pass no header, so their blocks
render headerless with the floating copy.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
D=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-code-2.txt" -- \
  "$D/components/data-display/code-block.tsx" "$D/components/data-display/code-block.spec.tsx" \
  "$D/components/data-display/highlighted-code.tsx" "$D/components/data-display/markdown-view.tsx" \
  "$D/components/data-display/markdown-view.spec.tsx" "$D/editor/document/features/code-block/code-block.tsx" \
  "$D/editor/document/features/mermaid/mermaid.tsx" "$D/editor/mermaid/react/viewer.tsx"
git log -1 --format='%h %s'
```

Expected: the hook's success line for 5 projects; the subject above.

---

### Task 4: MarkdownView, ImagePreview, FontPreview and FileTypeIcon take the family rules

**Files:**

- Create: `apps/registry-ui/registry/bases/base-ui/components/data-display/file-type-icon.spec.tsx`
- Modify (rewritten): `.../data-display/markdown-view.tsx`, `.../data-display/image-preview.tsx`, `.../data-display/font-preview.tsx`, `.../data-display/file-type-icon.tsx`

**Interfaces:**

- Consumes: Task 3's `markdown-view.tsx`; b1's `lib/font-format.ts` (`formatOf`), `lib/file-type.ts` (`fileTypeIcon`).
- Produces: the same public props for all four (`MarkdownView` `children` + `codeBlocks`; `ImagePreview` `src` + img props; `FontPreview` `src`, `format`, `sizes`, `children`; `FileTypeIcon` `name` + `LucideProps`). `MarkdownView` is still memoized. `FileTypeIcon` gains `data-slot="file-type-icon"` on its svg. No module constant holds a class string or a style object: MarkdownView's `PROSE`/`PROSE_CODE` become `markdownViewVariants` (a `cva` whose one variant is `codeBlocks`), `INLINE_CODE` goes onto its element, ImagePreview's `CHECKERBOARD` style object becomes classes on its element, FontPreview's `DEFAULT_SIZES` becomes the prop's default. No `@utility` is added: each of these class sets has one component using it.

- [ ] **Step 1: Write the FileTypeIcon spec**

`apps/registry-ui/registry/bases/base-ui/components/data-display/file-type-icon.spec.tsx`:

```text
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FileTypeIcon } from './file-type-icon';

afterEach(cleanup);

describe('FileTypeIcon', () => {
  it('renders an svg marked as the file type icon', () => {
    const { container } = render(<FileTypeIcon name="run.py" />);
    expect(container.querySelector('svg[data-slot="file-type-icon"]')).toBeTruthy();
  });

  it('passes its svg props through', () => {
    const { container } = render(<FileTypeIcon name="logo.png" aria-label="Image file" className="size-3" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Image file');
    expect(svg?.getAttribute('class')).toContain('size-3');
  });
});
```

- [ ] **Step 2: Run it and watch the slot case fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/data-display/file-type-icon.spec.tsx`
Expected (RED, real output):

```
     × renders an svg marked as the file type icon 15ms
     ✓ passes its svg props through 2ms
AssertionError: expected null to be truthy
      Tests  1 failed | 1 passed (2)
```

- [ ] **Step 3: Rewrite the four roots**

`apps/registry-ui/registry/bases/base-ui/components/data-display/file-type-icon.tsx`:

```text
import type { LucideProps } from 'lucide-react';
import type { ReactNode } from 'react';

import { fileTypeIcon } from '@/registry/bases/base-ui/lib/file-type';

interface FileTypeIconProps extends LucideProps {
  /** File name or path; the icon is derived from its extension. */
  name: string;
}

/**
 * A lucide icon chosen for a file's type from its extension (`run.py` -> code,
 * `logo.png` -> image, `Inter.woff2` -> type, unknown -> a generic file).
 * Decorative: pair it with the visible file name, or pass `aria-label` when it
 * stands alone. Every `LucideProps` passes through.
 */
function FileTypeIcon({ name, ...props }: FileTypeIconProps): ReactNode {
  const Icon = fileTypeIcon(name);
  return <Icon data-slot="file-type-icon" {...props} />;
}

export { FileTypeIcon };
export type { FileTypeIconProps };
```

`apps/registry-ui/registry/bases/base-ui/components/data-display/markdown-view.tsx`:

```text
import { cva } from 'class-variance-authority';
import { memo, type ComponentProps, type ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { isPlainLanguage } from '@/registry/bases/base-ui/lib/code-language';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * Element styling for rendered Markdown, as descendant utilities on the tokens
 * so every colour follows dark mode. With `codeBlocks` off the recipe also styles
 * `<pre>` and `<code>`; with it on those rules would repaint `CodeBlock`'s own
 * `<pre>`, so they drop and inline code takes the same chip on its element.
 */
const markdownViewVariants = cva(
  [
    'text-sm leading-relaxed text-foreground',
    '[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1:not(:first-child)]:mt-6',
    '[&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2:not(:first-child)]:mt-6',
    '[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3:not(:first-child)]:mt-5',
    '[&_h4]:mb-1 [&_h4]:font-semibold [&_h4:not(:first-child)]:mt-4',
    '[&_p]:my-3',
    '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
    '[&_strong]:font-semibold',
    '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6',
    '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
    '[&_li]:my-1',
    '[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic',
    '[&_hr]:my-6 [&_hr]:border-border',
    '[&_img]:max-w-full [&_img]:rounded-md',
    '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left',
    '[&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:font-medium',
    '[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5',
  ],
  {
    variants: {
      codeBlocks: {
        false: [
          '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
          '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.85em]',
        ],
        true: '',
      },
    },
    defaultVariants: { codeBlocks: false },
  },
);

/**
 * Renderers for `codeBlocks` mode: fenced code becomes a `CodeBlock`, headed with
 * its language when the fence names one; inline code stays a chip. `pre` is
 * unwrapped because the `CodeBlock` root is a `<div>`, which must not nest in a
 * `<pre>`.
 */
const markdownViewCodeComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = String(children ?? '');
    const lang = /language-(\w+)/.exec(className ?? '')?.[1];
    const isBlock = !!lang || text.includes('\n');
    if (isBlock) {
      return (
        <CodeBlock code={text.replace(/\n$/, '')} language={lang ?? 'text'}>
          {isPlainLanguage(lang) ? undefined : (
            <CollapsibleCardHeader>
              <CollapsibleCardTitle>
                <CodeBlockLanguage />
              </CollapsibleCardTitle>
              <CollapsibleCardActions>
                <CodeBlockCopy />
                <CollapsibleCardTrigger />
              </CollapsibleCardActions>
            </CollapsibleCardHeader>
          )}
        </CodeBlock>
      );
    }
    return <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
  },
};

interface MarkdownViewProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Markdown source to render (GitHub-Flavored Markdown). */
  children: string;
  /**
   * Render fenced code as `CodeBlock` (copy, collapse, a scroll rail) instead of
   * a styled `<pre>`. Off by default; chat surfaces turn it on.
   */
  codeBlocks?: boolean;
}

/**
 * Renders a Markdown string (GFM: tables, task lists, strikethrough, autolinks)
 * styled to the design tokens. Raw embedded HTML is not rendered, so untrusted
 * content is safe.
 */
function MarkdownView({ children, className, codeBlocks = false, ...props }: MarkdownViewProps): ReactNode {
  return (
    <div data-slot="markdown-view" className={cn(markdownViewVariants({ codeBlocks }), className)} {...props}>
      <Markdown remarkPlugins={[remarkGfm]} components={codeBlocks ? markdownViewCodeComponents : undefined}>
        {children}
      </Markdown>
    </div>
  );
}

// A streaming chat list re-renders every message on each chunk; memo keeps a
// settled message from re-parsing. Its props are a string, a boolean and plain
// div attributes, so the shallow comparison holds.
const MemoizedMarkdownView = memo(MarkdownView);

export { MemoizedMarkdownView as MarkdownView };
export type { MarkdownViewProps };
```

`apps/registry-ui/registry/bases/base-ui/components/data-display/image-preview.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface ImagePreviewProps extends ComponentProps<'img'> {
  /** Image source: an asset URL, blob URL, or data URL. */
  src: string;
}

/**
 * Shows an image contained within its container, over a checkerboard so
 * transparent pixels read clearly. Fills the space it is given (the consumer
 * sizes the wrapper); `className` and other `img` props apply to the image. `alt`
 * defaults to empty (decorative).
 */
function ImagePreview({ src, alt = '', className, ...props }: ImagePreviewProps): ReactNode {
  return (
    <div
      data-slot="image-preview"
      className="flex size-full items-center justify-center overflow-hidden rounded-md bg-[image:repeating-conic-gradient(var(--muted)_0_25%,var(--background)_0_50%)] bg-size-[--spacing(4)_--spacing(4)]"
    >
      <img src={src} alt={alt} className={cn('max-h-full max-w-full object-contain', className)} {...props} />
    </div>
  );
}

export { ImagePreview };
export type { ImagePreviewProps };
```

`apps/registry-ui/registry/bases/base-ui/components/data-display/font-preview.tsx`:

```text
import { useId, type ComponentProps, type ReactNode } from 'react';

import { formatOf } from '@/registry/bases/base-ui/lib/font-format';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface FontPreviewProps extends ComponentProps<'div'> {
  /** Font file URL or data URL, loaded through an `@font-face` scoped to this instance. */
  src: string;
  /** CSS `format()` hint; derived from the `src` extension when omitted. */
  format?: string;
  /** Specimen sizes in px, largest first; `[36, 24, 18, 14]` when omitted. */
  sizes?: number[];
  /** Specimen text; a pangram when omitted. */
  children?: ReactNode;
}

/**
 * A specimen of a font file at several sizes, one row per size. The consumer
 * places and pads the wrapper.
 */
function FontPreview({
  src,
  format,
  sizes = [36, 24, 18, 14],
  className,
  children = 'The quick brown fox jumps over the lazy dog',
  ...props
}: FontPreviewProps): ReactNode {
  const id = useId();
  const family = `font-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fmt = format ?? formatOf(src);
  const css = `@font-face { font-family: '${family}'; src: url("${src}")${
    fmt ? ` format("${fmt}")` : ''
  }; font-display: swap; }`;

  return (
    <div data-slot="font-preview" className={cn('flex flex-col gap-4', className)} {...props}>
      <style>{css}</style>
      {sizes.map((size) => (
        <div key={size} className="flex items-baseline gap-3">
          <span className="text-muted-foreground w-10 shrink-0 text-xs tabular-nums">{size}</span>
          <span className="text-foreground truncate" style={{ fontFamily: family, fontSize: size, lineHeight: 1.3 }}>
            {children}
          </span>
        </div>
      ))}
    </div>
  );
}

export { FontPreview };
export type { FontPreviewProps };
```

The checkerboard is one `repeating-conic-gradient` of `--muted` and `--background` tiled at `--spacing(4)` square, which draws the same 8px squares the four `linear-gradient`s drew in a 16px tile. Compiled with the repo's Tailwind 4.3 (`@tailwindcss/node` `compile(...).build([...])`), the two classes emit:

```text
.bg-\[image\:repeating-conic-gradient\(...\)\] { background-image: repeating-conic-gradient(var(--muted) 0 25%,var(--background) 0 50%); }
.bg-size-\[--spacing\(4\)_--spacing\(4\)\] { background-size: calc(var(--spacing) * 4) calc(var(--spacing) * 4); }
```

- [ ] **Step 4: Run the specs, the suite, the type check, lint, format, the registry build and the spec's checks**

Run (from `apps/registry-ui`):

```bash
D=registry/bases/base-ui/components/data-display
F="$D/markdown-view.tsx $D/image-preview.tsx $D/font-preview.tsx $D/file-type-icon.tsx $D/file-type-icon.spec.tsx"
pnpm exec vitest run $D/file-type-icon.spec.tsx $D/markdown-view.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'error TS'
pnpm exec eslint $F
pnpm exec prettier --check $F
pnpm exec shadcn build >/dev/null && pnpm exec shadcn registry validate registry.json
cd registry/bases/base-ui
G="components/layout/collapsible-card.tsx components/data-display/code-block.tsx components/data-display/highlighted-code.tsx components/data-display/markdown-view.tsx components/data-display/image-preview.tsx components/data-display/font-preview.tsx components/data-display/file-type-icon.tsx"
grep -lnE '^export (function|const [A-Z])' $G
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $G
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $G
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $G
```

Expected: `Test Files  2 passed (2)`, `Tests  10 passed (10)`; `Test Files  74 passed (74)`, `Tests  392 passed (392)`; `1`; eslint exit 0 with only the `No cached ProjectGraph` warning; `All matched files use Prettier code style!`; `Checked 1 registry file and 22 items.`; the four greps print nothing (before this task the class-constant grep printed `PROSE`, `INLINE_CODE`, `PROSE_CODE` and `DEFAULT_SIZES`).

- [ ] **Step 5: Commit**

`$S/msg-code-3.txt`:

```
refactor(registry-ui): move markdown and file preview classes into recipes

Why: MarkdownView's prose classes, ImagePreview's checkerboard and
FontPreview's default sizes sat in module constants, where a caller's
className could not merge over them and the class-string check could
not tell them from a recipe. The prose is now a cva whose one variant
is codeBlocks, the checkerboard is classes on its element on the
spacing scale, and the sizes are the prop's default. FileTypeIcon
carries its data-slot like every other part.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
D=apps/registry-ui/registry/bases/base-ui/components/data-display
git add "$D/file-type-icon.spec.tsx"
git commit -q -F "$S/msg-code-3.txt" -- "$D/markdown-view.tsx" "$D/image-preview.tsx" "$D/font-preview.tsx" "$D/file-type-icon.tsx" "$D/file-type-icon.spec.tsx"
git log -1 --format='%h %s'
```

Expected: the hook's success line for 5 projects; the subject above.

---

## Small feedback atoms, CommandMenu and FileTree

Five tasks, one commit each, in this order. Each takes its family through every remaining rule at once: state
onto `data-*`, class maps gone, a return type on every component, the element's props spread after the part's own
handlers are composed, and a `data-slot` on every part. Every behaviour change is test-first.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`. Every
`Run` is from `apps/registry-ui`. `$S` is the plan's scratch directory.

The gate each task ends with, from `apps/registry-ui` (the `Expected` lines per task give the counts):

```sh
pnpm exec vitest run 2>&1 | grep -E 'Test Files|^ +Tests '
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep 'error TS'
pnpm exec eslint <the task's files>
pnpm exec prettier --check <the task's files>
pnpm exec shadcn build && pnpm exec shadcn registry validate registry.json
```

`tsc` prints exactly one line on every task, the baseline
`registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307`. `eslint` exits 0 and prints
only the `No cached ProjectGraph is available` warning it prints outside an nx run. `shadcn registry validate`
prints `Checked 1 registry file and 22 items.`

The spec's Checks, restricted to this group's files (from `apps/registry-ui/registry/bases/base-ui/`), print
nothing after every task:

```sh
MINE='status-indicator|unsaved-indicator|tab-close-button|copy-button|command-menu|file-tree'
grep -rlnE '^export (function|const [A-Z])' components --include='*.tsx' | grep -E "$MINE"
grep -rnE "^(export )?const [A-Z_]+ = ['\"\`\[]" components --include='*.tsx' | grep -E "$MINE"
grep -rnoE '[a-z-]+-\[[0-9.]+(px|rem)\]' components --include='*.tsx' | grep -E "$MINE"
grep -rnE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' \
  components --include='*.tsx' | grep -E "$MINE"
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' components/feedback/{status-indicator,unsaved-indicator,tab-close-button,copy-button}*.tsx components/navigation/command-menu*.tsx components/layout/file-tree*.tsx
```

---

### Task 5: StatusIndicator and UnsavedIndicator carry their state and role on the element

`StatusIndicator` drops its `TONE_CLASS` map: the tone goes onto `data-tone`, pulsing onto `data-pulse`, and the
recipe styles off both. `UnsavedIndicator` gains `role="img"`, so its `aria-label` is announced (a label on a
`span` with no role is not). The props (`tone`, `pulse`) and the exported `StatusTone` keep their names;
`data-display/ai-provider-card.tsx` still imports `StatusTone` from this file.

**Files:**

- Modify: `components/feedback/status-indicator.tsx` (rewritten), `components/feedback/status-indicator.spec.tsx` (rewritten)
- Modify: `components/feedback/unsaved-indicator.tsx` (rewritten), `components/feedback/unsaved-indicator.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the tree after Task 1 (b1).
- Produces: `StatusIndicator({ tone, pulse?, ...span })` rendering `span[data-slot=status-indicator][data-tone][data-pulse?]`;
  `type StatusIndicatorProps` (new export), `type StatusTone` (unchanged); `UnsavedIndicator(span props)` rendering
  `span[data-slot=unsaved-indicator][role=img]`, name `Unsaved changes` unless the caller passes `aria-label`.

- [ ] **Step 1: Write the failing specs**

`apps/registry-ui/registry/bases/base-ui/components/feedback/status-indicator.spec.tsx`:

```text
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatusIndicator } from './status-indicator';

afterEach(cleanup);

const dot = (container: HTMLElement): HTMLElement => container.firstChild as HTMLElement;

describe('StatusIndicator', () => {
  it('carries its tone on data-tone', () => {
    const { container } = render(<StatusIndicator tone="busy" />);
    expect(dot(container).dataset.tone).toBe('busy');
  });

  it('carries data-pulse only while pulsing', () => {
    const { container, rerender } = render(<StatusIndicator tone="idle" pulse />);
    expect(dot(container).hasAttribute('data-pulse')).toBe(true);
    rerender(<StatusIndicator tone="idle" />);
    expect(dot(container).hasAttribute('data-pulse')).toBe(false);
  });

  it('marks itself with its slot', () => {
    const { container } = render(<StatusIndicator tone="online" />);
    expect(dot(container).dataset.slot).toBe('status-indicator');
  });

  it('merges a passed className', () => {
    const { container } = render(<StatusIndicator tone="online" className="size-1.5" />);
    expect(dot(container).className).toContain('size-1.5');
  });
});
```

`apps/registry-ui/registry/bases/base-ui/components/feedback/unsaved-indicator.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UnsavedIndicator } from './unsaved-indicator';

afterEach(cleanup);

describe('UnsavedIndicator', () => {
  it('is an image named for the unsaved state', () => {
    render(<UnsavedIndicator />);
    expect(screen.getByRole('img', { name: 'Unsaved changes' })).toBeTruthy();
  });

  it('takes a caller label over its own', () => {
    render(<UnsavedIndicator aria-label="Modified" />);
    expect(screen.getByRole('img', { name: 'Modified' })).toBeTruthy();
  });

  it('merges a passed className', () => {
    render(<UnsavedIndicator className="size-3" />);
    expect(screen.getByRole('img', { name: 'Unsaved changes' }).className).toContain('size-3');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec vitest run registry/bases/base-ui/components/feedback/status-indicator.spec.tsx registry/bases/base-ui/components/feedback/unsaved-indicator.spec.tsx`
Expected (FAIL):

```
     × carries its tone on data-tone
     × carries data-pulse only while pulsing
     × is an image named for the unsaved state
     × takes a caller label over its own
     × merges a passed className
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/status-indicator.spec.tsx > StatusIndicator > carries its tone on data-tone
AssertionError: expected undefined to be 'busy' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/status-indicator.spec.tsx > StatusIndicator > carries data-pulse only while pulsing
AssertionError: expected false to be true // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/unsaved-indicator.spec.tsx > UnsavedIndicator > is an image named for the unsaved state
TestingLibraryElementError: Unable to find an accessible element with the role "img" and name "Unsaved changes"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/unsaved-indicator.spec.tsx > UnsavedIndicator > takes a caller label over its own
TestingLibraryElementError: Unable to find an accessible element with the role "img" and name "Modified"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/unsaved-indicator.spec.tsx > UnsavedIndicator > merges a passed className
TestingLibraryElementError: Unable to find an accessible element with the role "img" and name "Unsaved changes"
 Test Files  2 failed (2)
      Tests  5 failed | 2 passed (7)
```

- [ ] **Step 3: Rewrite the two components**

`apps/registry-ui/registry/bases/base-ui/components/feedback/status-indicator.tsx`:

```text
import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

type StatusTone = 'online' | 'offline' | 'busy' | 'idle';

interface StatusIndicatorProps extends React.ComponentProps<'span'> {
  /**
   * online: connected, enabled, active. offline: disconnected, disabled.
   * busy: an error, unavailable. idle: pending, away.
   */
  tone: StatusTone;
  /** Animate the dot, for a state still in progress such as connecting or live. */
  pulse?: boolean;
}

/**
 * A small presence dot coloured by a semantic tone, so every surface reads a
 * status the same way. Decorative: the text beside it carries the status for
 * assistive technology. Not for an identity colour, and not for a modified
 * flag, which is `UnsavedIndicator`.
 */
function StatusIndicator({ tone, pulse = false, className, ...props }: StatusIndicatorProps): React.ReactNode {
  return (
    <span
      data-slot="status-indicator"
      data-tone={tone}
      data-pulse={pulse ? '' : undefined}
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full data-pulse:animate-pulse',
        'data-[tone=busy]:bg-destructive data-[tone=idle]:bg-warning data-[tone=offline]:bg-muted-foreground/30 data-[tone=online]:bg-success',
        className,
      )}
      {...props}
    />
  );
}

export { StatusIndicator };
export type { StatusIndicatorProps, StatusTone };
```

`apps/registry-ui/registry/bases/base-ui/components/feedback/unsaved-indicator.tsx`:

```text
import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The unsaved-changes dot an editor shows on a tab. It is announced as an image
 * named "Unsaved changes"; pass `aria-label` to name it in another language.
 */
function UnsavedIndicator({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="unsaved-indicator"
      role="img"
      aria-label="Unsaved changes"
      className={cn('bg-foreground/70 size-2 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

export { UnsavedIndicator };
```

- [ ] **Step 4: Run the specs to see them pass**

Run: the Step 2 command.
Expected: `Test Files  2 passed (2)`, `Tests  7 passed (7)`.

- [ ] **Step 5: Run the gate and the checks**

Run: the gate and the checks above, with `registry/bases/base-ui/components/feedback/{status-indicator,unsaved-indicator}{,.spec}.tsx` as the task's files.
Expected: vitest `Test Files  72 passed (72)`, `Tests  379 passed (379)` (5 cases became 4 in one spec, 2 became 3 in the other); tsc the one baseline line; eslint exit 0; prettier `All matched files use Prettier code style!`; `Checked 1 registry file and 22 items.`; the checks print nothing.
`registry.json` is unchanged: `status-dot` still imports only `lib/utils`.

- [ ] **Step 6: Commit**

`$S/msg-small-1.txt`:

```
refactor(registry-ui): put the status dot's tone and pulse on data attributes

Why: the tone was read through a class map no selector or spec can see;
data-tone and data-pulse let a recipe and a spec both read the state, and
the unsaved dot needed a role for its label to be announced at all.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

```sh
git commit -F "$S/msg-small-1.txt" -- \
  apps/registry-ui/registry/bases/base-ui/components/feedback/status-indicator.tsx \
  apps/registry-ui/registry/bases/base-ui/components/feedback/status-indicator.spec.tsx \
  apps/registry-ui/registry/bases/base-ui/components/feedback/unsaved-indicator.tsx \
  apps/registry-ui/registry/bases/base-ui/components/feedback/unsaved-indicator.spec.tsx
```

---

### Task 6: TabCloseButton reveals its X from the tab's hover instead of a prop

`revealClose` goes. The button carries `data-dirty`; a dirty button renders the unsaved dot and the X together, and
CSS picks one: the X shows while the nearest `group/tab` ancestor is hovered or carries `data-active` (the
attribute upstream's own `TabsTrigger` sets on the active tab), or while the button has keyboard focus. `onClose`
becomes the `Button`'s own `onClick`, composed after the `stopPropagation` that keeps the click off the tab. No
file outside the family renders `TabCloseButton` (`grep -rn TabCloseButton registry src` lists only the family's two
files), so no call site changes.

**Files:**

- Modify: `components/feedback/tab-close-button.tsx` (rewritten), `components/feedback/tab-close-button.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: `UnsavedIndicator` as Task 5 left it.
- Produces: `TabCloseButton({ dirty?, onClick?, ...Button props except children })` rendering
  `button[data-slot=tab-close-button][data-dirty?].group/tab-close-button`; `type TabCloseButtonProps`
  (now extends the `Button` props). Removed: `revealClose`, `onClose`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/feedback/tab-close-button.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabCloseButton } from './tab-close-button';

afterEach(cleanup);

describe('TabCloseButton', () => {
  it('marks a dirty tab with data-dirty and renders the unsaved dot beside the X', () => {
    render(<TabCloseButton dirty />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.hasAttribute('data-dirty')).toBe(true);
    expect(button.querySelector('[data-slot="unsaved-indicator"]')).toBeTruthy();
    expect(button.querySelector('.lucide-x')).toBeTruthy();
  });

  it('renders only the X for a clean tab', () => {
    render(<TabCloseButton />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.hasAttribute('data-dirty')).toBe(false);
    expect(button.querySelector('[data-slot="unsaved-indicator"]')).toBeNull();
    expect(button.querySelector('.lucide-x')).toBeTruthy();
  });

  it('marks itself with its slot', () => {
    render(<TabCloseButton />);
    expect(screen.getByRole('button', { name: 'Close' }).dataset.slot).toBe('tab-close-button');
  });

  it('calls onClick and stops propagation so the tab is not also activated', () => {
    const onClick = vi.fn();
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <TabCloseButton onClick={onClick} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run registry/bases/base-ui/components/feedback/tab-close-button.spec.tsx`
Expected (FAIL; the unhandled `TypeError` is the old component calling the `onClose` the spec no longer passes):

```
     × marks a dirty tab with data-dirty and renders the unsaved dot beside the X
     × marks itself with its slot
     × calls onClick and stops propagation so the tab is not also activated
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/tab-close-button.spec.tsx > TabCloseButton > marks a dirty tab with data-dirty and renders the unsaved dot beside the X
AssertionError: expected false to be true // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/tab-close-button.spec.tsx > TabCloseButton > marks itself with its slot
AssertionError: expected 'button' to be 'tab-close-button' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/tab-close-button.spec.tsx > TabCloseButton > calls onClick and stops propagation so the tab is not also activated
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
TypeError: onClose is not a function
 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)
     Errors  1 error
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/feedback/tab-close-button.tsx`:

```text
import * as React from 'react';
import { X } from 'lucide-react';

import { UnsavedIndicator } from '@/registry/bases/base-ui/components/feedback/unsaved-indicator';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';

interface TabCloseButtonProps extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  /** Show the unsaved dot in place of the X until the tab reveals it. */
  dirty?: boolean;
}

/**
 * The trailing control on an editor tab. A dirty tab shows the unsaved dot, and
 * the X takes its place while the nearest `group/tab` ancestor is hovered or
 * carries `data-active`, or while the button has keyboard focus; give the tab
 * `className="group/tab"`. A click never reaches the tab, so closing a tab does
 * not also activate it.
 */
function TabCloseButton({ dirty = false, className, onClick, ...props }: TabCloseButtonProps): React.ReactNode {
  return (
    <Button
      data-slot="tab-close-button"
      data-dirty={dirty ? '' : undefined}
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Close"
      className={cn('group/tab-close-button', className)}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      {...props}
    >
      {dirty && (
        <UnsavedIndicator className="group-hover/tab:hidden group-focus-visible/tab-close-button:hidden group-data-active/tab:hidden" />
      )}
      <X className="group-data-dirty/tab-close-button:hidden group-data-dirty/tab-close-button:group-hover/tab:block group-data-dirty/tab-close-button:group-focus-visible/tab-close-button:block group-data-dirty/tab-close-button:group-data-active/tab:block" />
    </Button>
  );
}

export { TabCloseButton };
export type { TabCloseButtonProps };
```

The stacked variants compile to selectors one step more specific than `group-data-dirty/tab-close-button:hidden`,
so they win whatever order Tailwind emits them in; compiled with tailwindcss 4.3.3,
`group-data-dirty/tab-close-button:group-hover/tab:block` is
`:is(:where(.group\/tab-close-button)[data-dirty] *):is(:where(.group\/tab):hover *)` inside `@media (hover: hover)`.

- [ ] **Step 4: Run the spec to see it pass**

Run: the Step 2 command.
Expected: `Test Files  1 passed (1)`, `Tests  4 passed (4)`.

- [ ] **Step 5: Run the gate and the checks**

Run: the gate and the checks above, with `registry/bases/base-ui/components/feedback/tab-close-button{,.spec}.tsx` as the task's files.
Expected: vitest `Test Files  72 passed (72)`, `Tests  380 passed (380)`; tsc the one baseline line; eslint exit 0; prettier clean; `Checked 1 registry file and 22 items.`; the checks print nothing. `registry.json` is unchanged: `TabCloseButton` is in no item.

- [ ] **Step 6: Commit**

`$S/msg-small-2.txt`:

```
refactor(registry-ui): reveal the tab close button from the tab's hover

Why: revealClose made every tab compute a hover state the stylesheet
already has; the tab now marks itself group/tab and the button reads its
hover and data-active, with data-dirty on the button for the dot.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

```sh
git commit -F "$S/msg-small-2.txt" -- \
  apps/registry-ui/registry/bases/base-ui/components/feedback/tab-close-button.tsx \
  apps/registry-ui/registry/bases/base-ui/components/feedback/tab-close-button.spec.tsx
```

---

### Task 7: CopyButton carries data-copied and composes a caller onClick

The copied state goes onto `data-copied`. `onClick` stops being omitted from the props: a caller's handler runs
first, and one that calls `preventDefault()` skips the copy. Before this task a caller's `onClick` reached the
`Button` through the spread and replaced the copy handler outright. `value`, `label`, `copiedLabel`, `timeout` and
`onCopied` keep their names; the five call sites (`data-display/code-block.tsx` twice,
`editor/document/features/{code-block/code-block,math/math,mermaid/mermaid}.tsx`) pass none of what changed and
are not edited.

**Files:**

- Modify: `components/feedback/copy-button.tsx` (rewritten), `components/feedback/copy-button.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: nothing new.
- Produces: `CopyButton({ value, label?, copiedLabel?, timeout?, onCopied?, onClick?, ...Button props except children })`
  rendering `button[data-slot=copy-button][data-copied?]`; `type CopyButtonProps` (now admits `onClick`).

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/feedback/copy-button.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyButton } from './copy-button';

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

afterEach(cleanup);

describe('CopyButton', () => {
  it('renders with the default accessible name', () => {
    render(<CopyButton value="hello" />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('honors a custom label and passes className through', () => {
    render(<CopyButton value="x" label="Copy source" className="size-6" />);
    expect(screen.getByRole('button', { name: 'Copy source' }).className).toContain('size-6');
  });

  it('marks itself with its slot', () => {
    render(<CopyButton value="x" />);
    expect(screen.getByRole('button', { name: 'Copy' }).dataset.slot).toBe('copy-button');
  });

  it('copies the value, flips to the copied name and carries data-copied', async () => {
    render(<CopyButton value="payload" copiedLabel="Copied!" />);
    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button.hasAttribute('data-copied')).toBe(false);

    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledWith('payload');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBe(button);
    expect(button.hasAttribute('data-copied')).toBe(true);
  });

  it('calls a caller onClick and still copies', () => {
    const onClick = vi.fn();
    render(<CopyButton value="payload" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('payload');
  });

  it('skips the copy when a caller onClick prevents the default', () => {
    render(<CopyButton value="payload" onClick={(event) => event.preventDefault()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).not.toHaveBeenCalled();
  });
});
```

The last case passes before the fix too, because the old component let the caller's `onClick` replace the copy;
it pins the escape hatch the fix adds.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run registry/bases/base-ui/components/feedback/copy-button.spec.tsx`
Expected (FAIL):

```
     × marks itself with its slot
     × copies the value, flips to the copied name and carries data-copied
     × calls a caller onClick and still copies
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/copy-button.spec.tsx > CopyButton > marks itself with its slot
AssertionError: expected 'button' to be 'copy-button' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/copy-button.spec.tsx > CopyButton > copies the value, flips to the copied name and carries data-copied
AssertionError: expected false to be true // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/feedback/copy-button.spec.tsx > CopyButton > calls a caller onClick and still copies
AssertionError: expected "vi.fn()" to be called with arguments: [ 'payload' ]
 Test Files  1 failed (1)
      Tests  3 failed | 3 passed (6)
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/feedback/copy-button.tsx`:

```text
'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/registry/bases/base-ui/ui/button';

const COPY_RESET_MS = 2000;

interface CopyButtonProps extends Omit<React.ComponentProps<typeof Button>, 'value' | 'children'> {
  /** Text written to the clipboard on click. */
  value: string;
  /** Accessible name in the idle state. */
  label?: string;
  /** Accessible name shown briefly after a successful copy. */
  copiedLabel?: string;
  /** How long the copied state persists, in ms. */
  timeout?: number;
  /** Called with the value after a successful copy. */
  onCopied?: (value: string) => void;
}

/**
 * A copy-to-clipboard icon button. After a successful copy it shows a check,
 * takes `copiedLabel` as its accessible name and carries `data-copied` for
 * `timeout` ms, then resets. A caller `onClick` runs first, and calling
 * `event.preventDefault()` in it skips the copy. Defaults to a `ghost`
 * `icon-xs` `Button`, and every `Button` prop passes through. A write the
 * browser refuses, such as a denied clipboard permission, leaves the button
 * idle.
 */
function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  timeout = COPY_RESET_MS,
  onCopied,
  onClick,
  variant = 'ghost',
  size = 'icon-xs',
  ...props
}: CopyButtonProps): React.ReactNode {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = React.useCallback(() => {
    if (!navigator?.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
        onCopied?.(value);
      })
      .catch(() => {});
  }, [value, timeout, onCopied]);

  return (
    <Button
      data-slot="copy-button"
      data-copied={copied ? '' : undefined}
      type="button"
      variant={variant}
      size={size}
      aria-label={copied ? copiedLabel : label}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) copy();
      }}
      {...props}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

export { CopyButton };
export type { CopyButtonProps };
```

- [ ] **Step 4: Run the spec to see it pass**

Run: the Step 2 command.
Expected: `Test Files  1 passed (1)`, `Tests  6 passed (6)`.

- [ ] **Step 5: Run the gate and the checks**

Run: the gate and the checks above, with `registry/bases/base-ui/components/feedback/copy-button{,.spec}.tsx` as the task's files.
Expected: vitest `Test Files  72 passed (72)`, `Tests  383 passed (383)`; tsc the one baseline line; eslint exit 0; prettier clean; `Checked 1 registry file and 22 items.`; the checks print nothing. `registry.json` is unchanged: `CopyButton` is in no item.

- [ ] **Step 6: Commit**

`$S/msg-small-3.txt`:

```
refactor(registry-ui): mark the copied state on the copy button

Why: the copied state lived only in the icon swap, so nothing could style
off it; and a caller onClick replaced the copy handler instead of running
beside it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

```sh
git commit -F "$S/msg-small-3.txt" -- \
  apps/registry-ui/registry/bases/base-ui/components/feedback/copy-button.tsx \
  apps/registry-ui/registry/bases/base-ui/components/feedback/copy-button.spec.tsx
```

---

### Task 8: CommandMenu composes an item's onSelect and marks its parts

The composition stays upstream's own (`CommandDialog` holding a `Command`, as the base `command-example` composes
it). `CommandMenuItem` stops omitting `onSelect`: the caller's runs, then the menu reports the value and closes.
Before this task a caller's `onSelect` reached `CommandItem` through the spread and replaced the menu's. The
`Command` inside the dialog carries `data-slot="command-menu"`, the item `data-slot="command-menu-item"`; no
upstream selector reads `data-slot=command` or `data-slot=command-item` (`grep -rno 'slot=command[^]]*\]' ui`
lists only `command-shortcut`). The redundant `open` and `children` redeclarations go, since `CommandDialog`
already declares both.

**Files:**

- Modify: `components/navigation/command-menu.tsx` (rewritten), `components/navigation/command-menu.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: nothing new.
- Produces: `CommandMenu({ onOpenChange?(open), onValueChange?(value), ...CommandDialog props })`,
  `CommandMenuItem({ value, onSelect?, ...CommandItem props })`; `type CommandMenuProps`, `type CommandMenuItemProps`
  (now admits `onSelect`).

- [ ] **Step 1: Write the failing spec**

The two `useCommandShortcut` cases are kept as they were; the placeholder's ellipsis becomes `...`.

`apps/registry-ui/registry/bases/base-ui/components/navigation/command-menu.spec.tsx`:

```text
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CommandMenu, CommandMenuItem } from './command-menu';
import { CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';
import { useCommandShortcut } from '../../hooks/use-command-shortcut';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // Base UI's dialog positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
});

describe('CommandMenu', () => {
  it('reports the chosen value and closes on select', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandMenu open onOpenChange={onOpenChange} onValueChange={onValueChange}>
        <CommandInput placeholder="Jump to file..." />
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
          <CommandMenuItem value="scripts/run.py">run.py</CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    fireEvent.click(screen.getByText('run.py'));
    expect(onValueChange).toHaveBeenCalledWith('scripts/run.py');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('runs an item onSelect as well as reporting the value', () => {
    const onValueChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <CommandMenu open onValueChange={onValueChange}>
        <CommandList>
          <CommandMenuItem value="SKILL.md" onSelect={onSelect}>
            SKILL.md
          </CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    fireEvent.click(screen.getByText('SKILL.md'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('SKILL.md');
  });

  it('marks the palette and its items with their slots', () => {
    render(
      <CommandMenu open>
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    expect(document.querySelector('[data-slot="command-menu"]')).toBeTruthy();
    expect(screen.getByText('SKILL.md').closest('[data-slot="command-menu-item"]')).toBeTruthy();
  });
});

describe('useCommandShortcut', () => {
  it('fires on the mod+key chord, not on the bare key', () => {
    const onTrigger = vi.fn();
    renderHook(() => useCommandShortcut({ key: 'k', onTrigger }));

    fireEvent.keyDown(document.body, { key: 'k' });
    expect(onTrigger).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('stops firing once disabled', () => {
    const onTrigger = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useCommandShortcut({ key: 'k', onTrigger, enabled }), {
      initialProps: { enabled: true },
    });

    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run registry/bases/base-ui/components/navigation/command-menu.spec.tsx`
Expected (FAIL):

```
     × runs an item onSelect as well as reporting the value
     × marks the palette and its items with their slots
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/navigation/command-menu.spec.tsx > CommandMenu > runs an item onSelect as well as reporting the value
AssertionError: expected "vi.fn()" to be called with arguments: [ 'SKILL.md' ]
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/navigation/command-menu.spec.tsx > CommandMenu > marks the palette and its items with their slots
AssertionError: expected null to be truthy
 Test Files  1 failed (1)
      Tests  2 failed | 3 passed (5)
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/navigation/command-menu.tsx`:

```text
import * as React from 'react';

import { Command, CommandDialog, CommandItem } from '@/registry/bases/base-ui/ui/command';

interface CommandMenuContextValue {
  select: (value: string) => void;
}

const CommandMenuContext = React.createContext<CommandMenuContextValue | null>(null);

function useCommandMenu(): CommandMenuContextValue {
  const ctx = React.useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error('CommandMenu parts must be used within <CommandMenu>');
  }
  return ctx;
}

interface CommandMenuProps extends Omit<React.ComponentProps<typeof CommandDialog>, 'onOpenChange'> {
  /**
   * Fired when the dialog asks to open or close, and with `false` after an item
   * is chosen. Choosing an item has no dialog event to hand over, so the
   * callback takes the open state alone.
   */
  onOpenChange?: (open: boolean) => void;
  /** Fired with the chosen item's value, before the dialog closes. */
  onValueChange?: (value: string) => void;
}

/**
 * A command palette for jumping to a target: a controlled `CommandDialog`
 * holding a `Command`. Choosing a `CommandMenuItem` reports its value through
 * `onValueChange` and closes the dialog. The consumer composes `CommandInput`,
 * `CommandList`, `CommandEmpty` and the items as children and owns all copy;
 * `useCommandShortcut` binds the key that opens it.
 */
function CommandMenu({ onOpenChange, onValueChange, children, ...props }: CommandMenuProps): React.ReactNode {
  const ctx: CommandMenuContextValue = {
    select: (value) => {
      onValueChange?.(value);
      onOpenChange?.(false);
    },
  };
  return (
    <CommandMenuContext.Provider value={ctx}>
      <CommandDialog onOpenChange={onOpenChange} {...props}>
        <Command data-slot="command-menu">{children}</Command>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}

interface CommandMenuItemProps extends Omit<React.ComponentProps<typeof CommandItem>, 'value'> {
  /** Reported through the menu's `onValueChange` when chosen. */
  value: string;
}

/** An item in a `CommandMenu`; choosing it runs `onSelect`, then reports `value` and closes the menu. */
function CommandMenuItem({ value, onSelect, ...props }: CommandMenuItemProps): React.ReactNode {
  const { select } = useCommandMenu();
  return (
    <CommandItem
      data-slot="command-menu-item"
      value={value}
      onSelect={(itemValue) => {
        onSelect?.(itemValue);
        select(value);
      }}
      {...props}
    />
  );
}

export { CommandMenu, CommandMenuItem };
export type { CommandMenuProps, CommandMenuItemProps };
```

- [ ] **Step 4: Run the spec to see it pass**

Run: the Step 2 command.
Expected: `Test Files  1 passed (1)`, `Tests  5 passed (5)`.

- [ ] **Step 5: Run the gate and the checks**

Run: the gate and the checks above, with `registry/bases/base-ui/components/navigation/command-menu{,.spec}.tsx` as the task's files.
Expected: vitest `Test Files  72 passed (72)`, `Tests  385 passed (385)`; tsc the one baseline line; eslint exit 0; prettier clean; `Checked 1 registry file and 22 items.`; the checks print nothing. `registry.json` is unchanged: `CommandMenu` is in no item.

- [ ] **Step 6: Commit**

`$S/msg-small-4.txt`:

```
refactor(registry-ui): compose a command menu item's own onSelect

Why: a caller onSelect replaced the one that reports the value and closes
the menu, and neither part carried a slot a selector or a spec could read.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

```sh
git commit -F "$S/msg-small-4.txt" -- \
  apps/registry-ui/registry/bases/base-ui/components/navigation/command-menu.tsx \
  apps/registry-ui/registry/bases/base-ui/components/navigation/command-menu.spec.tsx
```

---

### Task 9: FileTree keeps a caller's ref and style

FileTree is otherwise unchanged. Two props were overwritten rather than composed: the root set `ref={treeRef}` after
the spread, so a caller's `ref` never received the tree, and `FileTreeLabel` set `style` before the spread, so a
caller's `style` dropped the depth indent. The root now merges the two refs and the label spreads the caller's style
over its indent. The indent moves from `px` onto the spacing scale (`12px` per level plus `6px` is
`calc(var(--spacing) * (3 * (level - 1) + 1.5))`, the same length at the default `--spacing`). Every component gains
its return type, and the root carries the two deviations the spec keeps, at its declaration.

**Files:**

- Modify: `components/layout/file-tree.tsx` (four signatures, the ref merge, the label's style, one comment), `components/layout/file-tree.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: nothing new.
- Produces: the same four parts and four prop types; `FileTree`'s `ref` now reaches the `ul[role=tree]`.

- [ ] **Step 1: Write the failing spec**

The existing cases are unchanged but for the `describe` names, whose em dash becomes `-`; the `react` import and the `composition` describe are new.

`apps/registry-ui/registry/bases/base-ui/components/layout/file-tree.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileTree, FileTreeGroup, FileTreeItem, FileTreeLabel, type FileTreeProps } from './file-tree';

afterEach(() => {
  cleanup();
});

/**
 * SKILL.md
 * src/            (folder)
 *   index.ts
 *   util.ts
 * README.md
 */
function renderTree(props?: FileTreeProps) {
  return render(
    <FileTree aria-label="Files" {...props}>
      <FileTreeItem value="SKILL.md">
        <FileTreeLabel>SKILL.md</FileTreeLabel>
      </FileTreeItem>
      <FileTreeItem value="src">
        <FileTreeLabel>src</FileTreeLabel>
        <FileTreeGroup>
          <FileTreeItem value="src/index.ts">
            <FileTreeLabel>index.ts</FileTreeLabel>
          </FileTreeItem>
          <FileTreeItem value="src/util.ts">
            <FileTreeLabel>util.ts</FileTreeLabel>
          </FileTreeItem>
        </FileTreeGroup>
      </FileTreeItem>
      <FileTreeItem value="README.md">
        <FileTreeLabel>README.md</FileTreeLabel>
      </FileTreeItem>
    </FileTree>,
  );
}

const item = (name: string) => screen.getByRole('treeitem', { name });

describe('FileTree - structure & ARIA', () => {
  it('exposes the tree/treeitem/group roles with correct levels and folder state', () => {
    renderTree({ defaultExpanded: ['src'] });

    expect(screen.getByRole('tree', { name: 'Files' })).toBeTruthy();
    expect(item('SKILL.md').getAttribute('aria-level')).toBe('1');
    expect(item('index.ts').getAttribute('aria-level')).toBe('2');

    // Only the folder is expandable.
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(item('SKILL.md').hasAttribute('aria-expanded')).toBe(false);
    expect(screen.getByRole('group')).toBeTruthy();
  });

  it('collapsed folders do not render their children', () => {
    renderTree();
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).toBeNull();
  });

  it('keeps exactly one item tabbable (roving tabindex)', () => {
    renderTree();
    const items = screen.getAllByRole('treeitem');
    expect(items[0].tabIndex).toBe(0);
    expect(items.slice(1).every((el) => el.tabIndex === -1)).toBe(true);
  });
});

describe('FileTree - selection', () => {
  it('selects a leaf on click and reports it (uncontrolled)', () => {
    const onValueChange = vi.fn();
    renderTree({ onValueChange });

    fireEvent.click(screen.getByText('README.md'));
    expect(onValueChange).toHaveBeenCalledWith('README.md');
    expect(screen.getByRole('treeitem', { name: 'README.md', selected: true })).toBeTruthy();
  });

  it('reflects a controlled value without owning it', () => {
    const onValueChange = vi.fn();
    renderTree({ value: 'SKILL.md', onValueChange });

    expect(screen.getByRole('treeitem', { name: 'SKILL.md', selected: true })).toBeTruthy();
    fireEvent.click(screen.getByText('README.md'));
    // Controlled: parent decides; selection stays on SKILL.md until value changes.
    expect(onValueChange).toHaveBeenCalledWith('README.md');
    expect(screen.getByRole('treeitem', { name: 'SKILL.md', selected: true })).toBeTruthy();
  });
});

describe('FileTree - folder expansion', () => {
  it('toggles a folder on click and reports the expanded set', () => {
    const onExpandedChange = vi.fn();
    renderTree({ onExpandedChange });

    fireEvent.click(screen.getByText('src'));
    expect(onExpandedChange).toHaveBeenCalledWith(['src']);
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toBeTruthy();
  });
});

describe('FileTree - keyboard (WAI-ARIA APG)', () => {
  it('moves focus with ArrowDown / ArrowUp / Home / End', () => {
    renderTree({ defaultExpanded: ['src'] });
    const first = item('SKILL.md');
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item('src'));

    fireEvent.keyDown(item('src'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(item('SKILL.md'));

    fireEvent.keyDown(item('SKILL.md'), { key: 'End' });
    expect(document.activeElement).toBe(item('README.md'));

    fireEvent.keyDown(item('README.md'), { key: 'Home' });
    expect(document.activeElement).toBe(item('SKILL.md'));
  });

  it('ArrowRight expands a collapsed folder, then moves into the first child', () => {
    renderTree();
    const src = item('src');
    src.focus();

    fireEvent.keyDown(src, { key: 'ArrowRight' });
    expect(item('src').getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(item('src'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item('index.ts'));
  });

  it('ArrowLeft collapses an open folder, and from a child focuses the parent', () => {
    renderTree({ defaultExpanded: ['src'] });

    const child = item('index.ts');
    child.focus();
    fireEvent.keyDown(child, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(item('src'));

    fireEvent.keyDown(item('src'), { key: 'ArrowLeft' });
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
  });

  it('Enter and Space select the focused item', () => {
    const onValueChange = vi.fn();
    renderTree({ onValueChange });

    const readme = item('README.md');
    readme.focus();
    fireEvent.keyDown(readme, { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith('README.md');

    const skill = item('SKILL.md');
    skill.focus();
    fireEvent.keyDown(skill, { key: ' ' });
    expect(onValueChange).toHaveBeenLastCalledWith('SKILL.md');
  });
});

describe('FileTree - composition', () => {
  it('hands a caller ref the tree element and keeps its own keyboard handling', () => {
    const ref = React.createRef<HTMLUListElement>();
    render(
      <FileTree aria-label="Files" ref={ref}>
        <FileTreeItem value="SKILL.md">
          <FileTreeLabel>SKILL.md</FileTreeLabel>
        </FileTreeItem>
        <FileTreeItem value="README.md">
          <FileTreeLabel>README.md</FileTreeLabel>
        </FileTreeItem>
      </FileTree>,
    );

    expect(ref.current).toBe(screen.getByRole('tree', { name: 'Files' }));
    item('SKILL.md').focus();
    fireEvent.keyDown(item('SKILL.md'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item('README.md'));
  });

  it('keeps the depth indent under a caller style', () => {
    render(
      <FileTree aria-label="Files" defaultExpanded={['src']}>
        <FileTreeItem value="src">
          <FileTreeLabel>src</FileTreeLabel>
          <FileTreeGroup>
            <FileTreeItem value="src/index.ts">
              <FileTreeLabel style={{ opacity: 0.5 }}>index.ts</FileTreeLabel>
            </FileTreeItem>
          </FileTreeGroup>
        </FileTreeItem>
      </FileTree>,
    );

    const label = screen.getByText('index.ts');
    expect(label.style.opacity).toBe('0.5');
    expect(label.style.paddingInlineStart).toBe('calc(var(--spacing) * 4.5)');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run registry/bases/base-ui/components/layout/file-tree.spec.tsx`
Expected (FAIL):

```
     × hands a caller ref the tree element and keeps its own keyboard handling
     × keeps the depth indent under a caller style
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/file-tree.spec.tsx > FileTree - composition > hands a caller ref the tree element and keeps its own keyboard handling
AssertionError: expected null to be <ul role="tree" …(3)>…(2)</ul> // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/file-tree.spec.tsx > FileTree - composition > keeps the depth indent under a caller style
AssertionError: expected '' to be 'calc(var(--spacing) * 4.5)' // Object.is equality
 Test Files  1 failed (1)
      Tests  2 failed | 10 passed (12)
```

- [ ] **Step 3: Edit the component**

Edit 1 in `components/layout/file-tree.tsx`, replace:

```text
function FileTree({
  value,
  defaultValue,
  onValueChange,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  className,
  children,
  onKeyDown,
  ...props
}: FileTreeProps) {
```

with:

```text
function FileTree({
  value,
  defaultValue,
  onValueChange,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  className,
  children,
  onKeyDown,
  ref,
  ...props
}: FileTreeProps): React.ReactNode {
```

Edit 2 in `components/layout/file-tree.tsx`, replace:

```text
  const treeRef = React.useRef<HTMLUListElement>(null);

```

with:

```text
  const treeRef = React.useRef<HTMLUListElement>(null);
  const setTreeRef = React.useCallback(
    (node: HTMLUListElement | null) => {
      treeRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

```

Edit 3 in `components/layout/file-tree.tsx`, replace:

```text
          {...props}
          ref={treeRef}
        >
```

with:

```text
          {...props}
          ref={setTreeRef}
        >
```

Edit 4 in `components/layout/file-tree.tsx`, replace:

```text
function FileTreeItem({ value, className, children, onFocus, ...props }: FileTreeItemProps) {
```

with:

```text
function FileTreeItem({ value, className, children, onFocus, ...props }: FileTreeItemProps): React.ReactNode {
```

Edit 5 in `components/layout/file-tree.tsx`, replace:

```text
function FileTreeLabel({ className, children, onClick, ...props }: FileTreeLabelProps) {
```

with:

```text
function FileTreeLabel({ className, children, onClick, style, ...props }: FileTreeLabelProps): React.ReactNode {
```

Edit 6 in `components/layout/file-tree.tsx`, replace:

```text
      style={{ paddingInlineStart: `${(item.level - 1) * 12 + 6}px` }}
```

with:

```text
      style={{ paddingInlineStart: `calc(var(--spacing) * ${(item.level - 1) * 3 + 1.5})`, ...style }}
```

Edit 7 in `components/layout/file-tree.tsx`, replace:

```text
function FileTreeGroup({ className, children, ...props }: FileTreeGroupProps) {
```

with:

```text
function FileTreeGroup({ className, children, ...props }: FileTreeGroupProps): React.ReactNode {
```

Then the comment at the root (a separate edit list on the same file):

Edit 1 in `components/layout/file-tree.tsx`, replace:

```text
/**
 * An accessible **file tree** (WAI-ARIA APG Tree View) for navigating a file
```

with:

```text
// `Tree` is not a shape the design system publishes; nothing upstream names a
// hierarchy, so the root keeps the name of what it draws. `TreeItem`
// (data-entry/tree-item) draws a similar row and is kept a separate tree until
// a change shows the two move together.
/**
 * An accessible **file tree** (WAI-ARIA APG Tree View) for navigating a file
```

- [ ] **Step 4: Run the spec to see it pass**

Run: the Step 2 command.
Expected: `Test Files  1 passed (1)`, `Tests  12 passed (12)`.

- [ ] **Step 5: Run the gate and the checks**

Run: the gate and the checks above, with `registry/bases/base-ui/components/layout/file-tree{,.spec}.tsx` as the task's files.
Expected: vitest `Test Files  72 passed (72)`, `Tests  387 passed (387)`; tsc the one baseline line; eslint exit 0; prettier clean; `Checked 1 registry file and 22 items.`; the checks print nothing. `registry.json` is unchanged: `FileTree` is in no item.

- [ ] **Step 6: Commit**

`$S/msg-small-5.txt`:

```
fix(registry-ui): keep a caller's ref and style on the file tree

Why: the root's own ref replaced a caller's, and the label's indent was
dropped by any style a caller passed; the indent now follows the spacing
scale instead of fixed pixels.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

```sh
git commit -F "$S/msg-small-5.txt" -- \
  apps/registry-ui/registry/bases/base-ui/components/layout/file-tree.tsx \
  apps/registry-ui/registry/bases/base-ui/components/layout/file-tree.spec.tsx
```

---

## Cards and the data table

### Task 10: AiProviderCard selects through a covering trigger

Pass 2 rules 5 to 9 for the `AiProviderCard` family, and the spec's defect: the card selected on a `div` click with no role, focus or key handler, so a keyboard user could not reach it. Selection moves to `AiProviderCardTrigger`, a `button` that covers the card the way upstream's `AttachmentTrigger` does; `AiProviderCardAction` stacks above it instead of stopping propagation. The content props (`name`, `icon`, `description`, `meta`, `status.text`, `action`) become children the consumer composes from `CardHeader`, `CardTitle`, `CardFooter`; the tone moves onto the root's `data-status` and `STATUS_TONE_CLASS` goes.

**Files:**

- Modify: `components/data-display/ai-provider-card.tsx` (rewritten), `components/data-display/ai-provider-card.spec.tsx` (rewritten), `blocks/ai-provider-picker.tsx`, `apps/registry-ui/registry.json` (the `ai-provider-picker` item's `registryDependencies`)

**Interfaces:**

- Consumes: the tree after plan B Task 1; `StatusTone` from `components/feedback/status-indicator` (unchanged).
- Produces, from `components/data-display/ai-provider-card`:
  - `AiProviderCard(props: React.ComponentProps<typeof Card> & { status?: StatusTone })` - `size` defaults to `'sm'`; renders `data-slot="ai-provider-card"`, `data-status={status}`
  - `AiProviderCardDescription(props: React.ComponentProps<typeof CardDescription>)`
  - `AiProviderCardStatus(props: React.ComponentProps<'span'>)` - toned by the root's `data-status`
  - `AiProviderCardAction(props: React.ComponentProps<'div'>)` - stacks above the trigger
  - `AiProviderCardTrigger(props: React.ComponentProps<'button'>)` - `type` defaults to `'button'`
  - `type AiProviderCardProps`
- Removed: the `name`, `icon`, `description`, `meta`, `status: { tone, text }`, `action` and `onSelect` props; `STATUS_TONE_CLASS`.
- `AiProviderPicker`'s props are unchanged; with no `onSelect` its cards render no trigger.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing keyboard spec against the current card**

In `components/data-display/ai-provider-card.spec.tsx`, replace:

```text
  it('does not invoke onSelect when the trailing action is activated', () => {
```

with:

```text
  it('can be focused and selected from the keyboard', () => {
    const onSelect = vi.fn();
    render(<AiProviderCard name="OpenAI" onSelect={onSelect} />);

    const trigger = screen.getByRole('button');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onSelect when the trailing action is activated', () => {
```

(A native `button` activates on Enter and Space by dispatching `click`; jsdom does not synthesise that, so the case asserts what the browser relies on: a focusable button whose click selects.)

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/ai-provider-card.spec.tsx 2>&1 | grep -E '✓|×|Unable to find|Test Files|^ +Tests'
```

Expected:

```
     ✓ invokes onSelect when the card body is clicked
     × can be focused and selected from the keyboard
     ✓ does not invoke onSelect when the trailing action is activated
     ✓ shows the tone-styled status in place of the meta note
     ✓ renders with neither an icon nor a description
TestingLibraryElementError: Unable to find an accessible element with the role "button"
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

- [ ] **Step 3: Rewrite the family**

`components/data-display/ai-provider-card.tsx`:

```text
import * as React from 'react';

import { Card, CardDescription } from '@/registry/bases/base-ui/ui/card';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { StatusTone } from '../feedback/status-indicator';

interface AiProviderCardProps extends React.ComponentProps<typeof Card> {
  /** Tone of the attention note in `AiProviderCardStatus`; omit for a muted note. */
  status?: StatusTone;
}

/**
 * A tile for one AI provider in an overview grid. The consumer composes
 * `CardHeader` + `CardTitle` (brand mark and name), an `AiProviderCardDescription`,
 * a `CardFooter` holding an `AiProviderCardStatus` and an `AiProviderCardAction`,
 * and, when the tile selects, an `AiProviderCardTrigger` that covers the card.
 * Defaults to the small card size.
 */
function AiProviderCard({ status, size = 'sm', className, ...props }: AiProviderCardProps): React.ReactNode {
  return (
    <Card
      data-slot="ai-provider-card"
      data-status={status}
      size={size}
      className={cn(
        'group/ai-provider-card focus-within:ring-ring/50 has-data-[slot=ai-provider-card-trigger]:hover:ring-foreground/20 relative h-full transition-shadow',
        className,
      )}
      {...props}
    />
  );
}

/** The provider blurb: clamped to two lines, with the height of two reserved so grid rows align. */
function AiProviderCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>): React.ReactNode {
  return (
    <CardDescription
      data-slot="ai-provider-card-description"
      className={cn('line-clamp-2 min-h-11', className)}
      {...props}
    />
  );
}

/** The footer note (a model count, or an attention message), toned by the card's `status`. */
function AiProviderCardStatus({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="ai-provider-card-status"
      className={cn(
        'text-muted-foreground group-data-[status=busy]/ai-provider-card:text-destructive group-data-[status=idle]/ai-provider-card:text-warning group-data-[status=online]/ai-provider-card:text-success truncate text-xs',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A control inside the card (e.g. a `Switch`). It stacks above the
 * `AiProviderCardTrigger`, so activating it does not select the card.
 */
function AiProviderCardAction({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="ai-provider-card-action" className={cn('relative z-20', className)} {...props} />;
}

/**
 * The button that selects the card. It covers the whole card below any
 * `AiProviderCardAction`, so the card is one keyboard stop; give it an
 * `aria-label` naming the provider.
 */
function AiProviderCardTrigger({
  type = 'button',
  className,
  ...props
}: React.ComponentProps<'button'>): React.ReactNode {
  return (
    <button
      data-slot="ai-provider-card-trigger"
      type={type}
      className={cn('absolute inset-0 z-10 cursor-pointer rounded-xl outline-none', className)}
      {...props}
    />
  );
}

export { AiProviderCard, AiProviderCardAction, AiProviderCardDescription, AiProviderCardStatus, AiProviderCardTrigger };
export type { AiProviderCardProps };
```

- [ ] **Step 4: Rewrite the spec onto the composed parts**

The keyboard case from Step 1 now names the trigger; the action case asserts the trigger is not invoked; the tone case reads `data-status` off the root, since the colour is a CSS fact jsdom does not compute.

`components/data-display/ai-provider-card.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardStatus,
  AiProviderCardTrigger,
} from './ai-provider-card';

afterEach(cleanup);

describe('AiProviderCard', () => {
  it('can be focused and selected from the keyboard', () => {
    const onSelect = vi.fn();
    render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>OpenAI</CardTitle>
        </CardHeader>
        <AiProviderCardTrigger aria-label="Select OpenAI" onClick={onSelect} />
      </AiProviderCard>,
    );

    const trigger = screen.getByRole('button', { name: 'Select OpenAI' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the trigger when the action is activated', () => {
    const onSelect = vi.fn();
    const onAction = vi.fn();
    render(
      <AiProviderCard>
        <CardFooter>
          <AiProviderCardAction>
            <button type="button" onClick={onAction}>
              toggle
            </button>
          </AiProviderCardAction>
        </CardFooter>
        <AiProviderCardTrigger aria-label="Select OpenAI" onClick={onSelect} />
      </AiProviderCard>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('carries the status tone on the root for the status note to read', () => {
    render(
      <AiProviderCard status="busy">
        <CardFooter>
          <AiProviderCardStatus>Command failed</AiProviderCardStatus>
        </CardFooter>
      </AiProviderCard>,
    );

    const card = document.querySelector('[data-slot="ai-provider-card"]');
    expect(card?.getAttribute('data-status')).toBe('busy');
    expect(card?.querySelector('[data-slot="ai-provider-card-status"]')?.textContent).toBe('Command failed');
  });

  it('sets no status when none is given', () => {
    render(<AiProviderCard />);

    expect(document.querySelector('[data-slot="ai-provider-card"]')?.hasAttribute('data-status')).toBe(false);
  });

  it('renders the composed header and description', () => {
    render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>Custom provider</CardTitle>
          <AiProviderCardDescription>Models</AiProviderCardDescription>
        </CardHeader>
      </AiProviderCard>,
    );

    expect(screen.getByText('Custom provider')).toBeTruthy();
    expect(document.querySelector('[data-slot="ai-provider-card-description"]')?.textContent).toBe('Models');
  });
});
```

- [ ] **Step 5: Compose the parts in the picker block**

In `blocks/ai-provider-picker.tsx`, replace:

```text
import { AiProviderCard } from '@/registry/bases/base-ui/components/data-display/ai-provider-card';
```

with:

```text
import {
  AiProviderCard,
  AiProviderCardDescription,
  AiProviderCardStatus,
  AiProviderCardTrigger,
} from '@/registry/bases/base-ui/components/data-display/ai-provider-card';
import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
```

Replace:

```text
  /** Whole-card select handler - receives the provider key. */
```

with:

```text
  /** Card select handler - receives the provider key. Omit it and no card is selectable. */
```

Replace:

```text
 * showing one AI provider via an `AiProviderIcon` in the card's `icon` slot.
```

with:

```text
 * showing one AI provider via an `AiProviderIcon` beside the card's title.
```

Replace:

```text
        <AiProviderCard
          key={entry.provider}
          name={entry.name}
          description={entry.description}
          meta={entry.meta}
          icon={<AiProviderIcon provider={entry.provider} type="avatar" size={32} />}
          onSelect={onSelect ? () => onSelect(entry.provider) : undefined}
        />
```

with:

```text
        <AiProviderCard key={entry.provider}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <AiProviderIcon provider={entry.provider} type="avatar" size={32} />
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            </CardTitle>
            <AiProviderCardDescription>{entry.description}</AiProviderCardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <AiProviderCardStatus>{entry.meta}</AiProviderCardStatus>
          </CardFooter>
          {onSelect && (
            <AiProviderCardTrigger aria-label={`Select ${entry.name}`} onClick={() => onSelect(entry.provider)} />
          )}
        </AiProviderCard>
```

`examples/ai-provider-picker-hero.tsx` and `pages/demo-page.tsx` compose the block, whose props did not change; neither is edited.

- [ ] **Step 6: Declare the card primitive on the block's item**

The block now imports `ui/card` itself. In `apps/registry-ui/registry.json`, replace:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/ai-provider-card.json"],
```

with:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/ai-provider-card.json", "@shadcn/card"],
```

The `ai-provider-card` item still imports `ui/card`, `lib/utils` and `StatusTone` from the `status-dot` item's file, so its dependencies stand.

- [ ] **Step 7: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/ai-provider-card.spec.tsx 2>&1 | grep -E '✓|×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-cards1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-cards1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-cards1.log" 2>&1; grep 'error TS' "$S/tsc-cards1.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-display/ai-provider-card.tsx registry/bases/base-ui/components/data-display/ai-provider-card.spec.tsx registry/bases/base-ui/blocks/ai-provider-picker.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-display/ai-provider-card.tsx registry/bases/base-ui/components/data-display/ai-provider-card.spec.tsx registry/bases/base-ui/blocks/ai-provider-picker.tsx | tail -1
pnpm exec shadcn build > "$S/sb-cards1.log" 2>&1; tail -1 "$S/sb-cards1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-display/ai-provider-card.spec.tsx (5 tests)
 Test Files  1 passed (1)
      Tests  5 passed (5)
 Test Files  72 passed (72)
      Tests  380 passed (380)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

- [ ] **Step 8: The spec's checks hold for the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F='components/data-display/ai-provider-card.tsx components/data-display/ai-provider-card.spec.tsx'
grep -nE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
grep -n 'STATUS_TONE_CLASS' -r . --include='*.tsx'
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 9: Commit**

`$S/msg-cards1.txt`:

```
fix(registry-ui): select the ai provider card through a covering trigger

Why: the card selected on a div click with no role, focus or key
handler, so a keyboard user could not reach it. A button covering the
card, as upstream's AttachmentTrigger does, is one tab stop that
activates on Enter and Space, and the action stacks above it instead
of stopping propagation. The card's content props become the upstream
Card parts the consumer composes, and the status tone moves onto the
root's data-status in place of a class map.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-cards1.txt" -- $B/components/data-display/ai-provider-card.tsx \
  $B/components/data-display/ai-provider-card.spec.tsx $B/blocks/ai-provider-picker.tsx apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 11: ModelInfoCard takes its header and section title as children

Pass 2 rules 5 to 8 for the `ModelInfoCard` family. The identity header (`media`, `name`, `vendor`, `modelId`) and the section's `title`, `value` and `accent` stop being props: the consumer composes the header from `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` and `ItemFooter`, and a section's heading row from `Item`, the new `ModelInfoCardBadge` (the accent pill), `ItemTitle` and `ItemActions`. The model id's `text-[11px]` goes onto the scale as `text-xs` in the consumer's class. No importer: the family is composed only by its spec.

**Files:**

- Modify: `components/data-display/model-info-card.tsx` (rewritten), `components/data-display/model-info-card.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the tree after Task 10.
- Produces, from `components/data-display/model-info-card`:
  - `ModelInfoCard(props: React.ComponentProps<'div'>)`
  - `ModelInfoCardSection(props: React.ComponentProps<'div'>)`
  - `ModelInfoCardBadge(props: React.ComponentProps<'span'>)` - `aria-hidden`, muted unless the consumer passes a background class
- Removed: `ModelInfoCardProps` and `ModelInfoCardSectionProps` (with `media`, `name`, `vendor`, `modelId`, `accent`, `title`, `value`).

- [ ] **Step 1: Rewrite the spec onto the composed parts**

`components/data-display/model-info-card.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import * as modelInfoCardModule from './model-info-card';
import { ModelInfoCard, ModelInfoCardBadge, ModelInfoCardSection } from './model-info-card';

afterEach(cleanup);

describe('ModelInfoCard', () => {
  it('renders the composed identity header - media, name, vendor, modelId - over the body', () => {
    render(
      <ModelInfoCard>
        <Item size="xs">
          <ItemMedia>
            <span data-testid="logo" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>GPT-4o</ItemTitle>
            <ItemDescription>OpenAI</ItemDescription>
          </ItemContent>
          <ItemFooter>gpt-4o</ItemFooter>
        </Item>
        <div data-testid="body" />
      </ModelInfoCard>,
    );

    const card = document.querySelector('[data-slot="model-info-card"]');
    expect(card?.querySelector('[data-slot="item-media"] [data-testid="logo"]')).toBeTruthy();
    expect(screen.getByText('GPT-4o')).toBeTruthy();
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(card?.querySelector('[data-testid="body"]')).toBeTruthy();
  });
});

describe('ModelInfoCardSection', () => {
  it('renders an accent badge, title, value, and children', () => {
    render(
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-blue-500" />
          <ItemContent>
            <ItemTitle>Context Length</ItemTitle>
          </ItemContent>
          <ItemActions>128K tokens</ItemActions>
        </Item>
        <div data-testid="line" />
      </ModelInfoCardSection>,
    );

    const section = document.querySelector('[data-slot="model-info-card-section"]');
    expect(section?.querySelector('[data-slot="model-info-card-badge"]')?.className).toContain('bg-blue-500');
    expect(screen.getByText('Context Length')).toBeTruthy();
    expect(screen.getByText('128K tokens')).toBeTruthy();
    expect(section?.querySelector('[data-testid="line"]')).toBeTruthy();
  });
});

describe('ModelInfoCardBadge', () => {
  it('lets the consumer class replace the muted accent', () => {
    render(<ModelInfoCardBadge className="bg-blue-500" />);

    const badge = document.querySelector('[data-slot="model-info-card-badge"]');
    expect(badge?.className).toContain('bg-blue-500');
    expect(badge?.className).not.toContain('bg-muted-foreground');
  });
});

describe('model-info-card module', () => {
  it('exports the card, its section and the accent badge - no line/row or hover-wrapper component', () => {
    expect(Object.keys(modelInfoCardModule).sort()).toEqual([
      'ModelInfoCard',
      'ModelInfoCardBadge',
      'ModelInfoCardSection',
    ]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/model-info-card.spec.tsx 2>&1 | grep -E '✓|×|^Error|AssertionError|Test Files|^ +Tests'
```

Expected:

```
     ✓ renders the composed identity header - media, name, vendor, modelId - over the body
     × renders an accent badge, title, value, and children
     × lets the consumer class replace the muted accent
     × exports the card, its section and the accent badge - no line/row or hover-wrapper component
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
AssertionError: expected [ 'ModelInfoCard', …(1) ] to deeply equal [ 'ModelInfoCard', …(2) ]
 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)
```

(The header case already passes: the old root renders `children`, and jsdom does not check the required `name`.)

- [ ] **Step 3: Rewrite the family**

`components/data-display/model-info-card.tsx`:

```text
import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The detail panel for one model, meant for the shipped `HoverCardContent`. The
 * consumer composes the identity header from `Item` parts (`ItemMedia` for the
 * logo, `ItemTitle` for the name, `ItemDescription` for the vendor, `ItemFooter`
 * for the mono model id) over `ModelInfoCardSection`s.
 * @example
 * <ModelInfoCard>
 *   <Item size="xs" className="p-0">
 *     <ItemMedia><AiProviderIcon provider="openai" /></ItemMedia>
 *     <ItemContent><ItemTitle>GPT-4o</ItemTitle><ItemDescription>OpenAI</ItemDescription></ItemContent>
 *     <ItemFooter className="text-muted-foreground font-mono text-xs">gpt-4o</ItemFooter>
 *   </Item>
 *   {sections}
 * </ModelInfoCard>
 */
function ModelInfoCard({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-info-card" className={cn('flex flex-col gap-3', className)} {...props} />;
}

/**
 * A titled section inside a `ModelInfoCard`. Its heading row is an `Item`
 * holding a `ModelInfoCardBadge`, an `ItemTitle` and an optional `ItemActions`
 * value, over the detail lines.
 */
function ModelInfoCardSection({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-info-card-section" className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

/**
 * The accent pill beside a section title. Its colour is the consumer's
 * background class (e.g. `bg-blue-500`); without one it is muted.
 */
function ModelInfoCardBadge({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="model-info-card-badge"
      aria-hidden
      className={cn('bg-muted-foreground h-3.5 w-1 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

export { ModelInfoCard, ModelInfoCardBadge, ModelInfoCardSection };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/model-info-card.spec.tsx 2>&1 | grep -E '✓|×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-cards2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-cards2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-cards2.log" 2>&1; grep 'error TS' "$S/tsc-cards2.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-display/model-info-card.tsx registry/bases/base-ui/components/data-display/model-info-card.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-display/model-info-card.tsx registry/bases/base-ui/components/data-display/model-info-card.spec.tsx | tail -1
pnpm exec shadcn build > "$S/sb-cards2.log" 2>&1; tail -1 "$S/sb-cards2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-display/model-info-card.spec.tsx (4 tests)
 Test Files  1 passed (1)
      Tests  4 passed (4)
 Test Files  72 passed (72)
      Tests  379 passed (379)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(380 - 5 + 4: the two header cases became one, the badge gained one. The `model-info-card` item still imports only `lib/utils`, so `registry.json` is not edited.)

- [ ] **Step 5: The spec's checks hold for the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F='components/data-display/model-info-card.tsx components/data-display/model-info-card.spec.tsx'
grep -nE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 6: Commit**

`$S/msg-cards2.txt`:

```
refactor(registry-ui): compose the model info card from item parts

Why: the card took its header and each section's heading as props
(media, name, vendor, modelId, title, value, accent), so a caller who
needed a link or a badge in one had nowhere to put it. The header and
the heading rows are now upstream Item parts the consumer composes,
and the accent pill is the one part the family adds.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-cards2.txt" -- $B/components/data-display/model-info-card.tsx \
  $B/components/data-display/model-info-card.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 12: ModelList drops its item root for upstream Item parts

Pass 2 rules 5 to 8 for the `ModelList` family. `ModelListItem` goes: the consumer composes `ItemGroup`, `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` and upstream `Switch` directly. The root's `title`, `controls` and `tabs` props become `ModelListHeader`, `ModelListTitle` and `ModelListAction`; the remove button becomes `ModelListItemRemove`; the unavailable dimming moves from a prop onto `data-unavailable` on `Item`, styled by `ModelListContent`. No importer: the family is composed only by its spec, and it is not a registry item.

**Files:**

- Modify: `components/layout/model-list.tsx` (rewritten), `components/layout/model-list.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the tree after Task 11.
- Produces, from `components/layout/model-list`:
  - `ModelList`, `ModelListHeader`, `ModelListAction`, `ModelListContent` (each `React.ComponentProps<'div'>`), `ModelListTitle(props: React.ComponentProps<'h3'>)`
  - `ModelListItemRemove(props: React.ComponentProps<typeof Button>)` - named "Remove model" unless given an `aria-label`; the trash icon unless given children
  - `ModelListSkeleton(props: ModelListSkeletonProps)`, `type ModelListSkeletonProps` (unchanged)
- Removed: `ModelListItem`, `ModelListItemProps`, `ModelListProps` (`title`, `controls`, `tabs`).

- [ ] **Step 1: Rewrite the spec onto the composed parts**

The `ModelListItem` cases that drove `Switch` go with the component: the toggle is now upstream `Switch`, composed by the consumer, and its `disabled` is the consumer's. The PointerEvent shim went with them.

`components/layout/model-list.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListItemRemove,
  ModelListSkeleton,
  ModelListTitle,
} from './model-list';

afterEach(cleanup);

describe('ModelList', () => {
  it('renders the title, controls, tabs, and content', () => {
    render(
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <button type="button">Refresh</button>
          </ModelListAction>
          <div data-testid="tabs" />
        </ModelListHeader>
        <ModelListContent>
          <div data-testid="child-a" />
          <div data-testid="child-b" />
        </ModelListContent>
      </ModelList>,
    );

    expect(screen.getByRole('heading', { name: 'Model list' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByTestId('tabs')).toBeTruthy();
    const content = document.querySelector('[data-slot="model-list-content"]');
    expect(content?.querySelector('[data-testid="child-a"]')).toBeTruthy();
    expect(content?.querySelector('[data-testid="child-b"]')).toBeTruthy();
  });

  it('renders its content in order without transforming it', () => {
    render(
      <ModelList>
        <ModelListContent>
          <div data-testid="child">a</div>
          <div data-testid="child">b</div>
          <div data-testid="child">c</div>
        </ModelListContent>
      </ModelList>,
    );

    const children = screen.getAllByTestId('child');
    expect(children.map((child) => child.textContent)).toEqual(['a', 'b', 'c']);
  });
});

describe('ModelListContent', () => {
  it('dims an item marked unavailable', () => {
    render(
      <ModelListContent>
        <ItemGroup>
          <Item size="sm" data-unavailable>
            <ItemContent>
              <ItemTitle>GPT-4o</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ModelListContent>,
    );

    const content = document.querySelector('[data-slot="model-list-content"]');
    expect(content?.className).toContain('**:data-[slot=item]:data-unavailable:opacity-55');
    expect(content?.querySelector('[data-slot="item"]')?.hasAttribute('data-unavailable')).toBe(true);
  });
});

describe('ModelListItemRemove', () => {
  it('renders a labelled remove control that calls onClick', () => {
    const onRemove = vi.fn();
    render(
      <Item>
        <ItemActions>
          <ModelListItemRemove onClick={onRemove} />
        </ItemActions>
      </Item>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove model' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('takes the consumer label in place of the default', () => {
    render(<ModelListItemRemove aria-label="Remove GPT-4o" />);

    expect(screen.getByRole('button', { name: 'Remove GPT-4o' })).toBeTruthy();
  });
});

describe('ModelListSkeleton', () => {
  it('renders six placeholder items by default', () => {
    render(<ModelListSkeleton />);

    expect(document.querySelectorAll('[data-slot="model-list-skeleton-item"]')).toHaveLength(6);
  });

  it('renders the requested number of placeholder items, each matching the item shape', () => {
    render(<ModelListSkeleton count={3} />);

    const items = document.querySelectorAll('[data-slot="model-list-skeleton-item"]');
    expect(items).toHaveLength(3);
    // media placeholder + two text lines + a trailing control = 4 skeletons
    expect(items[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/model-list.spec.tsx 2>&1 | grep -E '✓|×|^Error|Test Files|^ +Tests'
```

Expected:

```
     × renders the title, controls, tabs, and content
     × renders its content in order without transforming it
     × dims an item marked unavailable
     × renders a labelled remove control that calls onClick
     × takes the consumer label in place of the default
     ✓ renders six placeholder items by default
     ✓ renders the requested number of placeholder items, each matching the item shape
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
 Test Files  1 failed (1)
      Tests  5 failed | 2 passed (7)
```

- [ ] **Step 3: Rewrite the family**

`components/layout/model-list.tsx`:

```text
import * as React from 'react';
import { Trash2 } from 'lucide-react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Skeleton } from '@/registry/bases/base-ui/ui/skeleton';

/**
 * The frame for a model list section: a `ModelListHeader` over a scrolling
 * `ModelListContent`. It owns no list state - it does not filter, group, sort
 * or paginate. Place it in a height-constrained flex parent so the content
 * scrolls.
 * @example
 * <ModelList>
 *   <ModelListHeader>
 *     <ModelListTitle>Model list</ModelListTitle>
 *     <ModelListAction>{search}</ModelListAction>
 *   </ModelListHeader>
 *   <ModelListContent>
 *     <ItemGroup>
 *       <Item size="sm" data-unavailable={unavailable || undefined}>
 *         <ItemMedia><AiProviderIcon provider="openai" /></ItemMedia>
 *         <ItemContent><ItemTitle>GPT-4o</ItemTitle><ItemDescription>gpt-4o</ItemDescription></ItemContent>
 *         <ItemActions>
 *           <Switch checked={enabled} disabled={unavailable} onCheckedChange={setEnabled} />
 *           <ModelListItemRemove onClick={remove} />
 *         </ItemActions>
 *       </Item>
 *     </ItemGroup>
 *   </ModelListContent>
 * </ModelList>
 */
function ModelList({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-list" className={cn('flex min-h-0 flex-1 flex-col', className)} {...props} />;
}

/** The row above the list: a title and trailing controls. A `TabsList` placed in it takes a line of its own. */
function ModelListHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="model-list-header"
      className={cn('flex flex-wrap items-center gap-2 px-1 pt-1 *:data-[slot=tabs-list]:basis-full', className)}
      {...props}
    />
  );
}

function ModelListTitle({ className, ...props }: React.ComponentProps<'h3'>): React.ReactNode {
  return (
    <h3
      data-slot="model-list-title"
      className={cn('flex-1 text-base font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

/** Trailing header controls - search, refresh and the like. */
function ModelListAction({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-list-action" className={cn('flex shrink-0 items-center gap-2', className)} {...props} />;
}

/**
 * The scrolling region: item groups, an empty state or a `ModelListSkeleton`.
 * An `Item` inside it carrying `data-unavailable` is dimmed; set the attribute
 * only when the model is unavailable, since `data-unavailable="false"` counts too.
 */
function ModelListContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="model-list-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-3 **:data-[slot=item]:data-unavailable:opacity-55',
        className,
      )}
      {...props}
    />
  );
}

/** The remove control for one model item, labelled "Remove model" unless an `aria-label` is given. */
function ModelListItemRemove({ className, children, ...props }: React.ComponentProps<typeof Button>): React.ReactNode {
  return (
    <Button
      data-slot="model-list-item-remove"
      aria-label="Remove model"
      variant="ghost"
      size="icon-sm"
      className={cn('text-muted-foreground hover:text-destructive size-7', className)}
      {...props}
    >
      {children ?? <Trash2 className="size-3.5" />}
    </Button>
  );
}

interface ModelListSkeletonProps extends React.ComponentProps<'div'> {
  /** Number of placeholder items. Defaults to 6. */
  count?: number;
}

/**
 * Placeholder items shown while a model list loads, each the shape of a model
 * item: a media placeholder, two text lines and a trailing control.
 */
function ModelListSkeleton({ count = 6, className, ...props }: ModelListSkeletonProps): React.ReactNode {
  return (
    <div data-slot="model-list-skeleton" className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-slot="model-list-skeleton-item" className="flex items-center gap-3 rounded-md p-2.5">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-4 w-8 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListItemRemove,
  ModelListSkeleton,
  ModelListTitle,
};
export type { ModelListSkeletonProps };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/model-list.spec.tsx 2>&1 | grep -E '✓|×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-cards3.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-cards3.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-cards3.log" 2>&1; grep 'error TS' "$S/tsc-cards3.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/model-list.tsx registry/bases/base-ui/components/layout/model-list.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/layout/model-list.tsx registry/bases/base-ui/components/layout/model-list.spec.tsx | tail -1
pnpm exec shadcn build > "$S/sb-cards3.log" 2>&1; tail -1 "$S/sb-cards3.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/model-list.spec.tsx (7 tests)
 Test Files  1 passed (1)
      Tests  7 passed (7)
 Test Files  72 passed (72)
      Tests  375 passed (375)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(379 - 11 + 7: seven `ModelListItem` cases went with the component; the content and remove parts gained three.)

- [ ] **Step 5: The spec's checks hold for the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F='components/layout/model-list.tsx components/layout/model-list.spec.tsx'
grep -nE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
git grep -n 'ModelListItem\b' -- .
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 6: Commit**

`$S/msg-cards3.txt`:

```
refactor(registry-ui): compose model list items from upstream item parts

Why: ModelListItem re-assembled Item, Switch and a remove button behind
nine props, and the list root took its title, controls and tabs as
props. The consumer now composes the upstream Item parts and Switch
directly; the family keeps the header, content and skeleton parts and
adds the remove button, and an unavailable item is marked with
data-unavailable instead of a prop.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-cards3.txt" -- $B/components/layout/model-list.tsx $B/components/layout/model-list.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 13: DataTable column actions keep the caller's onClick; empty state becomes a part

Pass 2 rules 5 to 9 for the `DataTable` family, and the spec's defect: `DataTableColumnHeaderSortAscending`, `...SortDescending` and `...Hide` spread the caller's props before their own `onClick`, so a caller's `onClick` was dropped. Each now calls the caller's handler, then its own, and spreads the rest after. `DataTableView`'s `empty` prop becomes the `DataTableEmpty` part, rendered from the view's children while there are no rows. `DataTablePagination` and `DataTableViewOptions` take their element's props and spread them; every part carries `data-slot`; every function names its return type. No importer and no registry item: the family is composed only by its new spec.

**Files:**

- Create: `components/data-display/data-table.spec.tsx`
- Modify: `components/data-display/data-table.tsx` (rewritten)

**Interfaces:**

- Consumes: the tree after Task 12.
- Produces, from `components/data-display/data-table`:
  - `DataTableView(props: React.ComponentProps<'div'>)` - `children` render in the body only while there are no rows
  - `DataTableEmpty(props: React.ComponentProps<typeof TableCell>)` - one row, one cell spanning every leaf column, `h-24 text-center`
  - `DataTableColumnHeaderSortAscending`, `...SortDescending`, `...Hide` - same props; a passed `onClick` now runs, before the part's own action
  - `DataTablePagination(props: React.ComponentProps<'div'> & { previousLabel?: string; nextLabel?: string })`
  - `DataTableViewOptions(props: React.ComponentProps<typeof Button>)` - named "Toggle columns" unless given an `aria-label`
  - `DataTable`, `DataTableToolbar`, `DataTableColumnHeader`, `useDataTable` - unchanged signatures, now with `data-slot`
- Removed: `DataTableView`'s `empty` prop. With no `DataTableEmpty` child, an empty table renders no body row (it rendered one empty cell).

- [ ] **Step 1: Write the failing spec**

`components/data-display/data-table.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DropdownMenu, DropdownMenuContent } from '@/registry/bases/base-ui/ui/dropdown-menu';
import {
  DataTable,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableEmpty,
  DataTableView,
} from './data-table';

interface Row {
  name: string;
  size: number;
}

const COLUMNS: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'size', header: 'Size' },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function useRowsTable(rows: Row[]): TanstackTable<Row> {
  return useReactTable({
    data: rows,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
}

/** Renders the three column actions for `name` in an open menu, and the table state they change. */
function ColumnActions({ onClick }: { onClick: () => void }): ReactNode {
  const table = useRowsTable([{ name: 'a', size: 1 }]);
  const column = table.getColumn('name');
  if (!column) return null;
  return (
    <>
      <DropdownMenu open>
        <DropdownMenuContent>
          <DataTableColumnHeaderSortAscending column={column} onClick={onClick} />
          <DataTableColumnHeaderSortDescending column={column} onClick={onClick} />
          <DataTableColumnHeaderHide column={column} onClick={onClick} />
        </DropdownMenuContent>
      </DropdownMenu>
      <output data-testid="sorting">{JSON.stringify(table.getState().sorting)}</output>
      <output data-testid="visible">{String(column.getIsVisible())}</output>
    </>
  );
}

function RowsTable({ rows }: { rows: Row[] }): ReactNode {
  const table = useRowsTable(rows);
  return (
    <DataTable table={table}>
      <DataTableView>
        <DataTableEmpty>No results.</DataTableEmpty>
      </DataTableView>
    </DataTable>
  );
}

describe('DataTableColumnHeader actions', () => {
  it('sorts ascending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    render(<ColumnActions onClick={onClick} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Asc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sorting').textContent).toBe('[{"id":"name","desc":false}]');
  });

  it('sorts descending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    render(<ColumnActions onClick={onClick} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sorting').textContent).toBe('[{"id":"name","desc":true}]');
  });

  it('hides the column and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    render(<ColumnActions onClick={onClick} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('visible').textContent).toBe('false');
  });
});

describe('DataTableEmpty', () => {
  it('renders one cell spanning every column when there are no rows', () => {
    render(<RowsTable rows={[]} />);

    const cell = screen.getByText('No results.');
    expect(cell.getAttribute('data-slot')).toBe('data-table-empty');
    expect(cell.getAttribute('colspan')).toBe('2');
  });

  it('is not rendered while there are rows', () => {
    render(<RowsTable rows={[{ name: 'a', size: 1 }]} />);

    expect(screen.queryByText('No results.')).toBeNull();
    expect(screen.getByRole('cell', { name: 'a' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/data-table.spec.tsx 2>&1 | grep -E '✓|×|AssertionError|Unable to find|Test Files|^ +Tests'
```

Expected:

```
     × sorts ascending and still calls the caller onClick
     × sorts descending and still calls the caller onClick
     × hides the column and still calls the caller onClick
     × renders one cell spanning every column when there are no rows
     ✓ is not rendered while there are rows
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
TestingLibraryElementError: Unable to find an element with the text: No results.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
```

The three action cases fail on the dropped `onClick`, not on the sort: the part's own handler, written last, won. The empty case fails because the old `DataTableView` never renders its children.

- [ ] **Step 3: Rewrite the family**

`components/data-display/data-table.tsx`:

```text
import * as React from 'react';
import { type Column, type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, EyeOff, Settings2 } from 'lucide-react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

interface DataTableContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one context holds a table of any row type; useDataTable narrows it
  table: TanstackTable<any>;
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null);

/** Read the @tanstack/react-table instance shared by the surrounding <DataTable>. */
function useDataTable<TData>(): TanstackTable<TData> {
  const ctx = React.useContext(DataTableContext);
  if (!ctx) {
    throw new Error('DataTable parts must be used within <DataTable>');
  }
  return ctx.table as TanstackTable<TData>;
}

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
}

/**
 * Root of the data-table compound. Holds the table instance in context so every
 * part (toolbar, view, view-options, pagination) reads it without prop-drilling.
 * The consumer owns `useReactTable` + the column defs; the SDK ships only the
 * composable parts (shadcn data-table is a recipe, not a packaged component).
 */
function DataTable<TData>({ table, className, children, ...props }: DataTableProps<TData>): React.ReactNode {
  const value = React.useMemo(() => ({ table }), [table]);
  return (
    <DataTableContext.Provider value={value}>
      <div data-slot="data-table" className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

/** A flex row for filters + actions above the table. */
function DataTableToolbar({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="data-table-toolbar" className={cn('flex items-center gap-2', className)} {...props} />;
}

/**
 * The table content (header + body) rendered from the context table instance.
 * `children` render in the body only while there are no rows - a `DataTableEmpty`.
 */
function DataTableView({ children, className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  const table = useDataTable();

  return (
    <div data-slot="data-table-view" className={cn('rounded-md border', className)} {...props}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length
            ? table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            : children}
        </TableBody>
      </Table>
    </div>
  );
}

/** The one row a `DataTableView` shows when there are no rows: a cell spanning every column. */
function DataTableEmpty({ className, ...props }: React.ComponentProps<typeof TableCell>): React.ReactNode {
  const table = useDataTable();
  return (
    <TableRow>
      <TableCell
        data-slot="data-table-empty"
        colSpan={table.getAllLeafColumns().length}
        className={cn('h-24 text-center', className)}
        {...props}
      />
    </TableRow>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.ComponentProps<'div'> {
  column: Column<TData, TValue>;
}

/**
 * Sortable / hideable header. Used inside a column's `header`, so it takes the
 * `column` directly (column defs live outside the render tree, can't read
 * context). Its title is `children`; the menu shows the default sort/hide
 * actions, whose copy lives as each action part's own `children` default -
 * compose the parts for different copy, never a `labels` config.
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  children,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>): React.ReactNode {
  if (!column.getCanSort() && !column.getCanHide()) {
    return (
      <div data-slot="data-table-column-header" className={cn(className)} {...props}>
        {children}
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <div data-slot="data-table-column-header" className={cn('flex items-center gap-2', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="data-[popup-open]:bg-accent -ml-2.5" />}
        >
          {children}
          {sorted === 'desc' ? (
            <ArrowDown className="size-3.5" />
          ) : sorted === 'asc' ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ChevronsUpDown className="size-3.5 opacity-50" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DataTableColumnHeaderSortAscending column={column} />
              <DataTableColumnHeaderSortDescending column={column} />
            </>
          )}
          {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
          {column.getCanHide() && <DataTableColumnHeaderHide column={column} />}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DataTableColumnActionProps<TData, TValue> = {
  column: Column<TData, TValue>;
} & React.ComponentProps<typeof DropdownMenuItem>;

/** Sort-ascending action; `children` override the default copy. A caller's `onClick` runs before the sort. */
function DataTableColumnHeaderSortAscending<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
  return (
    <DropdownMenuItem
      data-slot="data-table-column-header-sort-ascending"
      onClick={(event) => {
        onClick?.(event);
        column.toggleSorting(false);
      }}
      {...props}
    >
      <ArrowUp className="text-muted-foreground/70" />
      {children ?? 'Asc'}
    </DropdownMenuItem>
  );
}

/** Sort-descending action; `children` override the default copy. A caller's `onClick` runs before the sort. */
function DataTableColumnHeaderSortDescending<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
  return (
    <DropdownMenuItem
      data-slot="data-table-column-header-sort-descending"
      onClick={(event) => {
        onClick?.(event);
        column.toggleSorting(true);
      }}
      {...props}
    >
      <ArrowDown className="text-muted-foreground/70" />
      {children ?? 'Desc'}
    </DropdownMenuItem>
  );
}

/** Hide-column action; `children` override the default copy. A caller's `onClick` runs before the column hides. */
function DataTableColumnHeaderHide<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
  return (
    <DropdownMenuItem
      data-slot="data-table-column-header-hide"
      onClick={(event) => {
        onClick?.(event);
        column.toggleVisibility(false);
      }}
      {...props}
    >
      <EyeOff className="text-muted-foreground/70" />
      {children ?? 'Hide'}
    </DropdownMenuItem>
  );
}

interface DataTablePaginationProps extends React.ComponentProps<'div'> {
  /** Accessible names for the icon-only buttons (override per locale). */
  previousLabel?: string;
  nextLabel?: string;
}

/**
 * Prev/next pager reading the table from <DataTable> context. Pass children for
 * a status line - the consumer's i18n owns "Page X of Y" - and the icon-only
 * buttons take overridable accessible names.
 */
function DataTablePagination({
  children,
  className,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  ...props
}: DataTablePaginationProps): React.ReactNode {
  const table = useDataTable();
  return (
    <div data-slot="data-table-pagination" className={cn('flex items-center justify-end gap-2', className)} {...props}>
      {children}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label={previousLabel}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label={nextLabel}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

/**
 * Column-visibility toggle, reading the table from <DataTable> context. The
 * trigger is icon-only by default - pass children to add a visible label (the
 * consumer's i18n owns that copy) - and is named "Toggle columns" unless an
 * `aria-label` is given. No "Toggle columns" heading: the checkbox list speaks
 * for itself, matching shadcn.
 */
function DataTableViewOptions({ children, ...props }: React.ComponentProps<typeof Button>): React.ReactNode {
  const table = useDataTable();
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            data-slot="data-table-view-options"
            variant="outline"
            size="sm"
            aria-label="Toggle columns"
            {...props}
          />
        }
      >
        <Settings2 />
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  DataTable,
  DataTableToolbar,
  DataTableView,
  DataTableEmpty,
  useDataTable,
  DataTableColumnHeader,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
  DataTablePagination,
  DataTableViewOptions,
};
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/data-table.spec.tsx 2>&1 | grep -E '✓|×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-cards4.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-cards4.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-cards4.log" 2>&1; grep 'error TS' "$S/tsc-cards4.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-display/data-table.tsx registry/bases/base-ui/components/data-display/data-table.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-display/data-table.tsx registry/bases/base-ui/components/data-display/data-table.spec.tsx | tail -1
pnpm exec shadcn build > "$S/sb-cards4.log" 2>&1; tail -1 "$S/sb-cards4.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-display/data-table.spec.tsx (5 tests)
 Test Files  1 passed (1)
      Tests  5 passed (5)
 Test Files  73 passed (73)
      Tests  380 passed (380)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

- [ ] **Step 5: The spec's checks hold for the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F='components/data-display/data-table.tsx components/data-display/data-table.spec.tsx'
grep -nE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all. (Before this task the last line printed four docblock lines of `data-table.tsx` carrying em dashes.)

- [ ] **Step 6: Commit**

`$S/msg-cards4.txt`:

```
fix(registry-ui): keep a caller's onClick on the data table column actions

Why: the sort and hide actions spread the caller's props before their
own onClick, so a caller's onClick was silently dropped. Each now runs
the caller's handler and then its own. The view's empty prop becomes a
DataTableEmpty part, and every part takes its element's props and
carries data-slot.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/components/data-display/data-table.spec.tsx
git commit -q -F "$S/msg-cards4.txt" -- $B/components/data-display/data-table.tsx \
  $B/components/data-display/data-table.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

## Chat families

### Task 14: ChatMessage becomes a thin root over upstream Message

Families table row `ChatMessage`. The prop bag (`role`, `agent`, `showAgentLabel`) and the two hand-drawn trees go: the root renders upstream `Message`, stamps `data-slot="chat-message"` and carries `data-streaming` while text arrives; its recipe draws the leading-edge accent off that attribute. The consumer composes `MessageContent`, `MessageHeader`, `Bubble` and `BubbleContent`, a `muted` bubble for the user and a `ghost` one for the agent, as upstream's `message-markdown` and `message-header-footer` examples do. `types/chat-role.ts` and `types/chat-agent-identity.ts` lose their only reader and are deleted.

**Files:**

- Modify: `components/data-display/chat-message.tsx` (rewritten), `components/data-display/chat-message.spec.tsx` (rewritten), `examples/chat-message-hero.tsx` (rewritten), `pages/demo-page.tsx`, `apps/registry-ui/registry.json` (items `chat-message`, `demo-page`, `chat-message-hero`)
- Delete: `types/chat-role.ts`, `types/chat-agent-identity.ts`

**Interfaces:**

- Consumes: the Task 1 (b1) tree.
- Produces: `ChatMessage(props: ChatMessageProps): ReactNode`, `interface ChatMessageProps extends ComponentProps<typeof Message> { streaming?: boolean }` from `components/data-display/chat-message`. Root: `data-slot="chat-message"`, `data-align` (upstream), `data-streaming` (present while `streaming`).
- Removed: the `role`, `agent`, `showAgentLabel` props; `type ChatRole`; `interface ChatAgentIdentity`.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/data-display/chat-message.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';

import { ChatMessage } from './chat-message';

afterEach(cleanup);

const root = (): HTMLElement => document.querySelector('[data-slot="chat-message"]') as HTMLElement;

describe('ChatMessage', () => {
  it('renders the upstream message parts it is given', () => {
    render(
      <ChatMessage>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>answer</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>,
    );
    expect(screen.getByText('Assistant').getAttribute('data-slot')).toBe('message-header');
    expect(screen.getByText('answer').getAttribute('data-slot')).toBe('bubble-content');
  });

  it('aligns through the upstream message root', () => {
    render(<ChatMessage align="end">hello</ChatMessage>);
    expect(root().getAttribute('data-align')).toBe('end');
  });

  it('marks the root only while the message is streaming', () => {
    const { rerender } = render(<ChatMessage streaming>body</ChatMessage>);
    expect(root().hasAttribute('data-streaming')).toBe(true);

    rerender(<ChatMessage>body</ChatMessage>);
    expect(root().hasAttribute('data-streaming')).toBe(false);
  });

  it('passes the caller style through, so an agent colour tints the accent', () => {
    render(
      <ChatMessage streaming style={{ borderInlineStartColor: 'rgb(255, 0, 0)' }}>
        body
      </ChatMessage>,
    );
    expect(root().style.borderInlineStartColor).toBe('rgb(255, 0, 0)');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/data-display/chat-message.spec.tsx`
Expected (the first case already passes: the old root renders any children):

```
     ✓ renders the upstream message parts it is given
     × aligns through the upstream message root
     × marks the root only while the message is streaming
     × passes the caller style through, so an agent colour tints the accent
AssertionError: expected null to be 'end' // Object.is equality
AssertionError: expected false to be true // Object.is equality
AssertionError: expected '' to be 'rgb(255, 0, 0)' // Object.is equality
 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/data-display/chat-message.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { Message } from '@/registry/bases/base-ui/ui/message';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ChatMessage - one chat message row: upstream `Message` plus a leading-edge
 * accent while the text is still arriving. The consumer composes the row from
 * upstream parts, a muted `Bubble` for the user and a ghost one for the agent:
 *
 *   <ChatMessage align="end">
 *     <MessageContent>
 *       <Bubble variant="muted"><BubbleContent>Hello</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 *   <ChatMessage streaming style={{ borderInlineStartColor: agent.color }}>
 *     <MessageContent>
 *       <MessageHeader>{agent.name}</MessageHeader>
 *       <Bubble variant="ghost"><BubbleContent>{text}</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 */
interface ChatMessageProps extends ComponentProps<typeof Message> {
  /**
   * While true, the row carries `data-streaming` and a leading-edge line in
   * `border-primary`; `style.borderInlineStartColor` recolours it, for
   * example to the agent's colour.
   */
  streaming?: boolean;
}

function ChatMessage({ streaming = false, className, ...props }: ChatMessageProps): ReactNode {
  return (
    <Message
      data-slot="chat-message"
      data-streaming={streaming ? '' : undefined}
      className={cn(
        'data-streaming:border-primary data-streaming:-ms-3 data-streaming:border-s-2 data-streaming:ps-3',
        className,
      )}
      {...props}
    />
  );
}

export { ChatMessage };
export type { ChatMessageProps };
```

- [ ] **Step 4: Delete the two types nothing reads any more**

Run (from `apps/registry-ui/registry/bases/base-ui`): `git rm -q types/chat-role.ts types/chat-agent-identity.ts && git grep -n -e ChatRole -e ChatAgentIdentity -e chat-role -e chat-agent-identity -- . ../../../registry.json`
Expected: nothing printed by the grep.

- [ ] **Step 5: Rewrite the hero example onto the upstream parts**

`apps/registry-ui/registry/bases/base-ui/examples/chat-message-hero.tsx`:

```text
import { ChatMessage } from '@/registry/bases/base-ui/components/data-display/chat-message';
import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';

/** A user bubble plus an assistant row - the ChatMessage hero (monochrome). */
export function ChatMessageHero() {
  return (
    <div className="flex w-full flex-col gap-3">
      <ChatMessage align="end">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Hello - any updates?</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>
      <ChatMessage>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>Looking now - will report back shortly.</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>
    </div>
  );
}
```

- [ ] **Step 6: Update the demo page**

In `pages/demo-page.tsx` replace

```text
import { ChatMessage } from '@/registry/bases/base-ui/components/data-display/chat-message';
```

with

```text
import { ChatMessage } from '@/registry/bases/base-ui/components/data-display/chat-message';
import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';
```

and replace

```text
        <ChatMessage role="user">Which provider should we use?</ChatMessage>
        <ChatMessage role="assistant" showAgentLabel agent={{ name: 'Assistant', color: '#6366f1' }}>
          Pick any tile above - each card is one provider; the picker calls back with its key when you choose.
        </ChatMessage>
```

with

```text
        <ChatMessage align="end">
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>Which provider should we use?</BubbleContent>
            </Bubble>
          </MessageContent>
        </ChatMessage>
        <ChatMessage>
          <MessageContent>
            <MessageHeader>Assistant</MessageHeader>
            <Bubble variant="ghost">
              <BubbleContent>
                Pick any tile above - each card is one provider; the picker calls back with its key when you choose.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </ChatMessage>
```

- [ ] **Step 7: Declare what the three items now import**

In `apps/registry-ui/registry.json` replace (item `chat-message`)

```text
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/chat-message.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/types/chat-role.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/types/chat-agent-identity.ts",
          "type": "registry:lib"
        }
      ]
```

with

```text
      "registryDependencies": ["@shadcn/message", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/chat-message.tsx",
          "type": "registry:component"
        }
      ]
```

replace (item `demo-page`)

```text
        "https://ui.zeroxsolutions.com/r/ai-provider-picker.json",
        "https://ui.zeroxsolutions.com/r/chat-message.json"
      ],
```

with

```text
        "https://ui.zeroxsolutions.com/r/ai-provider-picker.json",
        "https://ui.zeroxsolutions.com/r/chat-message.json",
        "@shadcn/bubble",
        "@shadcn/message"
      ],
```

and replace (item `chat-message-hero`)

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/chat-message.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/chat-message-hero.tsx",
```

with

```text
      "registryDependencies": [
        "https://ui.zeroxsolutions.com/r/chat-message.json",
        "@shadcn/bubble",
        "@shadcn/message"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/chat-message-hero.tsx",
```

The `chat-message` item's `description` still describes the old prop bag; descriptions are spec (b)'s and are left.

- [ ] **Step 8: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-display/chat-message.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-chat1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-chat1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-chat1.log" 2>&1; grep 'error TS' "$S/tsc-chat1.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-display/chat-message.tsx registry/bases/base-ui/components/data-display/chat-message.spec.tsx registry/bases/base-ui/examples/chat-message-hero.tsx registry/bases/base-ui/pages/demo-page.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-display/chat-message.tsx registry/bases/base-ui/components/data-display/chat-message.spec.tsx registry/bases/base-ui/examples/chat-message-hero.tsx registry/bases/base-ui/pages/demo-page.tsx registry.json 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-chat1.log" 2>&1; tail -1 "$S/sb-chat1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
 Test Files  72 passed (72)
      Tests  376 passed (376)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

(72 files: the count holds; 379 - 7 old cases + 4 new = 376.)

- [ ] **Step 9: Run the spec's checks on the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F="components/data-display/chat-message.tsx"
grep -lnE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 10: Commit**

`$S/msg-chat1.txt`:

```
refactor(registry-ui): compose chat-message from upstream message parts

Why: ChatMessage took role, agent and showAgentLabel and drew its own
user bubble and agent row, a second copy of what upstream Message and
Bubble already publish, with no slot for anything the props did not
foresee. It is now upstream Message plus the one thing upstream lacks,
the streaming accent, carried on data-streaming; the chat role and
agent identity types lose their only reader and go.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-chat1.txt" -- $B/components/data-display $B/examples/chat-message-hero.tsx $B/pages/demo-page.tsx $B/types apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 15: ChatEmptyState becomes ChatSuggestionItem

Families table row `ChatSuggestionItem`. `ChatEmptyState` only re-assembled upstream `Empty*` and `Item*` around a `suggestions` array; what it added was the suggestion button. That button stays, as `ChatSuggestionItem` in `data-entry/chat-suggestion-item.tsx` (picking it hands a prompt to the app); the consumer composes `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`, and `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` inside each item. `types/chat-suggestion.ts` loses its only reader and is deleted. Nothing outside the family imports it.

**Files:**

- Create: `components/data-entry/chat-suggestion-item.tsx`, `components/data-entry/chat-suggestion-item.spec.tsx`
- Delete: `components/data-entry/chat-empty-state.tsx`, `components/data-entry/chat-empty-state.spec.tsx`, `types/chat-suggestion.ts`

**Interfaces:**

- Consumes: the Task 14 tree.
- Produces: `ChatSuggestionItem(props: ChatSuggestionItemProps): ReactNode`, `interface ChatSuggestionItemProps extends ComponentProps<'button'> { prompt: string; onSelectPrompt?: (prompt: string) => void }` from `components/data-entry/chat-suggestion-item`. The button carries `data-slot="chat-suggestion-item"`; it is disabled when `onSelectPrompt` is absent unless `disabled` is passed; the caller's `onClick` runs first and `preventDefault()` there stops the report.
- Removed: `ChatEmptyState`, `ChatEmptyStateProps`, `interface ChatSuggestion`.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing spec and delete the old one**

Run (from `apps/registry-ui/registry/bases/base-ui`): `git rm -q components/data-entry/chat-empty-state.spec.tsx`

`apps/registry-ui/registry/bases/base-ui/components/data-entry/chat-suggestion-item.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItemContent, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { ChatSuggestionItem } from './chat-suggestion-item';

afterEach(cleanup);

describe('ChatSuggestionItem', () => {
  it('reports its prompt when picked', () => {
    const onSelectPrompt = vi.fn();
    render(
      <ChatSuggestionItem prompt="summarise this" onSelectPrompt={onSelectPrompt}>
        <ItemContent>
          <ItemTitle>Summarise</ItemTitle>
        </ItemContent>
      </ChatSuggestionItem>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Summarise' }));
    expect(onSelectPrompt).toHaveBeenCalledWith('summarise this');
  });

  it('runs the caller onClick before reporting the prompt', () => {
    const calls: string[] = [];
    render(
      <ChatSuggestionItem prompt="p" onClick={() => calls.push('click')} onSelectPrompt={() => calls.push('select')}>
        Pick
      </ChatSuggestionItem>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(calls).toEqual(['click', 'select']);
  });

  it('does not report the prompt when the caller prevents the default', () => {
    const onSelectPrompt = vi.fn();
    render(
      <ChatSuggestionItem prompt="p" onClick={(event) => event.preventDefault()} onSelectPrompt={onSelectPrompt}>
        Pick
      </ChatSuggestionItem>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(onSelectPrompt).not.toHaveBeenCalled();
  });

  it('renders disabled when there is no select handler', () => {
    render(<ChatSuggestionItem prompt="p">Pick</ChatSuggestionItem>);
    expect((screen.getByRole('button', { name: 'Pick' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('stamps its slot and passes the caller props through', () => {
    render(
      <ChatSuggestionItem prompt="p" onSelectPrompt={() => {}} aria-describedby="hint">
        Pick
      </ChatSuggestionItem>,
    );
    const button = screen.getByRole('button', { name: 'Pick' });
    expect(button.getAttribute('data-slot')).toBe('chat-suggestion-item');
    expect(button.getAttribute('aria-describedby')).toBe('hint');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/data-entry/chat-suggestion-item.spec.tsx`
Expected:

```
Error: Failed to resolve import "./chat-suggestion-item" from "registry/bases/base-ui/components/data-entry/chat-suggestion-item.spec.tsx". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

- [ ] **Step 3: Write the component and delete the old one**

Run (from `apps/registry-ui/registry/bases/base-ui`): `git rm -q components/data-entry/chat-empty-state.tsx types/chat-suggestion.ts`

`apps/registry-ui/registry/bases/base-ui/components/data-entry/chat-suggestion-item.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { Item } from '@/registry/bases/base-ui/ui/item';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ChatSuggestionItem - one starter prompt in an empty conversation, an upstream
 * `Item` rendered as a button. Picking it hands `prompt` to `onSelectPrompt`.
 * The consumer composes the item's content and the empty state around it:
 *
 *   <Empty>
 *     <EmptyHeader>
 *       <EmptyMedia variant="icon"><Sparkles /></EmptyMedia>
 *       <EmptyTitle>Start a conversation</EmptyTitle>
 *       <EmptyDescription>Ask anything</EmptyDescription>
 *     </EmptyHeader>
 *     <EmptyContent>
 *       <ItemGroup>
 *         <ChatSuggestionItem prompt="summarise this" onSelectPrompt={send}>
 *           <ItemMedia><FileText /></ItemMedia>
 *           <ItemContent><ItemTitle>Summarise</ItemTitle></ItemContent>
 *         </ChatSuggestionItem>
 *       </ItemGroup>
 *     </EmptyContent>
 *   </Empty>
 */
interface ChatSuggestionItemProps extends ComponentProps<'button'> {
  /** The text handed to `onSelectPrompt` when the item is picked. */
  prompt: string;
  /**
   * Receives `prompt` after the caller's `onClick`, unless that handler
   * called `preventDefault()`. Without it the item renders disabled, a
   * read-only preview, unless `disabled` says otherwise.
   */
  onSelectPrompt?: (prompt: string) => void;
}

function ChatSuggestionItem({
  prompt,
  onSelectPrompt,
  onClick,
  disabled,
  className,
  ...props
}: ChatSuggestionItemProps): ReactNode {
  return (
    <Item
      size="sm"
      render={
        <button
          type="button"
          data-slot="chat-suggestion-item"
          disabled={disabled ?? !onSelectPrompt}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) onSelectPrompt?.(prompt);
          }}
          className={cn(
            'hover:bg-muted w-full cursor-pointer text-left disabled:cursor-default disabled:opacity-60',
            className,
          )}
          {...props}
        />
      }
    />
  );
}

export { ChatSuggestionItem };
export type { ChatSuggestionItemProps };
```

- [ ] **Step 4: Check nothing names the old family**

Run (from `apps/registry-ui`): `git grep -n -e ChatEmptyState -e chat-empty-state -e ChatSuggestion -e types/chat-suggestion -- registry src registry.json | grep -v ChatSuggestionItem`
Expected: nothing.

- [ ] **Step 5: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/chat-suggestion-item.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-chat2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-chat2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-chat2.log" 2>&1; grep 'error TS' "$S/tsc-chat2.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/chat-suggestion-item.tsx registry/bases/base-ui/components/data-entry/chat-suggestion-item.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/chat-suggestion-item.tsx registry/bases/base-ui/components/data-entry/chat-suggestion-item.spec.tsx registry.json 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-chat2.log" 2>&1; tail -1 "$S/sb-chat2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  5 passed (5)
 Test Files  72 passed (72)
      Tests  377 passed (377)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

(376 - 4 old cases + 5 new = 377.)

- [ ] **Step 6: Run the spec's checks on the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F="components/data-entry/chat-suggestion-item.tsx"
grep -lnE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 7: Commit**

`$S/msg-chat2.txt`:

```
refactor(registry-ui): reduce chat-empty-state to chat-suggestion-item

Why: ChatEmptyState re-assembled upstream Empty and Item parts around a
suggestions array whose title and description were content props, so a
caller could not add a badge or reorder the header. The one part it
added, a suggestion button that hands its prompt to the app, stays as
ChatSuggestionItem; the consumer composes the empty state around it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/components/data-entry/chat-suggestion-item.tsx $B/components/data-entry/chat-suggestion-item.spec.tsx
git commit -q -F "$S/msg-chat2.txt" -- $B/components/data-entry $B/types
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 16: ToolCallCard takes its header and sections as parts

Families table row `ToolCallCard`. `ToolCallCardHeader`'s props (`title`, `subtitle`, `icon`, `toolName`, `type`, `statusLabel`, `fallbackLabel`) become the parts `ToolCallCardTrigger`, `ToolCallCardTitle`, `ToolCallCardDescription`, `ToolCallCardStatus`; `ToolCallCardInput` and `ToolCallCardOutput`, which chose a `CodeBlock` for the caller, become `ToolCallCardSection` and `ToolCallCardSectionTitle` around whatever the caller places. The state moves from the header's prop onto the root's `data-state`, and `ToolCallCardStatus` picks its icon from it with `group-data-[state=...]/tool-call-card` selectors; the `STATUS` table of words and icons goes. The `Separator` becomes a border on the content. Nothing outside the family imports it.

**Files:**

- Modify: `components/layout/tool-call-card.tsx` (rewritten), `components/layout/tool-call-card.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the Task 15 tree.
- Produces, from `components/layout/tool-call-card`: `ToolCallCard(props: ToolCallCardProps)` with `interface ToolCallCardProps extends ComponentProps<typeof Collapsible> { state: ToolCallCardState }`; `ToolCallCardTrigger` (`ComponentProps<typeof CollapsibleTrigger>`), `ToolCallCardContent` (`ComponentProps<typeof CollapsibleContent>`), `ToolCallCardTitle`, `ToolCallCardDescription`, `ToolCallCardStatus` (`ComponentProps<'span'>`), `ToolCallCardSection` (`ComponentProps<'div'>`), `ToolCallCardSectionTitle` (`ComponentProps<'h4'>`); `type ToolCallCardState`. Every part returns `ReactNode` and carries `data-slot="tool-call-card-<slot>"`; the root carries `data-state`.
- Removed: `ToolCallCardHeader`, `ToolCallCardHeaderProps`, `ToolCallCardInput`, `ToolCallCardOutput`, `ToolCallCardPart`; the default words `Pending`, `Running`, `Completed`, `Error`, `Parameters`, `Result`, `tool` and the `Wrench` default icon.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/layout/tool-call-card.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Wrench } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ToolCallCard,
  ToolCallCardContent,
  ToolCallCardDescription,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
  ToolCallCardStatus,
  ToolCallCardTitle,
  ToolCallCardTrigger,
  type ToolCallCardState,
} from './tool-call-card';

afterEach(cleanup);

const root = (): HTMLElement => document.querySelector('[data-slot="tool-call-card"]') as HTMLElement;

function Card({ state, defaultOpen }: { state: ToolCallCardState; defaultOpen?: boolean }) {
  return (
    <ToolCallCard state={state} defaultOpen={defaultOpen}>
      <ToolCallCardTrigger>
        <Wrench />
        <ToolCallCardTitle>search</ToolCallCardTitle>
        <ToolCallCardDescription>3 results</ToolCallCardDescription>
        <ToolCallCardStatus>Completed</ToolCallCardStatus>
      </ToolCallCardTrigger>
      <ToolCallCardContent>
        <ToolCallCardSection>
          <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
          <pre>{'{ "q": "hi" }'}</pre>
        </ToolCallCardSection>
      </ToolCallCardContent>
    </ToolCallCard>
  );
}

describe('ToolCallCard', () => {
  it.each<ToolCallCardState>(['input-streaming', 'input-available', 'output-available', 'output-error'])(
    'reflects the %s state on the root',
    (state) => {
      render(<Card state={state} />);
      expect(root().getAttribute('data-state')).toBe(state);
    },
  );

  it('renders the header parts inside the trigger', () => {
    render(<Card state="output-available" />);
    const trigger = screen.getByRole('button');
    expect(trigger.getAttribute('data-slot')).toBe('tool-call-card-trigger');
    for (const [text, slot] of [
      ['search', 'tool-call-card-title'],
      ['3 results', 'tool-call-card-description'],
      ['Completed', 'tool-call-card-status'],
    ]) {
      const node = screen.getByText(text).closest('[data-slot^="tool-call-card-"]');
      expect(node?.getAttribute('data-slot')).toBe(slot);
      expect(trigger.contains(node)).toBe(true);
    }
  });

  it('opens its sections from the trigger', () => {
    render(<Card state="output-available" />);
    expect(screen.queryByText('Parameters')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Parameters').getAttribute('data-slot')).toBe('tool-call-card-section-title');
    expect(screen.getByText('Parameters').closest('[data-slot="tool-call-card-section"]')).toBeTruthy();
  });

  it('runs the caller onClick on the trigger and still toggles', () => {
    let clicks = 0;
    render(
      <ToolCallCard state="input-available">
        <ToolCallCardTrigger onClick={() => (clicks += 1)}>
          <ToolCallCardTitle>search</ToolCallCardTitle>
        </ToolCallCardTrigger>
        <ToolCallCardContent>body</ToolCallCardContent>
      </ToolCallCard>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(clicks).toBe(1);
    expect(screen.getByText('body')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/layout/tool-call-card.spec.tsx`
Expected:

```
     × reflects the input-streaming state on the root
     × reflects the input-available state on the root
     × reflects the output-available state on the root
     × reflects the output-error state on the root
     × renders the header parts inside the trigger
     × opens its sections from the trigger
     × runs the caller onClick on the trigger and still toggles
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
 Test Files  1 failed (1)
      Tests  7 failed (7)
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/layout/tool-call-card.tsx`:

```text
import { CheckCircle2, ChevronDown, Circle, Clock, XCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ToolCallCard - one tool invocation in a chat transcript: a trigger row over
 * collapsible sections. The host maps its dispatcher lifecycle onto `state`
 * (pending, running, completed, error), which the root carries as
 * `data-state`; `ToolCallCardStatus` picks its icon from it. Every word is the
 * consumer's:
 *
 *   <ToolCallCard state="output-available">
 *     <ToolCallCardTrigger>
 *       <Wrench />
 *       <ToolCallCardTitle>search</ToolCallCardTitle>
 *       <ToolCallCardDescription>3 results</ToolCallCardDescription>
 *       <ToolCallCardStatus>Completed</ToolCallCardStatus>
 *     </ToolCallCardTrigger>
 *     <ToolCallCardContent>
 *       <ToolCallCardSection>
 *         <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
 *         <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
 *       </ToolCallCardSection>
 *     </ToolCallCardContent>
 *   </ToolCallCard>
 */
type ToolCallCardState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

interface ToolCallCardProps extends ComponentProps<typeof Collapsible> {
  /** Where the call is in its lifecycle; set on the root as `data-state`. */
  state: ToolCallCardState;
}

function ToolCallCard({ state, className, ...props }: ToolCallCardProps): ReactNode {
  return (
    <Collapsible
      data-slot="tool-call-card"
      data-state={state}
      className={cn('group/tool-call-card bg-muted w-full overflow-hidden rounded-md', className)}
      {...props}
    />
  );
}

/** The header row that toggles the sections; a leading svg child is sized and muted as the tool's icon. */
function ToolCallCardTrigger({ className, children, ...props }: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  return (
    <CollapsibleTrigger
      data-slot="tool-call-card-trigger"
      className={cn(
        'group/tool-call-card-trigger [&>svg:first-child]:text-muted-foreground flex w-full items-center gap-2 px-3 py-2 text-left [&>svg:first-child]:size-3.5 [&>svg:first-child]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="text-muted-foreground size-4 shrink-0 transition-transform group-aria-expanded/tool-call-card-trigger:rotate-180"
      />
    </CollapsibleTrigger>
  );
}

function ToolCallCardTitle({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="tool-call-card-title" className={cn('shrink-0 text-sm font-medium', className)} {...props} />;
}

/** A one-line summary of the call, truncated to the row. */
function ToolCallCardDescription({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="tool-call-card-description"
      className={cn('text-muted-foreground min-w-0 flex-1 truncate text-xs', className)}
      {...props}
    />
  );
}

/** The status badge: its children are the word, its icon follows the root's `data-state`. */
function ToolCallCardStatus({ className, children, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <Badge
      variant="secondary"
      render={<span data-slot="tool-call-card-status" />}
      className={cn('ml-auto rounded-full', className)}
      {...props}
    >
      <Circle aria-hidden className="hidden group-data-[state=input-streaming]/tool-call-card:block" />
      <Clock aria-hidden className="hidden animate-pulse group-data-[state=input-available]/tool-call-card:block" />
      <CheckCircle2
        aria-hidden
        className="text-success hidden group-data-[state=output-available]/tool-call-card:block"
      />
      <XCircle aria-hidden className="text-destructive hidden group-data-[state=output-error]/tool-call-card:block" />
      {children}
    </Badge>
  );
}

function ToolCallCardContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent
      data-slot="tool-call-card-content"
      className={cn('text-popover-foreground flex flex-col gap-3 border-t p-3', className)}
      {...props}
    />
  );
}

/** One labelled block of the call, such as its parameters, its result or its error. */
function ToolCallCardSection({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="tool-call-card-section" className={cn('flex min-w-0 flex-col gap-1.5', className)} {...props} />
  );
}

function ToolCallCardSectionTitle({ className, ...props }: ComponentProps<'h4'>): ReactNode {
  return (
    <h4
      data-slot="tool-call-card-section-title"
      className={cn('text-muted-foreground text-xs font-medium', className)}
      {...props}
    />
  );
}

export {
  ToolCallCard,
  ToolCallCardTrigger,
  ToolCallCardTitle,
  ToolCallCardDescription,
  ToolCallCardStatus,
  ToolCallCardContent,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
};
export type { ToolCallCardState, ToolCallCardProps };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/tool-call-card.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-chat3.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-chat3.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-chat3.log" 2>&1; grep 'error TS' "$S/tsc-chat3.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/tool-call-card.tsx registry/bases/base-ui/components/layout/tool-call-card.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/layout/tool-call-card.tsx registry/bases/base-ui/components/layout/tool-call-card.spec.tsx registry.json 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-chat3.log" 2>&1; tail -1 "$S/sb-chat3.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  7 passed (7)
 Test Files  72 passed (72)
      Tests  370 passed (370)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

(377 - 14 old cases + 7 new = 370.)

- [ ] **Step 5: Run the spec's checks on the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F="components/layout/tool-call-card.tsx"
grep -lnE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 6: Commit**

`$S/msg-chat3.txt`:

```
refactor(registry-ui): give tool-call-card header and section parts

Why: ToolCallCardHeader took its title, subtitle, icon and status word as
props with English defaults, and ToolCallCardInput and ToolCallCardOutput
decided that every payload renders as a JSON CodeBlock. The header row
and the sections are now parts the caller fills, and the lifecycle state
sits on the root's data-state, where the status part reads its icon.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-chat3.txt" -- $B/components/layout/tool-call-card.tsx $B/components/layout/tool-call-card.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 17: ReasoningCollapsible takes its label and body as children

Families table row `ReasoningCollapsible`. The root keeps the stream timing (auto-open, auto-close once, the elapsed seconds) and now carries `data-streaming`; the trigger's label pulses off it through `group-data-streaming/reasoning-collapsible` instead of a prop computed in the trigger. The English copy ("Thinking...", "Thought for N seconds") leaves the component: the trigger's children are the label, worded by the consumer from `useReasoningCollapsible()`. `ReasoningCollapsibleContent` takes any node, so the consumer places `MarkdownView`; the component stops importing it. The chevron turns off the trigger's own `aria-expanded`, as `CollapsibleCardTrigger` already does, so the trigger reads no context. The root spreads the rest of `Collapsible`'s props and composes the caller's `onOpenChange` after its own. Nothing outside the family imports it.

**Files:**

- Modify: `components/layout/reasoning-collapsible.tsx` (rewritten), `components/layout/reasoning-collapsible.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the Task 16 tree.
- Produces, from `components/layout/reasoning-collapsible`: `ReasoningCollapsible(props: ReasoningCollapsibleProps)` with `interface ReasoningCollapsibleProps extends Omit<ComponentProps<typeof Collapsible>, 'open' | 'defaultOpen'> { streaming?: boolean; defaultOpen?: boolean }`; `ReasoningCollapsibleTrigger` (`ComponentProps<typeof CollapsibleTrigger>`), `ReasoningCollapsibleContent` (`ComponentProps<typeof CollapsibleContent>`); `useReasoningCollapsible(): { streaming: boolean; isOpen: boolean; duration: number | undefined }` (unchanged). Slots `reasoning-collapsible`, `-trigger`, `-content`; the root carries `data-streaming` while streaming.
- Removed: `ReasoningCollapsibleContent`'s `children: string` and its `MarkdownView`; the trigger's default label.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/layout/reasoning-collapsible.spec.tsx`:

```text
import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
  useReasoningCollapsible,
} from './reasoning-collapsible';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const root = (): HTMLElement => document.querySelector('[data-slot="reasoning-collapsible"]') as HTMLElement;

function Label(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking' : `Thought for ${duration ?? '?'}s`;
}

function Reasoning({ streaming, defaultOpen }: { streaming?: boolean; defaultOpen?: boolean }): ReactNode {
  return (
    <ReasoningCollapsible streaming={streaming} defaultOpen={defaultOpen}>
      <ReasoningCollapsibleTrigger>
        <Label />
      </ReasoningCollapsibleTrigger>
      <ReasoningCollapsibleContent>
        <strong>bold</strong> thought
      </ReasoningCollapsibleContent>
    </ReasoningCollapsible>
  );
}

describe('ReasoningCollapsible', () => {
  it('marks the root only while the reasoning is streaming', () => {
    const { rerender } = render(<Reasoning streaming />);
    expect(root().hasAttribute('data-streaming')).toBe(true);

    rerender(<Reasoning streaming={false} />);
    expect(root().hasAttribute('data-streaming')).toBe(false);
  });

  it('renders the node it is given as content while open', () => {
    render(<Reasoning defaultOpen />);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('bold').closest('[data-slot="reasoning-collapsible-content"]')).toBeTruthy();
  });

  it('renders the consumer label inside the trigger', () => {
    render(<Reasoning streaming />);
    expect(screen.getByRole('button').textContent).toBe('Thinking');
    expect(screen.getByRole('button').getAttribute('data-slot')).toBe('reasoning-collapsible-trigger');
  });

  it('opens while streaming, reports the elapsed seconds and closes after the stream ends', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { rerender } = render(<Reasoning streaming />);
    expect(screen.getByText('bold')).toBeTruthy();

    vi.setSystemTime(2500);
    rerender(<Reasoning streaming={false} />);
    expect(screen.getByRole('button').textContent).toBe('Thought for 3s');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });

  it('throws when the hook is used outside <ReasoningCollapsible>', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Label />)).toThrow(/must be used within <ReasoningCollapsible>/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/layout/reasoning-collapsible.spec.tsx`
Expected (the old content hands the node to `MarkdownView`, which accepts only a string, so every case that renders the content throws; the hook case already passes):

```
     × marks the root only while the reasoning is streaming
     × renders the node it is given as content while open
     × renders the consumer label inside the trigger
     × opens while streaming, reports the elapsed seconds and closes after the stream ends
     ✓ throws when the hook is used outside <ReasoningCollapsible>
Assertion: Unexpected value `[object Object], thought` for `children` prop, expected `string`
 Test Files  1 failed (1)
      Tests  4 failed | 1 passed (5)
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/layout/reasoning-collapsible.tsx`:

```text
import { Brain, ChevronDown } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ReasoningCollapsible - a thinking / reasoning disclosure. It opens while
 * `streaming` is true, closes itself once about a second after the stream
 * ends, and carries `data-streaming` on the root meanwhile. The label and the
 * body are the consumer's; `useReasoningCollapsible` hands the label its
 * timing:
 *
 *   function ReasoningLabel() {
 *     const { streaming, duration } = useReasoningCollapsible();
 *     return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
 *   }
 *
 *   <ReasoningCollapsible streaming={isLive}>
 *     <ReasoningCollapsibleTrigger><ReasoningLabel /></ReasoningCollapsibleTrigger>
 *     <ReasoningCollapsibleContent><MarkdownView codeBlocks>{text}</MarkdownView></ReasoningCollapsibleContent>
 *   </ReasoningCollapsible>
 */
const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningCollapsibleContextValue {
  streaming: boolean;
  isOpen: boolean;
  /** Whole seconds the last stream lasted, rounded up; undefined until a stream has ended. */
  duration: number | undefined;
}

const ReasoningCollapsibleContext = createContext<ReasoningCollapsibleContextValue | null>(null);

/**
 * Read the live reasoning state (`streaming`, `isOpen`, `duration`) from inside a
 * `<ReasoningCollapsible>`, for example to word the trigger's label. Throws when
 * used outside `<ReasoningCollapsible>`.
 */
function useReasoningCollapsible(): ReasoningCollapsibleContextValue {
  const ctx = useContext(ReasoningCollapsibleContext);
  if (!ctx) throw new Error('ReasoningCollapsible parts must be used within <ReasoningCollapsible>');
  return ctx;
}

interface ReasoningCollapsibleProps extends Omit<ComponentProps<typeof Collapsible>, 'open' | 'defaultOpen'> {
  streaming?: boolean;
  /** The initial open state; defaults to `streaming`. `false` also keeps a stream from opening it. */
  defaultOpen?: boolean;
}

function ReasoningCollapsible({
  streaming = false,
  defaultOpen,
  onOpenChange,
  className,
  ...props
}: ReasoningCollapsibleProps): ReactNode {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? streaming);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const startRef = useRef<number | null>(null);
  const everStreamedRef = useRef(streaming);
  const autoClosedRef = useRef(false);

  useEffect(() => {
    if (streaming) {
      everStreamedRef.current = true;
      if (startRef.current === null) startRef.current = Date.now();
    } else if (startRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startRef.current) / MS_IN_S));
      startRef.current = null;
    }
  }, [streaming]);

  useEffect(() => {
    if (streaming && !isOpen && defaultOpen !== false) setIsOpen(true);
  }, [streaming, isOpen, defaultOpen]);

  // Closes once only, so a reader who reopens old reasoning keeps it open.
  useEffect(() => {
    if (everStreamedRef.current && !streaming && isOpen && !autoClosedRef.current) {
      const t = setTimeout(() => {
        setIsOpen(false);
        autoClosedRef.current = true;
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [streaming, isOpen]);

  return (
    <ReasoningCollapsibleContext.Provider value={{ streaming, isOpen, duration }}>
      <Collapsible
        data-slot="reasoning-collapsible"
        data-streaming={streaming ? '' : undefined}
        open={isOpen}
        onOpenChange={(open, eventDetails) => {
          setIsOpen(open);
          onOpenChange?.(open, eventDetails);
        }}
        className={cn('group/reasoning-collapsible', className)}
        {...props}
      />
    </ReasoningCollapsibleContext.Provider>
  );
}

/** The toggle row; its children are the label, which pulses while the root is streaming. */
function ReasoningCollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  return (
    <CollapsibleTrigger
      data-slot="reasoning-collapsible-trigger"
      className={cn(
        'group/reasoning-collapsible-trigger text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm transition-colors',
        className,
      )}
      {...props}
    >
      <Brain aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left group-data-streaming/reasoning-collapsible:animate-pulse">
        {children}
      </span>
      <ChevronDown
        aria-hidden
        className="size-4 shrink-0 transition-transform group-aria-expanded/reasoning-collapsible-trigger:rotate-180"
      />
    </CollapsibleTrigger>
  );
}

function ReasoningCollapsibleContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent
      data-slot="reasoning-collapsible-content"
      className={cn('text-muted-foreground mt-2 text-sm', className)}
      {...props}
    />
  );
}

export { useReasoningCollapsible, ReasoningCollapsible, ReasoningCollapsibleTrigger, ReasoningCollapsibleContent };
export type { ReasoningCollapsibleProps };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/reasoning-collapsible.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-chat4.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-chat4.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-chat4.log" 2>&1; grep 'error TS' "$S/tsc-chat4.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/reasoning-collapsible.tsx registry/bases/base-ui/components/layout/reasoning-collapsible.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/layout/reasoning-collapsible.tsx registry/bases/base-ui/components/layout/reasoning-collapsible.spec.tsx registry.json 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-chat4.log" 2>&1; tail -1 "$S/sb-chat4.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  5 passed (5)
 Test Files  72 passed (72)
      Tests  371 passed (371)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

(370 - 4 old cases + 5 new = 371.)

- [ ] **Step 5: Run the spec's checks on the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F="components/layout/reasoning-collapsible.tsx"
grep -lnE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 6: Commit**

`$S/msg-chat4.txt`:

```
refactor(registry-ui): let reasoning-collapsible take its label and body

Why: the trigger printed English copy the caller could only replace
wholesale, and the content accepted nothing but a markdown string it
rendered itself. The label and the body are now children, the timing
stays in the root for the label to read through the hook, and the root
carries data-streaming for the pulse.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-chat4.txt" -- $B/components/layout/reasoning-collapsible.tsx $B/components/layout/reasoning-collapsible.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 18: PermissionCard's status reads the root, and upstream takes the description

Families table row `PermissionCard`. `PermissionCardStatus` stops taking a `status` prop that repeated the root's: it renders the three icons and shows the one the root's `data-status` names, through the same `group-data-[status=...]/permission-card` selectors `Actions` and `Resolved` already use; its word is its children, so the `STATUS` table goes. `PermissionCardDescription` only restated upstream `CardDescription` and goes in its favour; `PermissionCardPreview` was a `min-w-0` div and goes, the consumer placing `CodeBlock` directly. Nothing outside the family imports it.

**Files:**

- Modify: `components/feedback/permission-card.tsx` (rewritten), `components/feedback/permission-card.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the Task 17 tree.
- Produces, from `components/feedback/permission-card`: `PermissionCard(props: PermissionCardProps)` with `interface PermissionCardProps extends ComponentProps<'div'> { status: PermissionCardStatusValue }`; `PermissionCardHeader`, `PermissionCardTitle`, `PermissionCardActions`, `PermissionCardResolved` (`ComponentProps<'div'>`), `PermissionCardStatus` (`ComponentProps<'span'>`); `type PermissionCardStatusValue`. The root carries `data-status`.
- Removed: `PermissionCardStatus`'s `status` prop and its default words; `PermissionCardDescription` (use `CardDescription` from `ui/card`); `PermissionCardPreview`.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/feedback/permission-card.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardHeader,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from './permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import { CardDescription } from '@/registry/bases/base-ui/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

const root = () => document.querySelector('[data-slot="permission-card"]') as HTMLElement;

describe('PermissionCard', () => {
  it('reflects status on the root for selector-driven coordination', () => {
    const { rerender } = render(
      <PermissionCard status="pending">
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
      </PermissionCard>,
    );
    expect(root().getAttribute('data-status')).toBe('pending');

    rerender(
      <PermissionCard status="approved">
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
      </PermissionCard>,
    );
    expect(root().getAttribute('data-status')).toBe('approved');
  });

  it('renders the consumer status word, with the icon the root status picks', () => {
    render(
      <PermissionCard status="denied">
        <PermissionCardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
          <PermissionCardStatus>Denied</PermissionCardStatus>
        </PermissionCardHeader>
      </PermissionCard>,
    );
    const status = screen.getByText('Denied');
    expect(status.getAttribute('data-slot')).toBe('permission-card-status');
    expect(status.querySelectorAll('svg')).toHaveLength(3);
  });

  it('composes the upstream card description under the header', () => {
    render(
      <PermissionCard status="pending">
        <PermissionCardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        </PermissionCardHeader>
        <CardDescription>Deploy the web app to production</CardDescription>
      </PermissionCard>,
    );
    expect(screen.getByText('Deploy the web app to production').getAttribute('data-slot')).toBe('card-description');
  });

  it('renders an asymmetric row: a plain Deny plus a graduated-scope split Allow', () => {
    render(
      <PermissionCard status="pending">
        <PermissionCardActions>
          <Button variant="ghost">Deny</Button>
          <ButtonGroup>
            <Button>Allow once</Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="icon" aria-label="More allow options" />} />
              <DropdownMenuContent align="end" className="w-auto">
                <DropdownMenuItem>Allow this session</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </PermissionCardActions>
      </PermissionCard>,
    );

    // Deny (1) + Allow action (1) + caret (1) = 3; Deny is a single button, the
    // caret rides the Allow side only.
    expect(screen.getAllByRole('button')).toHaveLength(3);
    screen.getByRole('button', { name: 'Deny' });
    screen.getByRole('button', { name: 'More allow options' });
  });

  it('persists a resolved outcome once the request is decided', () => {
    render(
      <PermissionCard status="approved">
        <PermissionCardResolved>Allowed once - 2:14pm</PermissionCardResolved>
      </PermissionCard>,
    );
    screen.getByText(/Allowed once/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/components/feedback/permission-card.spec.tsx`
Expected:

```
     ✓ reflects status on the root for selector-driven coordination
     × renders the consumer status word, with the icon the root status picks
     ✓ composes the upstream card description under the header
     ✓ renders an asymmetric row: a plain Deny plus a graduated-scope split Allow
     ✓ persists a resolved outcome once the request is decided
TypeError: Cannot read properties of undefined (reading 'icon')
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

- [ ] **Step 3: Rewrite the component**

`apps/registry-ui/registry/bases/base-ui/components/feedback/permission-card.tsx`:

```text
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** The lifecycle of a consent request - host-driven, like `ToolCallCard`'s state. */
type PermissionCardStatusValue = 'pending' | 'approved' | 'denied';

/**
 * PermissionCard - an inline, non-modal AI-consent request inside a chat
 * message, which stays in scrollback after it resolves. The host owns
 * `status`; the root carries it as `data-status`, and the parts show, hide
 * and pick their icon from it. Every word is the consumer's:
 *
 *   <PermissionCard status={status}>
 *     <PermissionCardHeader>
 *       <Wrench className="text-muted-foreground size-3.5" />
 *       <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
 *       <PermissionCardStatus>{statusWord}</PermissionCardStatus>
 *     </PermissionCardHeader>
 *     <CardDescription>Deploy the web app to production</CardDescription>
 *     <CodeBlock code={command} language="bash" />
 *     <PermissionCardActions>
 *       <Button variant="ghost" onClick={deny}>Deny</Button>
 *       <ButtonGroup>...Allow once + scopes...</ButtonGroup>
 *     </PermissionCardActions>
 *     <PermissionCardResolved><CheckCircle2 className="text-success" /> Allowed once - 2:14pm</PermissionCardResolved>
 *   </PermissionCard>
 *
 * The decision row is asymmetric on purpose: a plain `Deny` and a
 * graduated-scope `Allow`. For a risky operation the consumer gives `Deny`
 * the emphasised button variant.
 */
interface PermissionCardProps extends ComponentProps<'div'> {
  status: PermissionCardStatusValue;
}

function PermissionCard({ status, className, ...props }: PermissionCardProps): ReactNode {
  return (
    <div
      data-slot="permission-card"
      data-status={status}
      className={cn('group/permission-card flex w-full flex-col gap-3', className)}
      {...props}
    />
  );
}

/** The top row: a leading glyph, the title and the status. */
function PermissionCardHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="permission-card-header" className={cn('flex items-center gap-2', className)} {...props} />;
}

/** What the assistant asks to do, on one truncated line. */
function PermissionCardTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="permission-card-title"
      className={cn('min-w-0 flex-1 truncate text-sm font-medium', className)}
      {...props}
    />
  );
}

/** An understated status cue: its children are the word, its icon follows the root's `data-status`. */
function PermissionCardStatus({ className, children, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="permission-card-status"
      className={cn(
        'text-muted-foreground ml-auto inline-flex shrink-0 items-center gap-1 text-xs [&_svg]:size-3.5',
        className,
      )}
      {...props}
    >
      <Circle aria-hidden className="hidden group-data-[status=pending]/permission-card:block" />
      <CheckCircle2 aria-hidden className="text-success hidden group-data-[status=approved]/permission-card:block" />
      <XCircle aria-hidden className="text-destructive hidden group-data-[status=denied]/permission-card:block" />
      {children}
    </span>
  );
}

/** The decision row, shown only while the request is `pending`. */
function PermissionCardActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="permission-card-actions"
      className={cn(
        'hidden items-center justify-end gap-2 group-data-[status=pending]/permission-card:flex',
        className,
      )}
      {...props}
    />
  );
}

/** The persisted outcome, shown once the request is `approved` or `denied`. */
function PermissionCardResolved({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="permission-card-resolved"
      className={cn(
        'text-muted-foreground hidden items-center gap-1.5 text-xs group-data-[status=approved]/permission-card:flex group-data-[status=denied]/permission-card:flex',
        className,
      )}
      {...props}
    />
  );
}

export {
  PermissionCard,
  PermissionCardHeader,
  PermissionCardTitle,
  PermissionCardStatus,
  PermissionCardActions,
  PermissionCardResolved,
};
export type { PermissionCardStatusValue, PermissionCardProps };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/feedback/permission-card.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-chat5.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-chat5.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-chat5.log" 2>&1; grep 'error TS' "$S/tsc-chat5.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/feedback/permission-card.tsx registry/bases/base-ui/components/feedback/permission-card.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/feedback/permission-card.tsx registry/bases/base-ui/components/feedback/permission-card.spec.tsx registry.json 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-chat5.log" 2>&1; tail -1 "$S/sb-chat5.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  5 passed (5)
 Test Files  72 passed (72)
      Tests  372 passed (372)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

(371 - 4 old cases + 5 new = 372.)

- [ ] **Step 5: Run the spec's checks on the family**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
F="components/feedback/permission-card.tsx"
grep -lnE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $F
```

Expected: nothing at all.

- [ ] **Step 6: Commit**

`$S/msg-chat5.txt`:

```
refactor(registry-ui): read permission-card status from its root

Why: PermissionCardStatus took the same status the root already held, so
a caller could pass two that disagreed, and it baked in English words.
It now shows the icon the root's data-status names and takes its word
as children. Description only restated upstream CardDescription and
Preview was an empty wrapper, so both go.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-chat5.txt" -- $B/components/feedback/permission-card.tsx $B/components/feedback/permission-card.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

## Data-entry families

Six tasks, one commit each, run in order on top of plan B Task 1 (the extraction, `b1`). Every path below is
relative to the repo root unless it starts with `registry/` (then it is under `apps/registry-ui/`). `$S` is the
scratch directory the plan's Global Constraints name. Specs run in jsdom through `@testing-library/react`'s
`fireEvent`, as every existing spec in this app does.

Counts before Task 19 (master `a81125a` + b1): `Test Files  72 passed (72)`, `Tests  379 passed (379)`, one tsc
error (the baseline TS6307), 22 registry items.

### Task 19: Split LanguageSwitcher into LanguageCombobox and LanguageToggleGroup

`LanguageSwitcher` chose among three display forms with a `form` prop and rendered every visible part itself
through a `trigger` render prop and string props (`placeholder`, `emptyText`). The dropdown and icon forms were
one `Combobox` differing only by the trigger, so they become one root, `LanguageCombobox`, whose trigger and
popup the consumer composes from upstream's `Combobox*` parts (upstream's "Combobox in Popup" example); the
segmented form becomes `LanguageToggleGroup`, whose items the consumer composes from `ToggleGroupItem`.
`useLanguageOptions` becomes the shared hook (`LanguageCombobox` calls it, and a `LanguageToggleGroup` consumer
maps it); the alias lookup `findCurrent` moves to `lib/language-options` as `findLanguageOption`. The new specs
type-check, so nothing needs the old spec's `@ts-expect-error`. The one importer, the editor's code block, is
rewritten onto the new root.

**Files:**

- Create: `registry/bases/base-ui/components/data-entry/language-combobox.tsx` + `.spec.tsx`,
  `registry/bases/base-ui/components/data-entry/language-toggle-group.tsx` + `.spec.tsx`,
  `registry/bases/base-ui/hooks/use-language-options.ts` + `.spec.ts`
- Delete: `registry/bases/base-ui/components/data-entry/language-switcher.tsx` + `.spec.tsx`
- Modify: `registry/bases/base-ui/types/language-option.ts`, `registry/bases/base-ui/lib/language-options.tsx` +
  `.spec.tsx`, `registry/bases/base-ui/editor/document/features/code-block/code-block.tsx`,
  `registry/bases/base-ui/editor/mermaid/react/toolbar.tsx` (a doc comment naming the old component)

**Interfaces:**

- Consumes: `lib/language-options` (`canonicalCodeId`, `codeLanguageOptions`, `localeOptions`) and
  `types/language-option` from b1; `ui/combobox`, `ui/toggle-group`.
- Produces:
  - `types/language-option`: `interface LanguageOptionSource { kind?: LanguageKind; options?: LanguageOption[]; locales?: readonly string[] }`
  - `lib/language-options`: `findLanguageOption(options: readonly LanguageOption[], value: string, kind: LanguageKind): LanguageOption | undefined`
  - `hooks/use-language-options`: `useLanguageOptions(source: LanguageOptionSource & { value: string }): LanguageOption[]`
  - `components/data-entry/language-combobox`: `LanguageCombobox`, `type LanguageComboboxProps` (= `LanguageOptionSource` +
    `Combobox.Root` props minus `items`/`value`/`defaultValue`/`onValueChange`/`multiple`/`itemToStringLabel`/`isItemEqualToValue`,
    - `value: string`, `onValueChange: (value: string) => void`)
  - `components/data-entry/language-toggle-group`: `LanguageToggleGroup`, `type LanguageToggleGroupProps` (= `ToggleGroup` props
    minus `value`/`defaultValue`/`onValueChange`/`multiple`, + `value: string`, `onValueChange: (value: string) => void`)
- Removed: `LanguageSwitcher`, `LanguageSwitcherProps`, `LanguageSwitcherBaseProps`, and its `form`, `searchable`,
  `placeholder`, `emptyText` props (the consumer composes `ComboboxInput`, `ComboboxEmpty` and the trigger).

- [ ] **Step 1: Write the failing specs**

In `apps/registry-ui/registry/bases/base-ui/lib/language-options.spec.tsx` replace:

```text
import { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, localeOptions } from './language-options';
```

with:

```text
import {
  canonicalCodeId,
  codeLanguageIcon,
  codeLanguageOptions,
  findLanguageOption,
  localeOptions,
} from './language-options';
```

In `apps/registry-ui/registry/bases/base-ui/lib/language-options.spec.tsx` replace:

```text
  it('falls back to the raw code when it is not a valid language tag', () => {
    expect(localeOptions(['not a tag'])).toEqual([{ value: 'not a tag', label: 'not a tag' }]);
  });
});
```

with:

```text
  it('falls back to the raw code when it is not a valid language tag', () => {
    expect(localeOptions(['not a tag'])).toEqual([{ value: 'not a tag', label: 'not a tag' }]);
  });
});

describe('findLanguageOption', () => {
  const options = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
  ];

  it('finds the option carrying the value', () => {
    expect(findLanguageOption(options, 'python', 'code')).toBe(options[1]);
  });

  it('finds a code option through its alias', () => {
    expect(findLanguageOption(options, 'ts', 'code')).toBe(options[0]);
  });

  it('does not alias a locale value, which comes back as a bare option', () => {
    expect(findLanguageOption(options, 'ts', 'locale')).toEqual({ value: 'ts', label: 'ts' });
  });

  it('returns undefined for an empty value', () => {
    expect(findLanguageOption(options, '', 'code')).toBeUndefined();
  });
});
```

`apps/registry-ui/registry/bases/base-ui/hooks/use-language-options.spec.ts`:

```text
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { codeLanguageOptions } from '@/registry/bases/base-ui/lib/language-options';

import { useLanguageOptions } from './use-language-options';

describe('useLanguageOptions', () => {
  it('returns explicit options over the kind data', () => {
    const options = [{ value: 'x', label: 'Custom X' }];
    const { result } = renderHook(() => useLanguageOptions({ kind: 'code', options, value: 'x' }));
    expect(result.current).toBe(options);
  });

  it('offers the code-language set for kind="code"', () => {
    const { result } = renderHook(() => useLanguageOptions({ kind: 'code', value: 'typescript' }));
    expect(result.current).toBe(codeLanguageOptions());
  });

  it('offers the given locales for the default kind', () => {
    const { result } = renderHook(() => useLanguageOptions({ locales: ['en', 'vi'], value: 'en' }));
    expect(result.current.map((o) => o.value)).toEqual(['en', 'vi']);
  });

  it('offers only the current value when no locales are given, and nothing for an empty value', () => {
    const { result, rerender } = renderHook(({ value }) => useLanguageOptions({ value }), {
      initialProps: { value: 'en' },
    });
    expect(result.current.map((o) => o.value)).toEqual(['en']);
    rerender({ value: '' });
    expect(result.current).toEqual([]);
  });
});
```

`apps/registry-ui/registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/registry/bases/base-ui/ui/combobox';
import type { LanguageOption } from '@/registry/bases/base-ui/types/language-option';

import { LanguageCombobox, type LanguageComboboxProps } from './language-combobox';

// jsdom lacks the layout and pointer APIs Base UI's Combobox reaches for on open.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function renderCombobox(props: Omit<LanguageComboboxProps, 'children'>) {
  return render(
    <LanguageCombobox {...props}>
      <ComboboxTrigger render={<Button variant="outline" size="sm" />} aria-label="Select language">
        <ComboboxValue>
          {(option: LanguageOption | null) => (
            <>
              {option?.icon}
              <span>{option?.label ?? 'Select'}</span>
            </>
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(option: LanguageOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon}
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </LanguageCombobox>,
  );
}

function trigger(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Select language' });
}

describe('LanguageCombobox', () => {
  it('shows the current code language in the trigger the consumer composed', () => {
    renderCombobox({ kind: 'code', value: 'typescript', onValueChange: vi.fn() });
    expect(trigger().textContent).toContain('TypeScript');
  });

  it('resolves a code alias for display (ts -> TypeScript)', () => {
    renderCombobox({ kind: 'code', value: 'ts', onValueChange: vi.fn() });
    expect(trigger().textContent).toContain('TypeScript');
  });

  it('labels a locale value with its native name when no locales are given', () => {
    renderCombobox({ value: 'en', onValueChange: vi.fn() });
    expect(trigger().textContent).toContain('English');
  });

  it('reports the picked option as its value string', () => {
    const onValueChange = vi.fn();
    renderCombobox({ kind: 'code', value: 'typescript', onValueChange });
    fireEvent.click(trigger());
    const python = screen.getAllByText('Python')[0].closest('[data-slot="combobox-item"]');
    expect(python).not.toBeNull();
    fireEvent.click(python!);
    expect(onValueChange).toHaveBeenCalledWith('python');
  });

  it('lets explicit options replace the kind data', () => {
    renderCombobox({ kind: 'code', value: 'x', onValueChange: vi.fn(), options: [{ value: 'x', label: 'Custom X' }] });
    fireEvent.click(trigger());
    expect(document.querySelectorAll('[data-slot="combobox-item"]')).toHaveLength(1);
    expect(screen.queryByText('TypeScript')).toBeNull();
  });
});
```

`apps/registry-ui/registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';

import { LanguageToggleGroup } from './language-toggle-group';

// jsdom lacks the ResizeObserver and animation APIs Base UI's ToggleGroup reaches for.
beforeAll(() => {
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function renderGroup(onValueChange = vi.fn()) {
  return render(
    <LanguageToggleGroup value="en" onValueChange={onValueChange} aria-label="Language">
      <ToggleGroupItem value="en">English</ToggleGroupItem>
      <ToggleGroupItem value="vi">Tiếng Việt</ToggleGroupItem>
    </LanguageToggleGroup>,
  );
}

describe('LanguageToggleGroup', () => {
  it('presses the item carrying the current value', () => {
    renderGroup();
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Tiếng Việt' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports a newly pressed item as its value string', () => {
    const onValueChange = vi.fn();
    renderGroup(onValueChange);
    fireEvent.click(screen.getByRole('button', { name: 'Tiếng Việt' }));
    expect(onValueChange).toHaveBeenCalledWith('vi');
  });

  it('does not deselect: pressing the current item reports nothing', () => {
    const onValueChange = vi.fn();
    renderGroup(onValueChange);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('stamps its data-slot and passes the group props through', () => {
    renderGroup();
    const group = screen.getByRole('group', { name: 'Language' });
    expect(group.getAttribute('data-slot')).toBe('language-toggle-group');
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/lib/language-options.spec.tsx registry/bases/base-ui/hooks/use-language-options.spec.ts registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error|Test Files|^ +Tests '
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/hooks/use-language-options.spec.ts [ registry/bases/base-ui/hooks/use-language-options.spec.ts ]
Error: Failed to resolve import "./use-language-options" from "registry/bases/base-ui/hooks/use-language-options.spec.ts". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx [ registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx ]
Error: Failed to resolve import "./language-combobox" from "registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx [ registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx ]
Error: Failed to resolve import "./language-toggle-group" from "registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/language-options.spec.tsx > findLanguageOption > finds the option carrying the value
TypeError: findLanguageOption is not a function
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/language-options.spec.tsx > findLanguageOption > finds a code option through its alias
TypeError: findLanguageOption is not a function
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/language-options.spec.tsx > findLanguageOption > does not alias a locale value, which comes back as a bare option
TypeError: findLanguageOption is not a function
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/lib/language-options.spec.tsx > findLanguageOption > returns undefined for an empty value
TypeError: findLanguageOption is not a function
 Test Files  4 failed (4)
      Tests  4 failed | 9 passed (13)
```

- [ ] **Step 3: Add the source type, the lookup and the hook**

In `apps/registry-ui/registry/bases/base-ui/types/language-option.ts` replace:

```text
/** A Material icon component
```

with:

```text
/** Where a language picker's options come from: explicit `options`, or the built-in set for `kind`. */
interface LanguageOptionSource {
  /** Which built-in set to offer when `options` is absent. Defaults to `locale`. */
  kind?: LanguageKind;
  /** Explicit options; they replace the built-in set. */
  options?: LanguageOption[];
  /** For `kind="locale"` without `options`: the BCP-47 codes to offer. */
  locales?: readonly string[];
}

/** A Material icon component
```

In `apps/registry-ui/registry/bases/base-ui/types/language-option.ts` replace:

```text
export type { LanguageKind, LanguageOption, LanguageIcon };
```

with:

```text
export type { LanguageKind, LanguageOption, LanguageOptionSource, LanguageIcon };
```

In `apps/registry-ui/registry/bases/base-ui/lib/language-options.tsx` replace:

```text
import type { LanguageIcon, LanguageOption } from '@/registry/bases/base-ui/types/language-option';
```

with:

```text
import type { LanguageIcon, LanguageKind, LanguageOption } from '@/registry/bases/base-ui/types/language-option';
```

In `apps/registry-ui/registry/bases/base-ui/lib/language-options.tsx` replace:

```text
export { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, localeOptions };
```

with:

```text
/**
 * The option carrying `value` among `options`. For `kind="code"` an alias also
 * matches its canonical id (`ts` finds `typescript`). A value no option carries
 * comes back as a bare option labelled with the value itself, so a picker still
 * shows it; an empty value comes back as `undefined`.
 */
function findLanguageOption(
  options: readonly LanguageOption[],
  value: string,
  kind: LanguageKind,
): LanguageOption | undefined {
  const direct = options.find((o) => o.value === value);
  if (direct) return direct;
  if (kind === 'code') {
    const canonical = canonicalCodeId(value);
    const aliased = options.find((o) => o.value === canonical);
    if (aliased) return aliased;
  }
  return value ? { value, label: value } : undefined;
}

export { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, findLanguageOption, localeOptions };
```

`apps/registry-ui/registry/bases/base-ui/hooks/use-language-options.ts`:

```text
import * as React from 'react';

import { codeLanguageOptions, localeOptions } from '@/registry/bases/base-ui/lib/language-options';
import type { LanguageOption, LanguageOptionSource } from '@/registry/bases/base-ui/types/language-option';

/**
 * The options a language picker offers: `options` when given, otherwise the
 * built-in set for `kind` (default `locale`). A locale picker given no `locales`
 * offers only the current `value`, so it still shows what is selected; an empty
 * `value` then offers nothing. The array keeps its identity until an input changes.
 */
function useLanguageOptions({
  kind = 'locale',
  options,
  locales,
  value,
}: LanguageOptionSource & { value: string }): LanguageOption[] {
  return React.useMemo(() => {
    if (options) return options;
    if (kind === 'code') return codeLanguageOptions();
    return localeOptions(locales ?? (value ? [value] : []));
  }, [kind, options, locales, value]);
}

export { useLanguageOptions };
```

- [ ] **Step 4: Write the two roots**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/language-combobox.tsx`:

```text
'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import type { ReactNode } from 'react';

import { Combobox } from '@/registry/bases/base-ui/ui/combobox';

import { useLanguageOptions } from '@/registry/bases/base-ui/hooks/use-language-options';
import { findLanguageOption } from '@/registry/bases/base-ui/lib/language-options';
import type { LanguageOption, LanguageOptionSource } from '@/registry/bases/base-ui/types/language-option';

type LanguageComboboxProps = LanguageOptionSource &
  Omit<
    ComboboxPrimitive.Root.Props<LanguageOption>,
    'items' | 'value' | 'defaultValue' | 'onValueChange' | 'multiple' | 'itemToStringLabel' | 'isItemEqualToValue'
  > & {
    /** The selected language: a BCP-47 code, or a code-language id (an alias such as `ts` is shown as its language). */
    value: string;
    /** Called with the picked option's `value`; the consumer decides whether to apply it. */
    onValueChange: (value: string) => void;
  };

/**
 * A searchable language picker over upstream's `Combobox`, for UI locales
 * (`kind="locale"`) or code languages (`kind="code"`). The root owns the option
 * set and maps the string `value` to and from its option; the consumer composes
 * every visible part inside it: a `ComboboxTrigger` (holding a `ComboboxValue`,
 * whose render function receives the current `LanguageOption`), and a
 * `ComboboxContent` with an optional `ComboboxInput`, a `ComboboxEmpty` and a
 * `ComboboxList` whose render function receives each `LanguageOption`.
 */
function LanguageCombobox({
  kind = 'locale',
  options,
  locales,
  value,
  onValueChange,
  ...props
}: LanguageComboboxProps): ReactNode {
  const items = useLanguageOptions({ kind, options, locales, value });
  const current = findLanguageOption(items, value, kind);
  return (
    <Combobox
      items={items}
      value={current ?? null}
      onValueChange={(option: LanguageOption | null) => {
        if (option) onValueChange(option.value);
      }}
      itemToStringLabel={(option: LanguageOption) => option.label}
      isItemEqualToValue={(a: LanguageOption, b: LanguageOption) => a?.value === b?.value}
      {...props}
    />
  );
}

export { LanguageCombobox };
export type { LanguageComboboxProps };
```

`apps/registry-ui/registry/bases/base-ui/components/data-entry/language-toggle-group.tsx`:

```text
'use client';

import type { ComponentProps, ReactNode } from 'react';

import { ToggleGroup } from '@/registry/bases/base-ui/ui/toggle-group';

interface LanguageToggleGroupProps extends Omit<
  ComponentProps<typeof ToggleGroup>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
> {
  /** The selected language's value; the item whose `value` equals it is pressed. */
  value: string;
  /** Called with a newly pressed item's `value`. Pressing the current item reports nothing. */
  onValueChange: (value: string) => void;
}

/**
 * Every language shown inline as a single-select toggle group, for a small fixed
 * set (two to four). The consumer composes one `ToggleGroupItem` per option,
 * usually mapping `useLanguageOptions`; the group never deselects, so a language
 * is always chosen. Outlined and joined unless `variant` or `spacing` say otherwise.
 */
function LanguageToggleGroup({ value, onValueChange, ...props }: LanguageToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      data-slot="language-toggle-group"
      variant="outline"
      spacing={0}
      value={value ? [value] : []}
      onValueChange={(groupValue: string[]) => {
        const picked = groupValue.find((v) => v !== value);
        if (picked) onValueChange(picked);
      }}
      {...props}
    />
  );
}

export { LanguageToggleGroup };
export type { LanguageToggleGroupProps };
```

- [ ] **Step 5: Rewrite the editor's code block onto `LanguageCombobox`, and drop the old family**

The trigger keeps the old dropdown form's shape (an outline `Button` with the current icon and label and
upstream's chevron); the popup keeps the search field the old call turned on with `searchable`.

In `apps/registry-ui/registry/bases/base-ui/editor/document/features/code-block/code-block.tsx` replace:

```text
import { LanguageSwitcher } from '@/registry/bases/base-ui/components/data-entry/language-switcher';
```

with:

```text
import { LanguageCombobox } from '@/registry/bases/base-ui/components/data-entry/language-combobox';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/registry/bases/base-ui/ui/combobox';
import type { LanguageOption } from '@/registry/bases/base-ui/types/language-option';
```

In `apps/registry-ui/registry/bases/base-ui/editor/document/features/code-block/code-block.tsx` replace:

```text
 * writes the node's `code` attr; the `LanguageSwitcher` writes `language`; the
```

with:

```text
 * writes the node's `code` attr; the `LanguageCombobox` writes `language`; the
```

In `apps/registry-ui/registry/bases/base-ui/editor/document/features/code-block/code-block.tsx` replace:

```text
          <LanguageSwitcher
            kind="code"
            searchable
            value={language || 'text'}
            onValueChange={(next) => updateAttrs({ language: next })}
            aria-label="Language"
            placeholder="Language…"
          />
```

with:

```text
          <LanguageCombobox
            kind="code"
            value={language || 'text'}
            onValueChange={(next) => updateAttrs({ language: next })}
          >
            <ComboboxTrigger render={<Button variant="outline" size="sm" />} aria-label="Language">
              <ComboboxValue>
                {(option: LanguageOption | null) => (
                  <>
                    {option?.icon}
                    <span>{option?.label ?? 'Language...'}</span>
                  </>
                )}
              </ComboboxValue>
            </ComboboxTrigger>
            <ComboboxContent className="min-w-56">
              <ComboboxInput showTrigger={false} placeholder="Language..." />
              <ComboboxEmpty>No results.</ComboboxEmpty>
              <ComboboxList>
                {(option: LanguageOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.icon}
                    <span>{option.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </LanguageCombobox>
```

In `apps/registry-ui/registry/bases/base-ui/editor/mermaid/react/toolbar.tsx` replace:

```text
 * `LanguageSwitcher` pattern
```

with:

```text
 * `LanguageCombobox` pattern
```

Run (from `apps/registry-ui`):

```bash
git rm -q registry/bases/base-ui/components/data-entry/language-switcher.tsx registry/bases/base-ui/components/data-entry/language-switcher.spec.tsx
git grep -n -e 'language-switcher' -e 'LanguageSwitcher' -- registry src registry.json
```

Expected: one line, `registry/bases/base-ui/components/layout/collapsible-card.tsx:69:` (a comment in `CollapsibleCardTitle`,
another group's file; left for the CollapsibleCard task).

- [ ] **Step 6: Run the specs and watch them pass**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/lib/language-options.spec.tsx registry/bases/base-ui/hooks/use-language-options.spec.ts registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx registry/bases/base-ui/editor/document/features/code-block/code-block.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  5 passed (5)
      Tests  33 passed (33)
```

- [ ] **Step 7: Check the spec's rules hold**

Run (from `apps/registry-ui/registry/bases/base-ui`), the spec's Checks restricted to this task's components:

```bash
F=(components/data-entry/language-combobox.tsx components/data-entry/language-toggle-group.tsx)
grep -lnE '^export (function|const [A-Z])' "${F[@]}"
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" "${F[@]}"
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' "${F[@]}"
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' "${F[@]}"
```

Expected: nothing at all.

- [ ] **Step 8: Run the gate**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-entry1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-entry1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-entry1.log" 2>&1; grep 'error TS' "$S/tsc-entry1.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/language-combobox.tsx registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx registry/bases/base-ui/components/data-entry/language-toggle-group.tsx registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx registry/bases/base-ui/hooks/use-language-options.ts registry/bases/base-ui/hooks/use-language-options.spec.ts registry/bases/base-ui/lib/language-options.tsx registry/bases/base-ui/lib/language-options.spec.tsx registry/bases/base-ui/types/language-option.ts registry/bases/base-ui/editor/document/features/code-block/code-block.tsx registry/bases/base-ui/editor/mermaid/react/toolbar.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/language-combobox.tsx registry/bases/base-ui/components/data-entry/language-combobox.spec.tsx registry/bases/base-ui/components/data-entry/language-toggle-group.tsx registry/bases/base-ui/components/data-entry/language-toggle-group.spec.tsx registry/bases/base-ui/hooks/use-language-options.ts registry/bases/base-ui/hooks/use-language-options.spec.ts registry/bases/base-ui/lib/language-options.tsx registry/bases/base-ui/lib/language-options.spec.tsx registry/bases/base-ui/types/language-option.ts registry/bases/base-ui/editor/document/features/code-block/code-block.tsx registry/bases/base-ui/editor/mermaid/react/toolbar.tsx 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-entry1.log" 2>&1; tail -1 "$S/sb-entry1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  74 passed (74)
      Tests  386 passed (386)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline TS6307.)

- [ ] **Step 9: Commit**

`$S/msg-entry1.txt`:

```
refactor(registry-ui): split the language switcher into two composed roots

Why: LanguageSwitcher picked a display form with a prop and drew every
part itself through a trigger render prop and string props, so a
caller could change neither the trigger nor the popup copy. The two
combobox forms differed only by their trigger, so they are one root
over upstream's Combobox parts, and the segmented form is a root over
ToggleGroup items; the option set is a hook both can use.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/components/data-entry/language-combobox.tsx \
  $B/components/data-entry/language-combobox.spec.tsx \
  $B/components/data-entry/language-toggle-group.tsx \
  $B/components/data-entry/language-toggle-group.spec.tsx \
  $B/hooks/use-language-options.ts \
  $B/hooks/use-language-options.spec.ts
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-entry1.txt" -- apps/registry-ui/registry
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 20: Reshape EmojiPicker: upstream Empty, Grid and Cell parts, one source for its sizes

`EmojiPickerEmpty` only rendered upstream's `Empty` (or its children), so it goes: the consumer places an `Empty`
in `EmojiPickerContent`, and the Content keeps the same default when none is given. The grid row and the cell
become the family's `EmojiPickerGrid` and `EmojiPickerCell` parts, taking their element's props, carrying
`data-slot`, and the cell reading `select` from the picker instead of a prop. The sizes lived twice - `h-40/60/80`
and `size-9`/`gap-0.5`/`grid-cols-8` in classes, `160/240/320`, `38` and `28` px in the window arithmetic. They
now live once, in spacing steps: Content hands them to CSS as variables the classes read
(`h-(--emoji-picker-height)`, `size-(--emoji-picker-cell)`, ...) and the arithmetic turns the same steps into px.
The `size` variant stays a prop but no longer needs `cva`, since no class differs between sizes. The static
inline position styles become classes; `DEFAULT_FREQUENT_LABEL` is inlined as the prop default it named.
`AvatarPicker` renders `<EmojiPicker onSelect />` bare, which keeps working unchanged.

**Files:**

- Modify: `registry/bases/base-ui/components/data-entry/emoji-picker.tsx` (rewritten), `.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: `ui/empty`, `ui/scroll-area`, `ui/button`, `ui/tabs`, `ui/input-group`.
- Produces: `EmojiPicker`, `EmojiPickerSearch`, `EmojiPickerContent` (`size?: 'sm' | 'md' | 'lg'`, `style` taken),
  `EmojiPickerNav`, `EmojiPickerGroupLabel`; types `EmojiPickerProps`, `EmojiPickerSearchProps`, `EmojiPickerContentProps`.
  `EmojiPickerGrid` and `EmojiPickerCell` are declared parts that only Content composes, so they stay out of the export block.
- Removed: `EmojiPickerEmpty`, `EmojiPickerEmptyProps`, `emojiPickerContentVariants`.

- [ ] **Step 1: Write the failing spec**

Three cases are added (a consumer `Empty`, the sizes, the slots); the rest are unchanged.

`apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Empty, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from './emoji-picker';

beforeAll(() => {
  // The category nav scrolls the viewport; jsdom implements neither.
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  // The virtualizer measures the scroll element via ResizeObserver, absent in
  // jsdom — without it the grid window never seeds.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('EmojiPicker', () => {
  it('calls onSelect with the chosen emoji', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    // "grinning face" (😀) is the first emoji in Smileys & People.
    fireEvent.click(screen.getByRole('button', { name: 'grinning face' }));

    expect(onSelect).toHaveBeenCalledWith('😀');
  });

  it('renders the consumer-supplied frequent row', () => {
    render(<EmojiPicker onSelect={vi.fn()} frequent={['🍕']} />);

    expect(screen.getByText('Frequently used')).toBeTruthy();
  });

  it('lets frequentLabel override the frequent-row heading', () => {
    render(<EmojiPicker onSelect={vi.fn()} frequent={['🍕']} frequentLabel="Hay dùng" />);

    expect(screen.getByText('Hay dùng')).toBeTruthy();
    expect(screen.queryByText('Frequently used')).toBeNull();
  });

  it('filters the grid by search query', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'pizza' },
    });

    // The match is shown…
    expect(screen.getByRole('button', { name: 'pizza' })).toBeTruthy();
    // …and a non-matching emoji is filtered out.
    expect(screen.queryByRole('button', { name: 'grinning face' })).toBeNull();
  });

  it('shows an empty state for a query with no matches', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'zzzznotanemoji' },
    });

    expect(screen.getByText('No emoji found')).toBeTruthy();
  });

  it('renders the grid in the global Fluent style (3D by default)', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    // The picker no longer owns a style control — cells draw in the app-wide
    // style (`setFluentEmojiStyle`), defaulting to the 3D webp set.
    const grinningImg = screen.getByRole('button', { name: 'grinning face' }).querySelector('img');

    expect(grinningImg?.getAttribute('src')).toContain('/3d/');
    expect(grinningImg?.getAttribute('src')).toMatch(/\.webp$/);
  });

  it('virtualizes the grid — mounts only a window of cells, not the whole catalog', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    // The catalog is ~1900 emoji; a windowed render mounts ~one screenful of
    // Fluent artwork, so the count stays far below the full catalog.
    const mounted = document.querySelectorAll('img').length;
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(300);

    // The first cell of the initial window is present and clickable.
    expect(screen.getByRole('button', { name: 'grinning face' })).toBeTruthy();
  });

  it('renders the consumer-composed Empty in place of the default no-results state', () => {
    render(
      <EmojiPicker onSelect={vi.fn()}>
        <EmojiPickerSearch />
        <EmojiPickerContent>
          <Empty>
            <EmptyTitle>Nothing matches</EmptyTitle>
          </Empty>
        </EmojiPickerContent>
      </EmojiPicker>,
    );

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'zzzznotanemoji' },
    });

    expect(screen.getByText('Nothing matches')).toBeTruthy();
    expect(screen.queryByText('No emoji found')).toBeNull();
  });

  it('sizes the viewport, the rows and the cells from one set of spacing steps', () => {
    render(
      <EmojiPicker onSelect={vi.fn()}>
        <EmojiPickerContent size="lg" />
      </EmojiPicker>,
    );

    const content = document.querySelector<HTMLElement>('[data-slot="emoji-picker-content"]');
    expect(content?.style.getPropertyValue('--emoji-picker-height')).toBe('calc(var(--spacing) * 80)');
    expect(content?.style.getPropertyValue('--emoji-picker-cell')).toBe('calc(var(--spacing) * 9)');
    expect(content?.style.getPropertyValue('--emoji-picker-columns')).toBe('repeat(8, minmax(0, 1fr))');
    // The first cell row sits one header below the top: 7 spacing steps at 4px.
    const firstCells = document.querySelector<HTMLElement>('[data-index="1"]');
    expect(firstCells?.style.transform).toBe('translateY(28px)');
  });

  it('stamps a data-slot on the grid and on each cell', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    const cell = screen.getByRole('button', { name: 'grinning face' });
    expect(cell.getAttribute('data-slot')).toBe('emoji-picker-cell');
    expect(cell.closest('[data-slot="emoji-picker-grid"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error|Test Files|^ +Tests '
```

Expected (the consumer-`Empty` case already passes: Content always rendered its children in place of the default):

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx > EmojiPicker > sizes the viewport, the rows and the cells from one set of spacing steps
AssertionError: expected undefined to be 'calc(var(--spacing) * 80)' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx > EmojiPicker > stamps a data-slot on the grid and on each cell
AssertionError: expected 'button' to be 'emoji-picker-cell' // Object.is equality
 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

- [ ] **Step 3: Rewrite the family**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-picker.tsx`:

```text
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { EMOJI_CATEGORIES, FluentEmoji, type EmojiDatum } from '@zeroxsolutions/fluent-emoji';
import {
  Clock,
  Coffee,
  Dumbbell,
  Flag,
  Hash,
  Leaf,
  Lightbulb,
  Plane,
  Search,
  SearchX,
  Smile,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  frequent: Clock,
  smileys_people: Smile,
  animals_nature: Leaf,
  food_drink: Coffee,
  travel_places: Plane,
  activities: Dumbbell,
  objects: Lightbulb,
  symbols: Hash,
  flags: Flag,
};

/** Cells per grid row. */
const COLUMNS = 8;
/**
 * The grid's metrics in spacing steps (multiples of the theme's `--spacing`).
 * They are the one source for both sides: `EmojiPickerContent` hands them to CSS
 * as variables the classes read, and the window arithmetic below turns them into
 * px, so the visible window needs no element measurement (which reads 0 in
 * jsdom) and no ResizeObserver.
 */
const CELL_STEPS = 9;
const ROW_GAP_STEPS = 0.5;
const HEADER_STEPS = 7;
const HEIGHT_STEPS = { sm: 40, md: 60, lg: 80 } as const;
/** The px one spacing step measures at the default `--spacing` (0.25rem) on a 16px root; the arithmetic assumes it. */
const SPACING_PX = 4;
const CELL_ROW_PX = (CELL_STEPS + ROW_GAP_STEPS) * SPACING_PX;
const HEADER_PX = HEADER_STEPS * SPACING_PX;
/** Rows rendered beyond the viewport on each side, in px (~6 rows). */
const OVERSCAN_PX = 6 * CELL_ROW_PX;

/** A length of `steps` spacing steps, as CSS that follows the theme's `--spacing`. */
function spacingSteps(steps: number): string {
  return `calc(var(--spacing) * ${steps})`;
}

interface EmojiSection {
  id: string;
  name: string;
  emojis: EmojiDatum[];
}

/** One virtual row: a sticky section heading or a row of up to `COLUMNS` emoji. */
type EmojiRow =
  { type: 'header'; key: string; id: string; name: string } | { type: 'cells'; key: string; emojis: EmojiDatum[] };

/** Flatten sections (or flat search results) into the virtualizer's row list. */
function buildRows(
  sections: EmojiSection[],
  results: EmojiDatum[] | null,
): { rows: EmojiRow[]; headerIndices: number[] } {
  const rows: EmojiRow[] = [];
  const headerIndices: number[] = [];
  const pushCells = (emojis: EmojiDatum[], keyBase: string) => {
    for (let i = 0; i < emojis.length; i += COLUMNS) {
      rows.push({
        type: 'cells',
        key: `${keyBase}-${i}`,
        emojis: emojis.slice(i, i + COLUMNS),
      });
    }
  };
  // Search view is a flat grid of matches - no section headers.
  if (results) {
    pushCells(results, 'search');
    return { rows, headerIndices };
  }
  for (const sec of sections) {
    headerIndices.push(rows.length);
    rows.push({
      type: 'header',
      key: `h-${sec.id}`,
      id: sec.id,
      name: sec.name,
    });
    pushCells(sec.emojis, sec.id);
  }
  return { rows, headerIndices };
}

interface Scroller {
  scrollToIndex: (index: number, opts?: { align?: 'start' }) => void;
}

interface EmojiPickerContextValue {
  query: string;
  setQuery: (q: string) => void;
  /** Forwards the chosen emoji to the consumer's onSelect. */
  select: (emoji: string) => void;
  /** Search results, or null when not searching. */
  results: EmojiDatum[] | null;
  navCategories: { id: string; name: string }[];
  active: string;
  scrollToCategory: (id: string) => void;
  hasFrequent: boolean;
  /** Flattened rows + the indices that are sticky headers. */
  rows: EmojiRow[];
  headerIndices: number[];
  /** The scrollable grid registers its virtualizer here so the nav can jump. */
  scrollerRef: React.RefObject<Scroller | null>;
}

const EmojiPickerContext = React.createContext<EmojiPickerContextValue | null>(null);

/** Read the picker state shared by the surrounding <EmojiPicker>. */
function useEmojiPicker(): EmojiPickerContextValue {
  const ctx = React.useContext(EmojiPickerContext);
  if (!ctx) {
    throw new Error('EmojiPicker parts must be used within <EmojiPicker>');
  }
  return ctx;
}

interface EmojiPickerProps {
  /** Called with the chosen emoji glyph. */
  onSelect: (emoji: string) => void;
  /**
   * Recently-used emoji glyphs shown in the frequent row. The consumer owns this
   * list and its persistence - the picker keeps no storage of its own.
   */
  frequent?: string[];
  /** Heading + nav name for the frequent row. Defaults to `'Frequently used'`. */
  frequentLabel?: string;
  /**
   * Compose the parts (`EmojiPickerSearch`, `EmojiPickerContent`,
   * `EmojiPickerNav`) to override copy or layout. Omit for the default picker.
   */
  children?: React.ReactNode;
}

/**
 * A searchable, categorized emoji grid with an optional frequent row and a
 * category nav - modelled on the LobeHub picker. The catalog and the Fluent 3D
 * artwork come from `@zeroxsolutions/fluent-emoji` (self-hosted, no third-party CDN);
 * the frequent row is consumer-supplied (`frequent`) - the picker holds no
 * persistence of its own.
 *
 * The grid is **windowed**: only the rows in (and near) the viewport mount, so
 * opening the ~1900-emoji catalog renders one screenful and fetches only the
 * artwork in view.
 *
 * Compound + context: the Root owns the state and the parts read it. Used bare
 * (`<EmojiPicker onSelect />`) it renders the default composition; compose the
 * parts to override any visible copy (every string is a part's `children`/prop
 * default, never frozen) - an upstream `Empty` placed in `EmojiPickerContent`
 * overrides the no-results state.
 */
function EmojiPicker({ onSelect, frequent = [], frequentLabel = 'Frequently used', children }: EmojiPickerProps) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState('smileys_people');

  const q = query.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (!q) return null;
    const out: EmojiDatum[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const em of cat.emojis) if (em.k.includes(q)) out.push(em);
    }
    return out;
  }, [q]);

  const sections = React.useMemo<EmojiSection[]>(() => {
    const head: EmojiSection[] =
      frequent.length > 0
        ? [
            {
              id: 'frequent',
              name: frequentLabel,
              emojis: frequent.map((e) => ({ e, n: e, k: '' })),
            },
          ]
        : [];
    return [...head, ...EMOJI_CATEGORIES];
  }, [frequent, frequentLabel]);

  const navCategories = React.useMemo(
    () => [{ id: 'frequent', name: frequentLabel }, ...EMOJI_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))],
    [frequentLabel],
  );

  const { rows, headerIndices } = React.useMemo(() => buildRows(sections, results), [sections, results]);

  // The scrollable grid (in EmojiPickerContent) registers its virtualizer here;
  // the nav lives in a sibling subtree and jumps through this ref.
  const scrollerRef = React.useRef<Scroller | null>(null);

  const scrollToCategory = React.useCallback(
    (id: string) => {
      setActive(id);
      const idx = rows.findIndex((r) => r.type === 'header' && r.id === id);
      if (idx >= 0) scrollerRef.current?.scrollToIndex(idx, { align: 'start' });
    },
    [rows],
  );

  const ctx = React.useMemo<EmojiPickerContextValue>(
    () => ({
      query,
      setQuery,
      select: onSelect,
      results,
      navCategories,
      active,
      scrollToCategory,
      hasFrequent: frequent.length > 0,
      rows,
      headerIndices,
      scrollerRef,
    }),
    [query, onSelect, results, navCategories, active, scrollToCategory, frequent.length, rows, headerIndices],
  );

  return (
    <EmojiPickerContext.Provider value={ctx}>
      {children ?? (
        <React.Fragment>
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerNav />
        </React.Fragment>
      )}
    </EmojiPickerContext.Provider>
  );
}

type EmojiPickerSearchProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> & {
  /** Override the default placeholder. */
  placeholder?: string;
  /** Override the default aria-label. */
  'aria-label'?: string;
};

/** Search box bound to the picker query. Copy is overridable via the props. */
function EmojiPickerSearch({
  className,
  placeholder = 'Search',
  'aria-label': ariaLabel = 'Search emoji',
  ...props
}: EmojiPickerSearchProps) {
  const { query, setQuery } = useEmojiPicker();
  return (
    <div data-slot="emoji-picker-search" className="px-2 py-1">
      <InputGroup className={className}>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          {...props}
        />
      </InputGroup>
    </div>
  );
}

/** Sticky section heading - this is what "Frequently used" / a category name is. */
function EmojiPickerGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="emoji-picker-group-label"
      className={cn('bg-popover text-muted-foreground px-2 py-1 text-sm font-medium', className)}
      {...props}
    />
  );
}

// `style` is taken: the root carries the grid metrics as CSS variables there.
type EmojiPickerContentProps = Omit<React.ComponentProps<typeof ScrollArea>, 'style'> & {
  /** The viewport height: `sm`, `md` (default) or `lg`. */
  size?: keyof typeof HEIGHT_STEPS;
};

/**
 * Windowed, scrollable grid body. While searching it shows the matches or -
 * when none - its `children` (an upstream `Empty` the consumer composes) or the
 * default empty state. Only the rows in (and near) the viewport mount; the
 * section header covering the top of the viewport is pinned.
 *
 * The window is plain arithmetic over fixed row heights and the known viewport
 * height (the `size` prop) - no element measurement, so it is correct under
 * jsdom (scroll starts at the top) and needs no virtualization library.
 */
function EmojiPickerContent({ className, children, size = 'md', ...props }: EmojiPickerContentProps) {
  const { results, rows, headerIndices, scrollerRef } = useEmojiPicker();

  const viewportHeight = HEIGHT_STEPS[size] * SPACING_PX;
  const [scrollTop, setScrollTop] = React.useState(0);
  const metrics = {
    '--emoji-picker-height': spacingSteps(HEIGHT_STEPS[size]),
    '--emoji-picker-cell': spacingSteps(CELL_STEPS),
    '--emoji-picker-gap': spacingSteps(ROW_GAP_STEPS),
    '--emoji-picker-header': spacingSteps(HEADER_STEPS),
    '--emoji-picker-columns': `repeat(${COLUMNS}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  // Per-row top offsets + total height (uniform, fixed metrics).
  const { offsets, total } = React.useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const r of rows) {
      offsets.push(acc);
      acc += r.type === 'header' ? HEADER_PX : CELL_ROW_PX;
    }
    return { offsets, total: acc };
  }, [rows]);
  const offsetsRef = React.useRef(offsets);
  offsetsRef.current = offsets;

  const viewportRef = React.useRef<HTMLElement | null>(null);
  const onScroll = React.useCallback(() => {
    setScrollTop(viewportRef.current?.scrollTop ?? 0);
  }, []);
  // The ScrollArea forwards this ref to its root; scrolling happens on the inner
  // viewport (and scroll events don't bubble), so listen on it directly.
  const setScrollRoot = React.useCallback(
    (el: HTMLElement | null) => {
      viewportRef.current?.removeEventListener('scroll', onScroll);
      viewportRef.current = el?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null;
      viewportRef.current?.addEventListener('scroll', onScroll, {
        passive: true,
      });
    },
    [onScroll],
  );

  // Let the sibling nav jump to a category by scrolling to its header offset.
  React.useEffect(() => {
    scrollerRef.current = {
      scrollToIndex: (index) => {
        const y = offsetsRef.current[index] ?? 0;
        const vp = viewportRef.current;
        if (vp) vp.scrollTop = y;
        setScrollTop(y);
      },
    };
    return () => {
      scrollerRef.current = null;
    };
  }, [scrollerRef]);

  // A new row set (e.g. entering/leaving search) starts back at the top.
  React.useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [results]);

  // Empty search -> the empty state, not a windowed list.
  if (results && results.length === 0) {
    return (
      <ScrollArea
        ref={setScrollRoot}
        data-slot="emoji-picker-content"
        className={cn('h-(--emoji-picker-height) px-2', className)}
        style={metrics}
        {...props}
      >
        {children ?? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No emoji found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </ScrollArea>
    );
  }

  // The visible window (+ overscan), found over the fixed offsets.
  const top = scrollTop - OVERSCAN_PX;
  const bottom = scrollTop + viewportHeight + OVERSCAN_PX;
  const rowHeight = (i: number) => (rows[i].type === 'header' ? HEADER_PX : CELL_ROW_PX);
  let start = 0;
  while (start < rows.length && offsets[start] + rowHeight(start) < top) start++;
  let end = start;
  while (end < rows.length && offsets[end] <= bottom) end++;

  // The header to pin: the last one whose offset is at or above the viewport top.
  let stickyIndex = -1;
  for (const hi of headerIndices) {
    if (offsets[hi] <= scrollTop) stickyIndex = hi;
    else break;
  }

  return (
    <ScrollArea
      ref={setScrollRoot}
      data-slot="emoji-picker-content"
      className={cn('h-(--emoji-picker-height) px-2', className)}
      style={metrics}
      {...props}
    >
      <div className="relative w-full" style={{ height: total }}>
        {stickyIndex >= 0 && rows[stickyIndex].type === 'header' && (
          <div className="sticky top-0 z-10 w-full">
            <EmojiPickerGroupLabel className="h-(--emoji-picker-header)">
              {(rows[stickyIndex] as { name: string }).name}
            </EmojiPickerGroupLabel>
          </div>
        )}
        {rows.slice(start, end).map((row, i) => {
          const index = start + i;
          // The pinned header is rendered once, above - skip its in-flow copy.
          if (index === stickyIndex) return null;
          return (
            <div
              key={row.key}
              data-index={index}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${offsets[index]}px)` }}
            >
              {row.type === 'header' ? (
                <EmojiPickerGroupLabel className="h-(--emoji-picker-header)">{row.name}</EmojiPickerGroupLabel>
              ) : (
                <EmojiPickerGrid>
                  {row.emojis.map((emoji, i) => (
                    <EmojiPickerCell key={`${emoji.e}-${i}`} emoji={emoji} />
                  ))}
                </EmojiPickerGrid>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/** Category jump-nav. Hidden while searching. */
function EmojiPickerNav({ className, ...props }: Omit<React.ComponentProps<typeof Tabs>, 'value' | 'onValueChange'>) {
  const { results, navCategories, active, scrollToCategory, hasFrequent } = useEmojiPicker();
  if (results) return null;
  return (
    <Tabs
      data-slot="emoji-picker-nav"
      value={active}
      onValueChange={(value) => scrollToCategory(String(value))}
      className={className}
      {...props}
    >
      <TabsList variant="line" className="w-full justify-between gap-0">
        {navCategories.map((c) => {
          const Icon = CATEGORY_ICONS[c.id] ?? Smile;
          const disabled = c.id === 'frequent' && !hasFrequent;
          return (
            <TabsTrigger key={c.id} value={c.id} disabled={disabled} aria-label={c.name} className="flex-1 px-0">
              <Icon />
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

/** One row of cells, laid out in the columns and gap `EmojiPickerContent` sets. */
function EmojiPickerGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="emoji-picker-grid"
      className={cn('grid grid-cols-(--emoji-picker-columns) gap-(--emoji-picker-gap)', className)}
      {...props}
    />
  );
}

type EmojiPickerCellProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  /** The emoji this cell draws and hands to the picker's `onSelect` when pressed. */
  emoji: EmojiDatum;
};

/** One emoji button, drawn in the app-wide Fluent style (`setFluentEmojiStyle`).
 * Only cells in (or near) the viewport mount, so the Fluent artwork is rendered
 * immediately - virtualization, not per-cell deferral, is what keeps opening the
 * picker from fetching the whole catalog. */
function EmojiPickerCell({ emoji, className, onClick, ...props }: EmojiPickerCellProps) {
  const { select } = useEmojiPicker();
  return (
    <Button
      data-slot="emoji-picker-cell"
      type="button"
      title={emoji.n}
      aria-label={emoji.n}
      size="icon"
      variant="ghost"
      className={cn('size-(--emoji-picker-cell)', className)}
      onClick={(event) => {
        onClick?.(event);
        select(emoji.e);
      }}
      {...props}
    >
      <FluentEmoji glyph={emoji.e} name={emoji.n} className="size-full object-contain" />
    </Button>
  );
}

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerNav, EmojiPickerGroupLabel };
export type { EmojiPickerProps, EmojiPickerSearchProps, EmojiPickerContentProps };
```

- [ ] **Step 4: Run the specs and watch them pass**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx registry/bases/base-ui/components/layout/avatar-picker.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  2 passed (2)
      Tests  15 passed (15)
```

- [ ] **Step 5: Check the spec's rules hold**

Run (from `apps/registry-ui/registry/bases/base-ui`), the spec's Checks restricted to this task's components:

```bash
F=(components/data-entry/emoji-picker.tsx)
grep -lnE '^export (function|const [A-Z])' "${F[@]}"
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" "${F[@]}"
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' "${F[@]}"
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' "${F[@]}"
```

Expected: nothing at all.

- [ ] **Step 6: Run the gate**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-entry2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-entry2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-entry2.log" 2>&1; grep 'error TS' "$S/tsc-entry2.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/emoji-picker.tsx registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/emoji-picker.tsx registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-entry2.log" 2>&1; tail -1 "$S/sb-entry2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  74 passed (74)
      Tests  389 passed (389)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline TS6307.)

- [ ] **Step 7: Commit**

`$S/msg-entry2.txt`:

```
refactor(registry-ui): compose the emoji picker's empty state from upstream

Why: EmojiPickerEmpty only re-rendered upstream's Empty, the grid and
cell were unexported helpers with no data-slot, and the picker's sizes
were written twice, as classes and as the px the window arithmetic
reads, so changing one silently broke the other. The consumer now
places Empty itself, Grid and Cell are parts, and one table of spacing
steps feeds both the classes and the arithmetic.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-entry2.txt" -- apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-picker.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-picker.spec.tsx
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 21: Give EmojiAppearanceToggleGroup an Item part

The root rendered its five swatches from a module table with frozen labels. It now takes its swatches as
children: `EmojiAppearanceToggleGroupItem` draws the sample emoji in its `value`'s style over the consumer's
label. The preview is marked decorative, so the label names the swatch (the old `aria-label` "<label> style"
goes with the table). No file imports the family.

**Files:**

- Modify: `registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx` (rewritten), `.spec.tsx` (rewritten)

**Interfaces:**

- Produces: `EmojiAppearanceToggleGroup` (unchanged props, now with children), `EmojiAppearanceToggleGroupItem`
  (`ToggleGroupItem` props with `value: FluentEmojiStyle`), types `EmojiAppearanceToggleGroupProps`,
  `EmojiAppearanceToggleGroupItemProps`.
- Removed: the built-in `STYLE_OPTIONS` swatch list.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem } from './emoji-appearance-toggle-group';

beforeAll(() => {
  // Base UI's ToggleGroup measures with ResizeObserver and reads animations;
  // jsdom implements neither.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

function renderGroup(value: FluentEmojiStyle, onValueChange = vi.fn()) {
  return render(
    <EmojiAppearanceToggleGroup value={value} onValueChange={onValueChange}>
      <EmojiAppearanceToggleGroupItem value="3d">3D</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="flat">Flat</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="modern">Modern</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="mono">Mono</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="anim">Animated</EmojiAppearanceToggleGroupItem>
    </EmojiAppearanceToggleGroup>,
  );
}

describe('EmojiAppearanceToggleGroup', () => {
  it('renders one swatch per composed item, named by its label', () => {
    renderGroup('3d');

    for (const label of ['3D', 'Flat', 'Modern', 'Mono', 'Animated']) {
      expect(screen.getByRole('button', { name: label }).getAttribute('data-slot')).toBe(
        'emoji-appearance-toggle-group-item',
      );
    }
  });

  it('previews each swatch in its own style', () => {
    renderGroup('3d');

    const src = (label: string) =>
      screen.getByRole('button', { name: label }).querySelector('img')?.getAttribute('src');

    // Each swatch draws the sample emoji in its own artwork set, regardless of
    // the selected value: the preview is the option.
    expect(src('3D')).toContain('/3d/');
    expect(src('Flat')).toContain('/flat/');
    expect(src('Modern')).toContain('/modern/');
    expect(src('Mono')).toContain('/mono/');
    expect(src('Animated')).toContain('/anim/');
  });

  it('marks the selected style as pressed', () => {
    renderGroup('modern');

    expect(screen.getByRole('button', { name: 'Modern' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '3D' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the chosen style via onValueChange', () => {
    const onValueChange = vi.fn();
    renderGroup('3d', onValueChange);

    fireEvent.click(screen.getByRole('button', { name: 'Flat' }));

    expect(onValueChange).toHaveBeenCalledWith('flat');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error|Test Files|^ +Tests '
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx > EmojiAppearanceToggleGroup > renders one swatch per composed item, named by its label
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "3D"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx > EmojiAppearanceToggleGroup > previews each swatch in its own style
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "3D"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx > EmojiAppearanceToggleGroup > marks the selected style as pressed
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Modern"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx > EmojiAppearanceToggleGroup > reports the chosen style via onValueChange
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Flat"
 Test Files  1 failed (1)
      Tests  4 failed (4)
```

- [ ] **Step 3: Rewrite the family**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx`:

```text
import { FluentEmoji, type FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import type { ComponentProps, ReactNode } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { cn } from '@/registry/bases/base-ui/lib/utils';

// A glyph present in every Fluent style - each swatch previews it so the user
// sees the artwork rather than reading a style name.
const SAMPLE = { glyph: '😀', name: 'grinning face' } as const;

interface EmojiAppearanceToggleGroupProps extends Omit<
  ComponentProps<typeof ToggleGroup>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
> {
  /** The selected artwork style. */
  value: FluentEmojiStyle;
  /** Notified with the newly chosen style; choosing the selected one again reports nothing. */
  onValueChange: (style: FluentEmojiStyle) => void;
}

/**
 * A row of preview swatches for the Fluent emoji artwork **style**, one
 * `EmojiAppearanceToggleGroupItem` per style the consumer offers. Each swatch
 * renders the same sample emoji in its style (an `anim` swatch plays its frames),
 * so the preview is the selector. Single-select, and a style is always chosen.
 *
 * This is an **app-level appearance control**, not part of the emoji glyph picker:
 * the artwork style is a global preference. It's controlled (`value` /
 * `onValueChange`); the consumer owns persistence and applying the choice app-wide
 * (`setFluentEmojiStyle` from `@zeroxsolutions/fluent-emoji`).
 */
function EmojiAppearanceToggleGroup({ value, onValueChange, ...props }: EmojiAppearanceToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      // Single-select: Base UI's value is an array; bind the lone style and
      // ignore a deselect so a style is always chosen.
      data-slot="emoji-appearance-toggle-group"
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as FluentEmojiStyle | undefined;
        if (picked) onValueChange(picked);
      }}
      spacing={6}
      aria-label="Emoji style"
      {...props}
    />
  );
}

interface EmojiAppearanceToggleGroupItemProps extends Omit<ComponentProps<typeof ToggleGroupItem>, 'value'> {
  /** The artwork style this swatch previews and selects. */
  value: FluentEmojiStyle;
}

/**
 * One swatch: the sample emoji drawn in `value`'s style over the consumer's
 * label (`children`), which names the swatch; the preview itself is decorative.
 */
function EmojiAppearanceToggleGroupItem({
  value,
  className,
  children,
  ...props
}: EmojiAppearanceToggleGroupItemProps): ReactNode {
  return (
    <ToggleGroupItem
      data-slot="emoji-appearance-toggle-group-item"
      value={value}
      // Base UI Toggle marks the pressed item with `aria-pressed`/`data-pressed`
      // (not Radix's `data-state=on`); ring the selected swatch off that.
      className={cn('aria-pressed:ring-ring h-auto flex-col gap-1 px-3 py-2 aria-pressed:ring-2', className)}
      {...props}
    >
      <FluentEmoji
        glyph={SAMPLE.glyph}
        name={SAMPLE.name}
        variant={value}
        aria-hidden
        className="size-8 object-contain"
      />
      <span className="text-muted-foreground text-xs">{children}</span>
    </ToggleGroupItem>
  );
}

export { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem };
export type { EmojiAppearanceToggleGroupProps, EmojiAppearanceToggleGroupItemProps };
```

- [ ] **Step 4: Run the spec and watch it pass**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

- [ ] **Step 5: Check the spec's rules hold**

Run (from `apps/registry-ui/registry/bases/base-ui`), the spec's Checks restricted to this task's components:

```bash
F=(components/data-entry/emoji-appearance-toggle-group.tsx)
grep -lnE '^export (function|const [A-Z])' "${F[@]}"
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" "${F[@]}"
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' "${F[@]}"
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' "${F[@]}"
```

Expected: nothing at all.

- [ ] **Step 6: Run the gate**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-entry3.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-entry3.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-entry3.log" 2>&1; grep 'error TS' "$S/tsc-entry3.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-entry3.log" 2>&1; tail -1 "$S/sb-entry3.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  74 passed (74)
      Tests  389 passed (389)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline TS6307.)

- [ ] **Step 7: Commit**

`$S/msg-entry3.txt`:

```
refactor(registry-ui): let the consumer compose emoji appearance swatches

Why: the toggle group drew its five swatches from a table with frozen
English labels, so a caller could neither translate a label nor offer
fewer styles. Each swatch is now an Item the caller composes, with its
label as children.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-entry3.txt" -- apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.spec.tsx
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 22: Reshape NumberField into a root and a NumberFieldInput

`NumberField` rendered its own addons from `label`, `suffix` and `endAddon`. The root keeps the parsing,
clamping and arrow-key stepping and shares them through context; the consumer composes a `NumberFieldInput`
and any `InputGroupAddon` / `InputGroupText` around it, as upstream's input-group examples do. The root carries
`data-mixed` and `data-editing`; `placeholder` moves to the input, where it still shows only while mixed. The
input composes the consumer's `onFocus` / `onChange` / `onBlur` / `onKeyDown` with its own. No file imports the family.

**Files:**

- Modify: `registry/bases/base-ui/components/data-entry/number-field.tsx` (rewritten), `.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: `ui/input-group` (`InputGroup`, `InputGroupInput`), `lib/expr-eval`.
- Produces: `NumberField` (`InputGroup` props minus `onChange`/`defaultValue`, + `value`, `onValueChange`,
  `disabled`, `min`, `max`, `step`, `parseRaw`, `mixed`, `displayText`), `NumberFieldInput` (`InputGroupInput`
  props minus `value`/`defaultValue`/`type`/`disabled`), types `NumberFieldProps`, `NumberFieldInputProps`.
- Removed: the `label`, `suffix`, `endAddon` and `placeholder` props of `NumberField`.

- [ ] **Step 1: Write the failing spec**

The six existing cases now compose the input and two addons; four cases are new (displayText, the addons, the
two `data-*` attributes, the composed handlers).

`apps/registry-ui/registry/bases/base-ui/components/data-entry/number-field.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputGroupAddon, InputGroupText } from '@/registry/bases/base-ui/ui/input-group';

import { NumberField, NumberFieldInput, type NumberFieldInputProps, type NumberFieldProps } from './number-field';

afterEach(cleanup);

function renderField(props: Omit<NumberFieldProps, 'children'>, input: NumberFieldInputProps = {}) {
  return render(
    <NumberField {...props}>
      <InputGroupAddon>
        <InputGroupText>W</InputGroupText>
      </InputGroupAddon>
      <NumberFieldInput {...input} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>px</InputGroupText>
      </InputGroupAddon>
    </NumberField>,
  );
}

function root(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="number-field"]')!;
}

describe('NumberField', () => {
  it('evaluates an arithmetic expression and commits the result via onValueChange', () => {
    const onValueChange = vi.fn();
    renderField({ value: 100, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '100 + 8' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith(108);
  });

  it('clamps the committed value to min/max', () => {
    const onValueChange = vi.fn();
    renderField({ value: 5, min: 0, max: 10, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith(10);
  });

  it('blanks the value and shows the consumer placeholder while mixed', () => {
    renderField({ value: 5, mixed: true, onValueChange: () => {} }, { placeholder: 'Mixed' });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Mixed');
  });

  it('honours a custom parseRaw over the arithmetic evaluator', () => {
    const onValueChange = vi.fn();
    renderField({ value: 0, parseRaw: () => 7, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'anything' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith(7);
  });

  it('steps the value on ArrowUp/ArrowDown when step is set (clamped)', () => {
    const onValueChange = vi.fn();
    renderField({ value: 5, step: 2, max: 6, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // 5 + 2 = 7, clamped to max 6.
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onValueChange).toHaveBeenLastCalledWith(3);
  });

  it('leaves the arrows inert when no step is given', () => {
    const onValueChange = vi.fn();
    renderField({ value: 5, onValueChange });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('shows displayText until focused, then the number to edit', () => {
    renderField({ value: 5, displayText: 'Hug', onValueChange: () => {} });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Hug');
    fireEvent.focus(input);
    expect(input.value).toBe('');
  });

  it('places the addons the consumer composed around the input', () => {
    renderField({ value: 5, onValueChange: () => {} });

    expect(root().textContent).toBe('Wpx');
    expect(root().querySelector('input')).toBe(screen.getByRole('textbox'));
  });

  it('carries data-mixed while mixed and data-editing while the input is focused', () => {
    renderField({ value: 5, mixed: true, onValueChange: () => {} });

    expect(root().hasAttribute('data-mixed')).toBe(true);
    expect(root().hasAttribute('data-editing')).toBe(false);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(root().hasAttribute('data-editing')).toBe(true);
    fireEvent.blur(input);
    expect(root().hasAttribute('data-editing')).toBe(false);
  });

  it('runs the consumer handlers on the input beside its own', () => {
    const onValueChange = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    renderField({ value: 1, onValueChange }, { onFocus, onBlur });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/number-field.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error|Test Files|^ +Tests '
```

Expected (the old root ignores its children and still renders its own input, so the cases that only drive the
input pass):

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/number-field.spec.tsx > NumberField > blanks the value and shows the consumer placeholder while mixed
AssertionError: expected '' to be 'Mixed' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/number-field.spec.tsx > NumberField > places the addons the consumer composed around the input
TypeError: Cannot read properties of null (reading 'textContent')
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/number-field.spec.tsx > NumberField > carries data-mixed while mixed and data-editing while the input is focused
TypeError: Cannot read properties of null (reading 'hasAttribute')
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/number-field.spec.tsx > NumberField > runs the consumer handlers on the input beside its own
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
 Test Files  1 failed (1)
      Tests  4 failed | 6 passed (10)
```

- [ ] **Step 3: Rewrite the family**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/number-field.tsx`:

```text
import * as React from 'react';

import { InputGroup, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { evaluateExpression } from '@/registry/bases/base-ui/lib/expr-eval';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface NumberFieldProps extends Omit<React.ComponentProps<typeof InputGroup>, 'onChange' | 'defaultValue'> {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  /** Increment/decrement applied on ArrowUp / ArrowDown (clamped to min/max).
   *  Omit to leave the arrows as native text-cursor movement. */
  step?: number;
  /** Override raw parsing - receives the draft string, returns a number or null. */
  parseRaw?: (raw: string) => number | null;
  /**
   * Multi-selection with differing values - blanks the value and shows the
   * input's `placeholder` until the user types one, which then applies to every
   * selected target.
   */
  mixed?: boolean;
  /**
   * Show this text in place of the numeric value while not editing (e.g. a
   * "Hug" / "Fill" sizing label). Focusing clears it so typing commits a number.
   */
  displayText?: string;
}

interface NumberFieldContextValue {
  /** What the input shows: the draft while editing, else the value or `displayText`. */
  text: string;
  /** Whether the input shows its `placeholder`: only while mixed and not editing. */
  placeholderShown: boolean;
  disabled: boolean | undefined;
  begin: () => void;
  change: (raw: string) => void;
  commit: () => void;
  keyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null);

function useNumberField(): NumberFieldContextValue {
  const context = React.useContext(NumberFieldContext);
  if (!context) throw new Error('NumberFieldInput must be used within <NumberField>');
  return context;
}

/**
 * A compact numeric field for a property inspector, over upstream's
 * `InputGroup`. The root parses (arithmetic expressions, or `parseRaw`), clamps
 * to `min`/`max` and steps on the arrow keys; the consumer composes a
 * `NumberFieldInput` and any `InputGroupAddon` / `InputGroupText` around it (a
 * label before, a unit or a trigger after). Controlled - the consumer owns the
 * number. The root carries `data-mixed` while `mixed` and `data-editing` while
 * the input holds a draft.
 */
function NumberField({
  value,
  onValueChange,
  disabled,
  min,
  max,
  step,
  parseRaw,
  mixed,
  displayText,
  className,
  children,
  ...props
}: NumberFieldProps): React.ReactNode {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  const clamp = React.useCallback(
    (next: number) => {
      let clamped = next;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max],
  );

  const begin = React.useCallback(() => {
    setEditing(true);
    setDraft(mixed || displayText ? '' : String(value));
  }, [value, mixed, displayText]);

  const change = React.useCallback(
    (raw: string) => {
      if (editing) setDraft(raw);
      else onValueChange(Number(raw));
    },
    [editing, onValueChange],
  );

  const commit = React.useCallback(() => {
    setEditing(false);
    const result = parseRaw ? parseRaw(draft) : evaluateExpression(draft);
    if (result !== null) onValueChange(clamp(result));
  }, [draft, parseRaw, onValueChange, clamp]);

  const keyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        setEditing(false);
        setDraft(String(value));
        event.currentTarget.blur();
      } else if (step !== undefined && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        // Step the value (the arrows are inert otherwise - a text cursor in a
        // single-line field has nowhere to go vertically).
        event.preventDefault();
        const base = editing ? (evaluateExpression(draft) ?? value) : value;
        const next = clamp(base + (event.key === 'ArrowUp' ? step : -step));
        onValueChange(next);
        if (editing) setDraft(String(next));
      }
    },
    [value, step, editing, draft, onValueChange, clamp],
  );

  const text = editing ? draft : mixed ? '' : (displayText ?? String(value));
  const context = React.useMemo<NumberFieldContextValue>(
    () => ({ text, placeholderShown: Boolean(mixed) && !editing, disabled, begin, change, commit, keyDown }),
    [text, mixed, editing, disabled, begin, change, commit, keyDown],
  );

  return (
    <NumberFieldContext.Provider value={context}>
      <InputGroup
        data-slot="number-field"
        data-mixed={mixed || undefined}
        data-editing={editing || undefined}
        data-disabled={disabled || undefined}
        className={className}
        {...props}
      >
        {children}
      </InputGroup>
    </NumberFieldContext.Provider>
  );
}

type NumberFieldInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'value' | 'defaultValue' | 'type' | 'disabled'
>;

/**
 * The value input of a `NumberField`. It shows the field's value (or its draft
 * while focused) and hands every edit to the root; its `placeholder` shows only
 * while the field is `mixed`. It keeps upstream's `input-group-control` slot,
 * which the group's focus ring reads.
 */
function NumberFieldInput({
  placeholder,
  className,
  onFocus,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}: NumberFieldInputProps): React.ReactNode {
  const field = useNumberField();
  return (
    <InputGroupInput
      type="text"
      inputMode="decimal"
      value={field.text}
      placeholder={field.placeholderShown ? placeholder : undefined}
      disabled={field.disabled}
      className={cn('tabular-nums', className)}
      onFocus={(event) => {
        onFocus?.(event);
        field.begin();
      }}
      onChange={(event) => {
        onChange?.(event);
        field.change(event.target.value);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        field.commit();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        field.keyDown(event);
      }}
      {...props}
    />
  );
}

export { NumberField, NumberFieldInput };
export type { NumberFieldProps, NumberFieldInputProps };
```

- [ ] **Step 4: Run the spec and watch it pass**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/number-field.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

- [ ] **Step 5: Check the spec's rules hold**

Run (from `apps/registry-ui/registry/bases/base-ui`), the spec's Checks restricted to this task's components:

```bash
F=(components/data-entry/number-field.tsx)
grep -lnE '^export (function|const [A-Z])' "${F[@]}"
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" "${F[@]}"
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' "${F[@]}"
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' "${F[@]}"
```

Expected: nothing at all.

- [ ] **Step 6: Run the gate**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-entry4.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-entry4.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-entry4.log" 2>&1; grep 'error TS' "$S/tsc-entry4.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/number-field.tsx registry/bases/base-ui/components/data-entry/number-field.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/number-field.tsx registry/bases/base-ui/components/data-entry/number-field.spec.tsx 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-entry4.log" 2>&1; tail -1 "$S/sb-entry4.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  74 passed (74)
      Tests  393 passed (393)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline TS6307.)

- [ ] **Step 7: Commit**

`$S/msg-entry4.txt`:

```
refactor(registry-ui): let the consumer compose number field addons

Why: NumberField drew its label and unit addons from props, so an addon
could hold only what those props anticipated and the caller's own input
handlers had no way in. The root keeps the parsing, clamping and key
handling; the caller composes the input and upstream's addons, and the
root reports mixed and editing on data attributes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-entry4.txt" -- apps/registry-ui/registry/bases/base-ui/components/data-entry/number-field.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/number-field.spec.tsx
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 23: Reshape TreeItem into a row with Indent, Label and RenameInput parts

`TreeItem` took its icon, name, badges, trailing actions, rename wiring and context menu as props and wrapped
itself in a `ContextMenu`. The root is now the row alone, over upstream's `Item` at `size="xs"`, carrying
`data-expanded` and `data-editing`; the consumer composes `TreeItemIndent` (the indent and chevron, which now
turns off the row's `data-expanded`), `TreeItemLabel` (the clickable name region) holding `ItemMedia` /
`ItemTitle` or a `TreeItemRenameInput`, and `ItemActions`; a context menu wraps the row as upstream composes
one, `ContextMenuTrigger render={<TreeItem />}`. `TreeItemIndent` moves from being the row to being a part
inside it, so the indent padding sits on the indent element. The one importer, `examples/tree-hero.tsx`, is
rewritten, and the `tree-item` and `tree-hero` items declare what their files now import.

**Files:**

- Modify: `registry/bases/base-ui/components/data-entry/tree-item.tsx` (rewritten), `.spec.tsx` (rewritten),
  `registry/bases/base-ui/examples/tree-hero.tsx` (rewritten), `apps/registry-ui/registry.json` (the `tree-item`
  and `tree-hero` items' `registryDependencies`)

**Interfaces:**

- Consumes: `ui/item` (`Item`), `ui/button`, `ui/input`, `lib/ime`.
- Produces: `TreeItem` (`Item` props + `expanded?`, `editing?`; `size` defaults to `xs`), `TreeItemIndent`
  (`span` props + `depth`, `indentStep?`, `baseIndent?`, `hasChildren`, `onToggleExpand`, `expandLabel?`,
  `collapseLabel?`; reads `expanded` from the row), `TreeItemLabel` (`div` props), `TreeItemRenameInput` (`Input`
  props + `onCommit`, `onCancel`), types `TreeItemProps`, `TreeItemIndentProps`, `TreeItemRenameInputProps`.
- Removed: `TreeItemRename` and the `icon`, `name`, `nameClassName`, `onActivate`, `onActivateDoubleClick`,
  `rename`, `inlineEnd`, `trailing`, `contextMenuContent` props; `TreeItemIndent`'s `expanded` and `children`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/tree-item.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/registry/bases/base-ui/ui/context-menu';
import { ItemActions, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput } from './tree-item';

afterEach(cleanup);

function row(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="tree-item"]')!;
}

describe('TreeItem', () => {
  it('renders the parts the consumer composes and hands the label click its raw event', () => {
    const onActivate = vi.fn();
    render(
      <TreeItem>
        <TreeItemIndent depth={0} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel onClick={onActivate}>
          <ItemTitle>Layer 1</ItemTitle>
        </TreeItemLabel>
        <ItemActions>
          <button type="button">Hide</button>
        </ItemActions>
      </TreeItem>,
    );

    fireEvent.click(screen.getByText('Layer 1'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate.mock.calls[0][0]).toHaveProperty('type', 'click');
    expect(row().contains(screen.getByRole('button', { name: 'Hide' }))).toBe(true);
  });

  it('carries data-expanded and data-editing from its props', () => {
    const { rerender } = render(
      <TreeItem>
        <TreeItemLabel>node</TreeItemLabel>
      </TreeItem>,
    );
    expect(row().hasAttribute('data-expanded')).toBe(false);
    expect(row().hasAttribute('data-editing')).toBe(false);

    rerender(
      <TreeItem expanded editing>
        <TreeItemLabel>node</TreeItemLabel>
      </TreeItem>,
    );
    expect(row().hasAttribute('data-expanded')).toBe(true);
    expect(row().hasAttribute('data-editing')).toBe(true);
  });

  it('forwards ref to the row div (React 19 ref-as-prop, no forwardRef)', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TreeItem ref={ref}>
        <TreeItemLabel>Layer 1</TreeItemLabel>
      </TreeItem>,
    );
    expect(ref.current).toBe(row());
  });

  it('opens a context menu the consumer wraps around the row', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <TreeItem>
              <TreeItemLabel>Layer 1</TreeItemLabel>
            </TreeItem>
          }
        />
        <ContextMenuContent>
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText('Layer 1'));
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeTruthy();
  });
});

describe('TreeItemIndent', () => {
  it('indents by baseIndent + depth * indentStep', () => {
    render(
      <TreeItem>
        <TreeItemIndent depth={2} indentStep={12} baseIndent={4} hasChildren={false} onToggleExpand={() => {}} />
      </TreeItem>,
    );
    const indent = document.querySelector<HTMLElement>('[data-slot="tree-item-indent"]');
    expect(indent?.style.paddingLeft).toBe('28px');
  });

  it('toggles via the chevron and stops propagation so the row is not selected', () => {
    const onToggleExpand = vi.fn();
    const onRowClick = vi.fn();
    render(
      <TreeItem onClick={onRowClick}>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={onToggleExpand} expandLabel="Expand node" />
      </TreeItem>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand node' }));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("names the disclosure from the row's expanded state", () => {
    render(
      <TreeItem expanded>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={() => {}} />
      </TreeItem>,
    );
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeTruthy();
  });

  it('renders an aligned spacer (no disclosure button) for a leaf', () => {
    render(
      <TreeItem>
        <TreeItemIndent depth={0} hasChildren={false} onToggleExpand={() => {}} />
      </TreeItem>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('TreeItemRenameInput', () => {
  function renderRename(handlers: { onCommit?: () => void; onCancel?: () => void; onKeyDown?: () => void }) {
    const onRowKeyDown = vi.fn();
    const onRowClick = vi.fn();
    render(
      <TreeItem editing onKeyDown={onRowKeyDown} onClick={onRowClick}>
        <TreeItemLabel>
          <TreeItemRenameInput
            defaultValue="Layer 1"
            onCommit={handlers.onCommit ?? (() => {})}
            onCancel={handlers.onCancel ?? (() => {})}
            onKeyDown={handlers.onKeyDown}
          />
        </TreeItemLabel>
      </TreeItem>,
    );
    return { input: screen.getByRole('textbox') as HTMLInputElement, onRowKeyDown, onRowClick };
  }

  it('cancels on Escape without the key reaching the row, and runs the consumer handler too', () => {
    const onCancel = vi.fn();
    const onKeyDown = vi.fn();
    const { input, onRowKeyDown } = renderRename({ onCancel, onKeyDown });

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onRowKeyDown).not.toHaveBeenCalled();
  });

  it('commits on blur, which Enter triggers', () => {
    const onCommit = vi.fn();
    const { input } = renderRename({ onCommit });

    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('keeps a click in the input from reaching the row', () => {
    const { input, onRowClick } = renderRename({});

    fireEvent.click(input);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/tree-item.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error|Test Files|^ +Tests '
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItem > renders the parts the consumer composes and hands the label click its raw event
TestingLibraryElementError: Unable to find an element with the text: Layer 1. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItem > carries data-expanded and data-editing from its props
AssertionError: expected false to be true // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItem > forwards ref to the row div (React 19 ref-as-prop, no forwardRef)
AssertionError: expected <div …(2)>…(2)</div> to be <div data-slot="tree-item" …(1)>…(1)</div> // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItem > opens a context menu the consumer wraps around the row
TestingLibraryElementError: Unable to find an element with the text: Layer 1. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItemIndent > indents by baseIndent + depth * indentStep
AssertionError: expected '' to be '28px' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItemIndent > toggles via the chevron and stops propagation so the row is not selected
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Expand node"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItemIndent > names the disclosure from the row's expanded state
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Collapse"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItemRenameInput > cancels on Escape without the key reaching the row, and runs the consumer handler too
TestingLibraryElementError: Unable to find an accessible element with the role "textbox"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItemRenameInput > commits on blur, which Enter triggers
TestingLibraryElementError: Unable to find an accessible element with the role "textbox"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tree-item.spec.tsx > TreeItemRenameInput > keeps a click in the input from reaching the row
TestingLibraryElementError: Unable to find an accessible element with the role "textbox"
 Test Files  1 failed (1)
      Tests  10 failed | 1 passed (11)
```

- [ ] **Step 3: Rewrite the family**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/tree-item.tsx`:

```text
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Item } from '@/registry/bases/base-ui/ui/item';
import { isImeComposing } from '@/registry/bases/base-ui/lib/ime';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface TreeItemContextValue {
  expanded: boolean;
}

const TreeItemContext = React.createContext<TreeItemContextValue | null>(null);

function useTreeItem(): TreeItemContextValue {
  const context = React.useContext(TreeItemContext);
  if (!context) throw new Error('TreeItemIndent must be used within <TreeItem>');
  return context;
}

interface TreeItemProps extends React.ComponentProps<typeof Item> {
  /** Whether the node's children are shown; sets `data-expanded` and names the disclosure. */
  expanded?: boolean;
  /** Whether the row is being renamed; sets `data-editing`. */
  editing?: boolean;
}

/**
 * One row of a hierarchy tree (a layer tree, a scene outliner, a file tree),
 * over upstream's `Item` at `size="xs"`. The row owns the shared rhythm and the
 * `group/tree-item` its parts style off; the consumer composes the rest: a
 * `TreeItemIndent`, a `TreeItemLabel` holding `ItemMedia` and `ItemTitle` (or a
 * `TreeItemRenameInput` while renaming), and `ItemActions` for trailing actions.
 * Selection and hover colour, row height and drag handlers go on the row itself.
 * A context menu wraps the row as `ContextMenuTrigger render={<TreeItem />}`.
 *
 * `ref` reaches the row div - a consumer needs it for `scrollIntoView`, and a
 * wrapping Base UI `render` trigger composes its ref through it.
 */
function TreeItem({
  expanded = false,
  editing = false,
  size = 'xs',
  className,
  ...props
}: TreeItemProps): React.ReactNode {
  const context = React.useMemo(() => ({ expanded }), [expanded]);
  return (
    <TreeItemContext.Provider value={context}>
      <Item
        data-slot="tree-item"
        data-expanded={expanded || undefined}
        data-editing={editing || undefined}
        size={size}
        className={cn('group/tree-item flex-nowrap gap-1 py-0 pr-1 pl-0 text-xs', className)}
        {...props}
      />
    </TreeItemContext.Provider>
  );
}

interface TreeItemIndentProps extends React.ComponentProps<'span'> {
  /** Nesting depth; 0 for roots. Drives the left indent. */
  depth: number;
  /** Pixels of indent added per depth level. Default 12. */
  indentStep?: number;
  /** Pixels of indent at depth 0. Default 0. */
  baseIndent?: number;
  /** Whether the node has children - shows the chevron vs. a same-width spacer. */
  hasChildren: boolean;
  /** Toggle expand/collapse. The chevron stops propagation so it never selects the row. */
  onToggleExpand: () => void;
  /** a11y label for the disclosure control when collapsed. */
  expandLabel?: string;
  /** a11y label for the disclosure control when expanded. */
  collapseLabel?: string;
}

/**
 * The row's depth indent (`baseIndent + depth * indentStep` px) and disclosure
 * control: a chevron that turns while the row is `expanded`, or a spacer for a
 * leaf so names stay aligned. Place it first in a `TreeItem`.
 */
function TreeItemIndent({
  depth,
  indentStep = 12,
  baseIndent = 0,
  hasChildren,
  onToggleExpand,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  className,
  style,
  ...props
}: TreeItemIndentProps): React.ReactNode {
  const { expanded } = useTreeItem();
  return (
    <span
      data-slot="tree-item-indent"
      className={cn('flex shrink-0 items-center', className)}
      style={{ paddingLeft: baseIndent + depth * indentStep, ...style }}
      {...props}
    >
      {hasChildren ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={expanded ? collapseLabel : expandLabel}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronRight className="transition-transform group-data-expanded/tree-item:rotate-90" />
        </Button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
    </span>
  );
}

/**
 * The row's clickable name region, holding `ItemMedia`, `ItemTitle` or a
 * `TreeItemRenameInput`, and any badges after the name. A plain `div`, not a
 * `<button>`: per the W3C tree view pattern the tree owns activation (roving
 * tabindex + Enter), and a `div` may hold the rename input where a button may
 * not. `onClick` receives the raw event, so a caller can read shift/meta.
 */
function TreeItemLabel({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="tree-item-label"
      className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-1', className)}
      {...props}
    />
  );
}

interface TreeItemRenameInputProps extends React.ComponentProps<typeof Input> {
  /** Called when the input loses focus, which Enter triggers: apply the draft. */
  onCommit: () => void;
  /** Called on Escape: drop the draft. */
  onCancel: () => void;
}

/**
 * The inline rename input: focused on mount, Enter commits (by blurring),
 * Escape cancels, and keys typed during IME composition are left to the IME.
 * Every other key, and every click and double-click, stops here, so none of
 * them selects, activates or renames the row underneath. The consumer owns the
 * draft (`value` + `onChange`).
 */
function TreeItemRenameInput({
  onCommit,
  onCancel,
  onBlur,
  onKeyDown,
  onClick,
  onDoubleClick,
  className,
  ...props
}: TreeItemRenameInputProps): React.ReactNode {
  return (
    <Input
      data-slot="tree-item-rename-input"
      autoFocus
      className={cn('min-w-0 flex-1', className)}
      onBlur={(event) => {
        onBlur?.(event);
        onCommit();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (isImeComposing(event.nativeEvent)) return;
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') onCancel();
        event.stopPropagation();
      }}
      onClick={(event) => {
        onClick?.(event);
        event.stopPropagation();
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        event.stopPropagation();
      }}
      {...props}
    />
  );
}

export { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput };
export type { TreeItemProps, TreeItemIndentProps, TreeItemRenameInputProps };
```

- [ ] **Step 4: Rewrite the hero and declare what the items import**

`apps/registry-ui/registry/bases/base-ui/examples/tree-hero.tsx`:

```text
'use client';

import type { ReactNode } from 'react';

import { TreeItem, TreeItemIndent, TreeItemLabel } from '@/registry/bases/base-ui/components/data-entry/tree-item';
import { ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** A small hierarchy - the TreeItem hero. */
export function TreeHero(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-1">
      <TreeItem expanded>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>src</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
      <TreeItem>
        <TreeItemIndent depth={1} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>index.ts</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
      <TreeItem>
        <TreeItemIndent depth={1} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>page.tsx</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
    </div>
  );
}
```

In `apps/registry-ui/registry.json` replace:

```text
      "registryDependencies": ["@shadcn/button", "@shadcn/context-menu", "@shadcn/input", "@shadcn/utils"],
```

with:

```text
      "registryDependencies": ["@shadcn/button", "@shadcn/input", "@shadcn/item", "@shadcn/utils"],
```

In `apps/registry-ui/registry.json` replace:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/tree-item.json"],
```

with:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/tree-item.json", "@shadcn/item"],
```

- [ ] **Step 5: Run the spec and watch it pass**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/tree-item.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

- [ ] **Step 6: Check the spec's rules hold, and the built item**

Run (from `apps/registry-ui/registry/bases/base-ui`), the spec's Checks restricted to this task's components:

```bash
F=(components/data-entry/tree-item.tsx)
grep -lnE '^export (function|const [A-Z])' "${F[@]}"
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" "${F[@]}"
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' "${F[@]}"
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' "${F[@]}"
```

Expected: nothing at all.

Then, after Step 7's `shadcn build` (from `apps/registry-ui`):

```bash
python3 -c "import json; print(json.load(open('public/r/tree-item.json'))['registryDependencies'])"
```

Expected: `['@shadcn/button', '@shadcn/input', '@shadcn/item', '@shadcn/utils']`.

- [ ] **Step 7: Run the gate**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-entry5.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-entry5.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-entry5.log" 2>&1; grep 'error TS' "$S/tsc-entry5.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/tree-item.tsx registry/bases/base-ui/components/data-entry/tree-item.spec.tsx registry/bases/base-ui/examples/tree-hero.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/tree-item.tsx registry/bases/base-ui/components/data-entry/tree-item.spec.tsx registry/bases/base-ui/examples/tree-hero.tsx 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-entry5.log" 2>&1; tail -1 "$S/sb-entry5.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  74 passed (74)
      Tests  397 passed (397)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline TS6307.)

- [ ] **Step 8: Commit**

`$S/msg-entry5.txt`:

```
refactor(registry-ui): let the consumer compose tree item rows

Why: TreeItem took its icon, name, badges, actions, rename wiring and
context menu as props, so every new kind of row content meant a new
prop, and it wrapped itself in a context menu the caller could not
shape. The row is now an Item the caller fills with upstream's Item
parts and three tree parts, and it reports expanded and editing on
data attributes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-entry5.txt" -- apps/registry-ui/registry/bases/base-ui/components/data-entry/tree-item.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/tree-item.spec.tsx apps/registry-ui/registry/bases/base-ui/examples/tree-hero.tsx apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 24: Stamp data-slot and data-visible, and compose handlers, on TagInput, PasswordInput, ResizeHandle

The three families keep their API and take the rules every family takes. `TagInput` spreads the `div` props it
was not asked for onto its root and carries `data-slot`. `PasswordInput` carries `data-slot` and `data-visible`
on its group. `ResizeHandle` spread the caller's props after its own handlers, so a caller's `onDoubleClick` or
`onPointerDown` silently replaced the toggle or the drag; it now composes each handler with the caller's.
`PasswordInput` gets its first spec. No file imports these families.

**Files:**

- Create: `registry/bases/base-ui/components/data-entry/password-input.spec.tsx`
- Modify: `registry/bases/base-ui/components/data-entry/tag-input.tsx` (rewritten) + `.spec.tsx`,
  `registry/bases/base-ui/components/data-entry/password-input.tsx` (rewritten),
  `registry/bases/base-ui/components/data-entry/resize-handle.tsx` (rewritten) + `.spec.tsx`

**Interfaces:**

- Produces: `TagInputProps` now extends `Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'>`; the other
  signatures are unchanged. New attributes: `data-slot="tag-input"`, `data-slot="password-input"`, `data-visible`.

- [ ] **Step 1: Write the failing specs**

In `apps/registry-ui/registry/bases/base-ui/components/data-entry/tag-input.spec.tsx` replace:

```text
    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).toHaveBeenCalledWith(['ui']);
  });
```

with:

```text
    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).toHaveBeenCalledWith(['ui']);
  });

  it('stamps its data-slot and passes the div props through to the root', () => {
    const { container } = render(<TagInput value={[]} onValueChange={vi.fn()} id="tags" aria-label="Tags" />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('data-slot')).toBe('tag-input');
    expect(root.id).toBe('tags');
    expect(root.getAttribute('aria-label')).toBe('Tags');
  });
```

In `apps/registry-ui/registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx` replace:

```text
    fireEvent.doubleClick(container.firstElementChild!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
```

with:

```text
    fireEvent.doubleClick(container.firstElementChild!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("runs the consumer's own pointer and double-click handlers beside its own", () => {
    const onToggle = vi.fn();
    const onDrag = vi.fn();
    const onDoubleClick = vi.fn();
    const onPointerDown = vi.fn();
    const { container } = render(
      <ResizeHandle onDrag={onDrag} onToggle={onToggle} onDoubleClick={onDoubleClick} onPointerDown={onPointerDown} />,
    );
    const handle = container.firstElementChild!;

    fireEvent.doubleClick(handle);
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 120, pointerId: 1 });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenCalledWith(10);
  });
```

`apps/registry-ui/registry/bases/base-ui/components/data-entry/password-input.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './password-input';

afterEach(cleanup);

describe('PasswordInput', () => {
  it('toggles the input between hidden and shown, and carries data-visible while shown', () => {
    const { container } = render(<PasswordInput aria-label="Password" />);
    const root = container.firstElementChild as HTMLElement;
    const input = screen.getByLabelText('Password') as HTMLInputElement;

    expect(root.getAttribute('data-slot')).toBe('password-input');
    expect(input.type).toBe('password');
    expect(root.hasAttribute('data-visible')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
    expect(root.hasAttribute('data-visible')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.type).toBe('password');
    expect(root.hasAttribute('data-visible')).toBe(false);
  });

  it('passes the input props through to the input', () => {
    const onChange = vi.fn();
    render(<PasswordInput aria-label="Password" name="secret" onChange={onChange} />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'hunter2' } });
    expect(input.name).toBe('secret');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/tag-input.spec.tsx registry/bases/base-ui/components/data-entry/password-input.spec.tsx registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error|Test Files|^ +Tests '
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/password-input.spec.tsx > PasswordInput > toggles the input between hidden and shown, and carries data-visible while shown
AssertionError: expected 'input-group' to be 'password-input' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx > ResizeHandle > runs the consumer's own pointer and double-click handlers beside its own
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/data-entry/tag-input.spec.tsx > TagInput > stamps its data-slot and passes the div props through to the root
AssertionError: expected null to be 'tag-input' // Object.is equality
 Test Files  3 failed (3)
      Tests  3 failed | 7 passed (10)
```

- [ ] **Step 3: Rewrite the three components**

`apps/registry-ui/registry/bases/base-ui/components/data-entry/tag-input.tsx`:

```text
import { X } from 'lucide-react';
import { useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface TagInputProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** The tags, in order; a duplicate is never added. */
  value: string[];
  /** Called with the whole next tag array on every add or remove. */
  onValueChange: (value: string[]) => void;
  /** Placeholder copy for the input. */
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A simple tag editor: existing tags as removable `Badge` chips above an `Input`
 * that commits on Enter / comma / blur. Backspace on an empty input drops the
 * last tag. Controlled - the consumer owns the tag array and supplies any
 * placeholder copy. Other props land on the root `div`.
 */
function TagInput({ value, onValueChange, placeholder, disabled, className, ...props }: TagInputProps): ReactNode {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onValueChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  };

  return (
    <div data-slot="tag-input" className={cn('space-y-2', className)} {...props}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onValueChange(value.filter((t) => t !== tag))}
                aria-label={`Remove ${tag}`}
                className="text-muted-foreground hover:text-foreground rounded-full"
                disabled={disabled}
              >
                <X />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export { TagInput };
export type { TagInputProps };
```

`apps/registry-ui/registry/bases/base-ui/components/data-entry/password-input.tsx`:

```text
import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/registry/bases/base-ui/ui/input-group';

/**
 * A password field - the `input-group` composition with a show/hide toggle in
 * the inline-end addon, packaged so call-sites never re-wire the eye button.
 * `className` sizes the group, which carries `data-visible` while the password
 * shows; remaining props (incl. `ref`/`onChange` for RHF `register`,
 * ref-as-prop in React 19) flow straight to the input.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>): React.ReactNode {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup data-slot="password-input" data-visible={visible || undefined} className={className}>
      <InputGroupInput {...props} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          variant="ghost"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
```

`apps/registry-ui/registry/bases/base-ui/components/data-entry/resize-handle.tsx`:

```text
import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { shouldStartDrag } from '@/registry/bases/base-ui/lib/resize-drag';

/**
 * A vertical resize grip for a side or floating panel. Stable by design: a
 * resize only begins once the pointer crosses a small movement threshold, so a
 * click, jitter, or double-click never nudges the width. Uses pointer capture so
 * the drag survives the pointer leaving the 1px grip, and `preventDefault` +
 * `touch-action: none` so it never steals focus or selects text. Double-click
 * fires `onToggle` (e.g. collapse/expand the panel).
 */
// `onDrag` below is a resize-width delta, not the native HTML5 drag event - omit
// the native handler so its signature does not clash with ours.
interface ResizeHandleProps extends Omit<React.ComponentProps<'div'>, 'onDrag'> {
  /** Width delta in px since the last move; apply it to the panel size. */
  onDrag: (dx: number) => void;
  /** Double-click action (e.g. collapse/expand the panel). */
  onToggle: () => void;
}

function ResizeHandle({
  onDrag,
  onToggle,
  className,
  onPointerDown: onPointerDownProp,
  onPointerMove: onPointerMoveProp,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onDoubleClick,
  ...props
}: ResizeHandleProps): React.ReactNode {
  const downX = useRef(0);
  const lastX = useRef(0);
  const armed = useRef(false);
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    armed.current = true;
    dragging.current = false;
    downX.current = e.clientX;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!armed.current) return;
      if (!dragging.current) {
        // Don't resize until the pointer has moved past the threshold - a click,
        // jitter, or double-click leaves the width untouched.
        if (!shouldStartDrag(downX.current, e.clientX)) return;
        dragging.current = true;
        lastX.current = e.clientX;
      }
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      if (dx !== 0) onDrag(dx);
    },
    [onDrag],
  );

  const end = useCallback(() => {
    armed.current = false;
    dragging.current = false;
  }, []);

  return (
    <div
      data-slot="resize-handle"
      className={cn(
        'group/handle bg-border hover:bg-primary/50 active:bg-primary relative z-40 flex w-px shrink-0 cursor-col-resize touch-none items-center justify-center transition-colors select-none after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2',
        className,
      )}
      onPointerDown={(event) => {
        onPointerDownProp?.(event);
        onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMoveProp?.(event);
        onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        end();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        end();
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        end();
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        onToggle();
      }}
      {...props}
    >
      <div className="bg-border group-hover/handle:bg-primary/50 z-10 flex h-8 w-1 shrink-0 rounded-full transition-colors" />
    </div>
  );
}

export { ResizeHandle };
export type { ResizeHandleProps };
```

- [ ] **Step 4: Run the specs and watch them pass**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/bases/base-ui/components/data-entry/tag-input.spec.tsx registry/bases/base-ui/components/data-entry/password-input.spec.tsx registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  3 passed (3)
      Tests  10 passed (10)
```

- [ ] **Step 5: Check the spec's rules hold**

Run (from `apps/registry-ui/registry/bases/base-ui`), the spec's Checks restricted to this task's components:

```bash
F=(components/data-entry/tag-input.tsx components/data-entry/password-input.tsx components/data-entry/resize-handle.tsx)
grep -lnE '^export (function|const [A-Z])' "${F[@]}"
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" "${F[@]}"
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' "${F[@]}"
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' "${F[@]}"
```

Expected: nothing at all.

- [ ] **Step 6: Run the gate**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-entry6.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-entry6.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-entry6.log" 2>&1; grep 'error TS' "$S/tsc-entry6.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/data-entry/tag-input.tsx registry/bases/base-ui/components/data-entry/tag-input.spec.tsx registry/bases/base-ui/components/data-entry/password-input.tsx registry/bases/base-ui/components/data-entry/password-input.spec.tsx registry/bases/base-ui/components/data-entry/resize-handle.tsx registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/bases/base-ui/components/data-entry/tag-input.tsx registry/bases/base-ui/components/data-entry/tag-input.spec.tsx registry/bases/base-ui/components/data-entry/password-input.tsx registry/bases/base-ui/components/data-entry/password-input.spec.tsx registry/bases/base-ui/components/data-entry/resize-handle.tsx registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx 2>&1 | tail -1
pnpm exec shadcn build > "$S/sb-entry6.log" 2>&1; tail -1 "$S/sb-entry6.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  75 passed (75)
      Tests  401 passed (401)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline TS6307.)

- [ ] **Step 7: Commit**

`$S/msg-entry6.txt`:

```
fix(registry-ui): compose caller handlers on the resize handle

Why: ResizeHandle spread the caller's props after its own handlers, so
a caller's onDoubleClick or onPointerDown replaced the toggle or the
drag without a word. Each handler now runs the caller's and its own.
TagInput and PasswordInput take the same rules on the way: TagInput
passes its div props to the root, and both carry a data-slot, with
PasswordInput reporting data-visible.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/components/data-entry/password-input.spec.tsx
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-entry6.txt" -- apps/registry-ui/registry/bases/base-ui/components/data-entry/tag-input.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/tag-input.spec.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/password-input.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/password-input.spec.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/resize-handle.tsx apps/registry-ui/registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

## Panels and layout atoms

All paths in these tasks are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`. Every Run is from `apps/registry-ui`. `$S` is the plan's scratch directory. The gate block at the end of each task is the same five commands; only the log tag and the eslint paths change.

---

### Task 25: PanelFieldGroup takes columns through `--cols`; PanelRow takes its action as a part

The house `PanelFieldGroup` wrote a computed `grid-template-columns` inline, which a `grid-cols-*` class could not replace. It now writes only a `--cols` variable that its own recipe's template reads, so a class replaces the template through the class merge. `PanelRow` stops wrapping its children in a `PanelFieldGroup` and stops taking `action` and `cols` props: the consumer composes `PanelFieldGroup` and the new `PanelRowAction`, and the action column is part of the row's grid template, so it is reserved with or without an action. Spec defect 3 (the house `FieldGroup` took upstream's name and `data-slot`) was already fixed by plan A's rename to `PanelRow`; a case now pins it, and it cannot fail first.

**Files:**

- Modify: `components/layout/panel-field-group.tsx` (rewritten), `components/layout/panel-field-group.spec.tsx` (rewritten), `components/layout/panel-row.tsx` (rewritten), `components/layout/panel-row.spec.tsx` (rewritten), `examples/field-group-hero.tsx` (rewritten), `apps/registry-ui/registry.json` (the `field-group` and `field-group-hero` items)

**Interfaces:**

- Consumes: the Task 1 tree.
- Produces: `PanelFieldGroup(props: ComponentProps<'div'> & { cols?: number }): ReactNode`, `type PanelFieldGroupProps`; `PanelRow(props: ComponentProps<'div'>): ReactNode`, `PanelRowAction(props: ComponentProps<'div'>): ReactNode`.
- Removed: `PanelRow`'s `action` and `cols` props; `PanelRow` no longer renders a `PanelFieldGroup`.

- [ ] **Step 1: Write the failing specs**

`components/layout/panel-field-group.spec.tsx`:

```text
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelFieldGroup } from './panel-field-group';

afterEach(cleanup);

describe('PanelFieldGroup', () => {
  it('bakes the curated grid + gap decision', () => {
    const { container } = render(
      <PanelFieldGroup>
        <span>a</span>
        <span>b</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('gap-x-2');
    expect(grid.className).toContain('gap-y-1');
  });

  it('hands a runtime column count to the grid through the --cols variable', () => {
    const { container } = render(
      <PanelFieldGroup cols={3}>
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.getPropertyValue('--cols')).toBe('3');
    expect(grid.style.gridTemplateColumns).toBe('');
    expect(grid.className).toContain('grid-cols-[repeat(var(--cols,1),minmax(0,1fr))]');
  });

  it('lets a grid-cols class replace the variable-driven template', () => {
    const { container } = render(
      <PanelFieldGroup className="grid-cols-3">
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-3');
    expect(grid.className).not.toContain('var(--cols');
  });

  it('keeps a caller style beside the column variable', () => {
    const { container } = render(
      <PanelFieldGroup cols={2} style={{ rowGap: '0px' }}>
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.getPropertyValue('--cols')).toBe('2');
    expect(grid.style.rowGap).toBe('0px');
  });

  it('forwards arbitrary props and stamps data-slot on the grid element', () => {
    const { getByTestId } = render(
      <PanelFieldGroup data-testid="grid">
        <span>a</span>
      </PanelFieldGroup>,
    );
    expect(getByTestId('grid').getAttribute('data-slot')).toBe('panel-field-group');
  });
});
```

`components/layout/panel-row.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';

import { PanelFieldGroup } from './panel-field-group';
import { PanelRow, PanelRowAction } from './panel-row';

afterEach(cleanup);

describe('PanelRow', () => {
  it('renders the fields and the action the consumer composes', () => {
    render(
      <PanelRow>
        <PanelFieldGroup cols={2}>
          <span>x</span>
          <span>y</span>
        </PanelFieldGroup>
        <PanelRowAction>
          <button type="button">lock</button>
        </PanelRowAction>
      </PanelRow>,
    );
    expect(screen.getByText('x')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'lock' }).closest('[data-slot="panel-row-action"]')).toBeTruthy();
  });

  it('reserves the action column in the row template, with or without an action', () => {
    render(
      <PanelRow data-testid="row">
        <span>x</span>
      </PanelRow>,
    );
    expect(screen.getByTestId('row').className).toContain('grid-cols-[minmax(0,1fr)_minmax(--spacing(9),auto)]');
  });

  it('merges className and forwards arbitrary props onto the row', () => {
    render(
      <PanelRow className="mt-2" data-testid="row">
        <span>x</span>
      </PanelRow>,
    );
    const row = screen.getByTestId('row');
    expect(row.className).toContain('grid');
    expect(row.className).toContain('mt-2');
    expect(row.getAttribute('data-slot')).toBe('panel-row');
  });

  it('is not a field group, so upstream field-group selectors never match it', () => {
    render(
      <PanelRow data-testid="row">
        <Field orientation="responsive">
          <FieldLabel>Width</FieldLabel>
        </Field>
      </PanelRow>,
    );
    const row = screen.getByTestId('row');
    expect(row.className).not.toContain('group/field-group');
    expect(row.className).not.toContain('@container/field-group');
    expect(screen.getByRole('group').closest('[data-slot="field-group"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/panel-field-group.spec.tsx registry/bases/base-ui/components/layout/panel-row.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error:|Test Files|^ +Tests'
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/panel-field-group.spec.tsx > PanelFieldGroup > hands a runtime column count to the grid through the --cols variable
AssertionError: expected '' to be '3' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/panel-field-group.spec.tsx > PanelFieldGroup > keeps a caller style beside the column variable
AssertionError: expected '' to be '2' // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/panel-row.spec.tsx > PanelRow > renders the fields and the action the consumer composes
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/panel-row.spec.tsx > PanelRow > reserves the action column in the row template, with or without an action
AssertionError: expected 'flex items-end gap-1' to contain 'grid-cols-[minmax(0,1fr)_minmax(--spa…'
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/panel-row.spec.tsx > PanelRow > merges className and forwards arbitrary props onto the row
AssertionError: expected 'flex items-end gap-1 mt-2' to contain 'grid'
 Test Files  2 failed (2)
      Tests  5 failed | 4 passed (9)
```

The case `is not a field group, so upstream field-group selectors never match it` passes already: plan A's rename removed the clash, so it is a pin, not a red.

- [ ] **Step 3: Rewrite `PanelFieldGroup` and `PanelRow`**

`components/layout/panel-field-group.tsx`:

```text
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface PanelFieldGroupProps extends ComponentProps<'div'> {
  /**
   * Column count, written to the `--cols` variable the grid template reads, so a
   * count known only at runtime (`cols={axes.length}`) works. Omit it for one
   * column, or pass a `grid-cols-*` class, which replaces the template.
   */
  cols?: number;
}

/**
 * The tight grid for paired and triplet inputs (X + Y, W + H, count + gutter +
 * margin) in a property panel: one gutter decision, any number of columns.
 */
function PanelFieldGroup({ cols, className, style, ...props }: PanelFieldGroupProps): ReactNode {
  return (
    <div
      data-slot="panel-field-group"
      className={cn('grid grid-cols-[repeat(var(--cols,1),minmax(0,1fr))] gap-x-2 gap-y-1', className)}
      style={cols === undefined ? style : ({ '--cols': cols, ...style } as CSSProperties)}
      {...props}
    />
  );
}

export { PanelFieldGroup };
export type { PanelFieldGroupProps };
```

The `as CSSProperties` is upstream's own spelling for a custom property in `style` (`ui/sidebar.tsx` writes `--sidebar-width` the same way); React's `CSSProperties` has no index for `--*` keys.

`components/layout/panel-row.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * One row of a property section: the fields (usually a `PanelFieldGroup`) and a
 * trailing `PanelRowAction`. The action column is part of the row's template,
 * at least one icon-button wide whether an action is composed or not, so every
 * row in a panel shares the same right edge.
 */
function PanelRow({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="panel-row"
      className={cn('grid grid-cols-[minmax(0,1fr)_minmax(--spacing(9),auto)] items-end gap-1', className)}
      {...props}
    />
  );
}

/** The trailing action of a `PanelRow`, such as an aspect-lock toggle or a reset button, centred in its column. */
function PanelRowAction({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="panel-row-action" className={cn('col-start-2 flex justify-center', className)} {...props} />;
}

export { PanelRow, PanelRowAction };
```

`minmax(--spacing(9),auto)` compiles (Tailwind 4.3.3) to `minmax(calc(var(--spacing) * 9),auto)`, so the reserved column follows the spacing scale.

- [ ] **Step 4: Compose the hero from the parts**

`examples/field-group-hero.tsx`:

```text
import { LockIcon } from 'lucide-react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { PanelRow, PanelRowAction } from '@/registry/bases/base-ui/components/layout/panel-row';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A two-column `PanelFieldGroup` in a `PanelRow` with a trailing lock action - the PanelRow hero. */
export function FieldGroupHero() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PanelRow>
        <PanelFieldGroup cols={2}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preview-x">X</Label>
            <Input id="preview-x" defaultValue="100" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preview-y">Y</Label>
            <Input id="preview-y" defaultValue="200" />
          </div>
        </PanelFieldGroup>
        <PanelRowAction>
          <Button variant="ghost" size="icon" aria-label="Lock aspect ratio">
            <LockIcon />
          </Button>
        </PanelRowAction>
      </PanelRow>
    </div>
  );
}
```

- [ ] **Step 5: Declare what the two items now import**

In `apps/registry-ui/registry.json`, the `field-group` item no longer imports `panel-field-group`:

old:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/field-grid.json", "@shadcn/utils"],
```

new:

```text
      "registryDependencies": ["@shadcn/utils"],
```

and the `field-group-hero` item imports both families, `Button` and `lucide-react`:

old:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/field-group.json", "@shadcn/input", "@shadcn/label"],
```

new:

```text
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "https://ui.zeroxsolutions.com/r/field-group.json",
        "https://ui.zeroxsolutions.com/r/field-grid.json",
        "@shadcn/button",
        "@shadcn/input",
        "@shadcn/label"
      ],
```

- [ ] **Step 6: Run the specs, the type check, lint and the registry build**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/panel-field-group.spec.tsx registry/bases/base-ui/components/layout/panel-row.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-panels-1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-panels-1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-panels-1.log" 2>&1; grep 'error TS' "$S/tsc-panels-1.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/panel-field-group.tsx registry/bases/base-ui/components/layout/panel-field-group.spec.tsx registry/bases/base-ui/components/layout/panel-row.tsx registry/bases/base-ui/components/layout/panel-row.spec.tsx registry/bases/base-ui/examples/field-group-hero.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-panels-1.log" 2>&1; tail -1 "$S/sb-panels-1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  2 passed (2)
      Tests  9 passed (9)
 Test Files  72 passed (72)
      Tests  380 passed (380)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

- [ ] **Step 7: Commit**

`$S/msg-panels-1.txt`:

```
refactor(registry-ui): compose panel rows from a field group and an action

Why: PanelRow wrapped whatever it was given in a PanelFieldGroup and
took the trailing control as an action prop, so a row could not hold
anything but a field grid and the action had no part of its own to
style. PanelFieldGroup wrote its column template inline, where a
grid-cols class could not replace it. The row now reserves the action
column in its own grid template, the consumer composes the field group
and PanelRowAction, and the field group hands its count to the template
through --cols. A spec pins that upstream field-group selectors do not
match a PanelRow.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-panels-1.txt" -- $B/components/layout/panel-field-group.tsx $B/components/layout/panel-field-group.spec.tsx \
  $B/components/layout/panel-row.tsx $B/components/layout/panel-row.spec.tsx $B/examples/field-group-hero.tsx apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 26: PanelHeader draws its rule as a border

`PanelHeader` appended an upstream `<Separator />` after its children, an extra element with a `separator` role for what is a box edge. The root now carries `border-b`. All four parts already took `ComponentProps<'div'>`-shaped props; they now name `ComponentProps<'div'>` and their return type.

**Files:**

- Modify: `components/layout/panel-header.tsx` (rewritten), `components/layout/panel-header.spec.tsx` (rewritten)

**Interfaces:**

- Consumes: the Task 25 tree.
- Produces: `PanelHeader`, `PanelHeaderRow`, `PanelHeaderTitle`, `PanelHeaderActions`, each `(props: ComponentProps<'div'>): ReactNode`.
- Removed: the trailing `Separator` element.

- [ ] **Step 1: Write the failing spec**

`components/layout/panel-header.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelHeader, PanelHeaderActions, PanelHeaderRow, PanelHeaderTitle } from './panel-header';

afterEach(cleanup);

describe('PanelHeader', () => {
  it('renders the composed rows, title and actions', () => {
    render(
      <PanelHeader>
        <PanelHeaderRow>
          <PanelHeaderTitle>Title</PanelHeaderTitle>
          <PanelHeaderActions>
            <button type="button">x</button>
          </PanelHeaderActions>
        </PanelHeaderRow>
      </PanelHeader>,
    );
    expect(screen.getByText('Title').getAttribute('data-slot')).toBe('panel-header-title');
    expect(screen.getByRole('button', { name: 'x' }).closest('[data-slot="panel-header-actions"]')).toBeTruthy();
  });

  it('draws its bottom rule as a border, with no separator element', () => {
    const { container } = render(
      <PanelHeader data-testid="header">
        <PanelHeaderRow>row</PanelHeaderRow>
      </PanelHeader>,
    );
    expect(screen.getByTestId('header').className).toContain('border-b');
    expect(container.querySelector('[data-slot="separator"],[role="separator"]')).toBeNull();
  });

  it('merges className and forwards props on every part', () => {
    render(
      <PanelHeader className="bg-card" id="header">
        <PanelHeaderRow className="pb-1.5" data-testid="row">
          <PanelHeaderTitle aria-label="title" />
        </PanelHeaderRow>
      </PanelHeader>,
    );
    const row = screen.getByTestId('row');
    expect(row.className).toContain('pb-1.5');
    expect(row.parentElement?.id).toBe('header');
    expect(row.parentElement?.className).toContain('bg-card');
    expect(screen.getByLabelText('title').getAttribute('data-slot')).toBe('panel-header-title');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/panel-header.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error:|Test Files|^ +Tests'
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/panel-header.spec.tsx > PanelHeader > draws its bottom rule as a border, with no separator element
AssertionError: expected 'flex shrink-0 flex-col' to contain 'border-b'
 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

- [ ] **Step 3: Rewrite `PanelHeader`**

`components/layout/panel-header.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The top strip of a side panel: one or more `PanelHeaderRow`s over a bottom
 * border. It paints no background, so it takes its panel's (usually `bg-card`).
 *
 *   <PanelHeader>
 *     <PanelHeaderRow>
 *       <PanelHeaderTitle>title + menu trigger</PanelHeaderTitle>
 *       <PanelHeaderActions>collapse button</PanelHeaderActions>
 *     </PanelHeaderRow>
 *   </PanelHeader>
 */
function PanelHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="panel-header" className={cn('flex shrink-0 flex-col border-b', className)} {...props} />;
}

/** One fixed-height row of the header. */
function PanelHeaderRow({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="panel-header-row" className={cn('flex h-9 items-center gap-1 px-2', className)} {...props} />;
}

/** The row's growing leading part: the title and anything inline with it. */
function PanelHeaderTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="panel-header-title"
      className={cn('flex min-w-0 flex-1 items-center gap-1', className)}
      {...props}
    />
  );
}

/** The row's trailing buttons; never shrinks. */
function PanelHeaderActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="panel-header-actions" className={cn('flex shrink-0 items-center gap-0.5', className)} {...props} />
  );
}

export { PanelHeader, PanelHeaderRow, PanelHeaderTitle, PanelHeaderActions };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/panel-header.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-panels-2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-panels-2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-panels-2.log" 2>&1; grep 'error TS' "$S/tsc-panels-2.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/panel-header.tsx registry/bases/base-ui/components/layout/panel-header.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-panels-2.log" 2>&1; tail -1 "$S/sb-panels-2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
 Test Files  72 passed (72)
      Tests  382 passed (382)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

- [ ] **Step 5: Commit**

`$S/msg-panels-2.txt`:

```
refactor(registry-ui): draw the panel header rule as a border

Why: PanelHeader appended a Separator element after its rows, a
separator role in the accessibility tree for what is only the header's
bottom edge. The root now carries border-b, and every part names its
props and return type.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-panels-2.txt" -- $B/components/layout/panel-header.tsx $B/components/layout/panel-header.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 27: PanelFieldLabel, IconChip and IconLabel keep only their element

`LabeledControl` re-assembled upstream `Field` and `FieldLabel` around a label prop; what it added was the label recipe, which becomes `PanelFieldLabel` in `general/panel-field-label.tsx`, and the consumer composes upstream `Field` around it. `IconChip` and `IconLabel` each rendered a `Tooltip` around their element and took the glyph and the tooltip text as props; each is now the element alone, takes the glyph as children and the tint as `className`, and the consumer composes `Tooltip*` around it. `IconChip`'s `rounded-[5px]` moves onto the scale as `rounded-sm` (6px at the theme's `--radius`).

**Files:**

- Create: `components/general/panel-field-label.tsx`, `components/general/panel-field-label.spec.tsx`
- Delete: `components/general/labeled-control.tsx`, `components/general/labeled-control.spec.tsx`
- Modify: `components/general/icon-chip.tsx` (rewritten), `components/general/icon-chip.spec.tsx` (rewritten), `components/general/icon-label.tsx` (rewritten), `components/general/icon-label.spec.tsx` (rewritten)

No file imports `LabeledControl`, `IconChip` or `IconLabel` outside their own specs (`grep -rn "labeled-control\|icon-chip'\|icon-label'" registry src` finds only those), and none of the three is a registry item.

**Interfaces:**

- Consumes: the Task 26 tree.
- Produces: `PanelFieldLabel(props: ComponentProps<typeof FieldLabel>): ReactNode`; `IconChip(props: ComponentProps<'span'>): ReactNode`; `IconLabel(props: ComponentProps<'span'>): ReactNode`.
- Removed: `LabeledControl`; `IconChip`'s `icon`, `label` and `tint` props and `type IconChipProps`; `IconLabel`'s `icon` and `tooltip` props.

- [ ] **Step 1: Write the failing specs**

`components/general/panel-field-label.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@/registry/bases/base-ui/ui/field';

import { PanelFieldLabel } from './panel-field-label';

afterEach(cleanup);

describe('PanelFieldLabel', () => {
  it('labels the control of the upstream Field it sits in', () => {
    render(
      <Field>
        <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
        <input id="fill" />
      </Field>,
    );
    expect(screen.getByLabelText('Fill').id).toBe('fill');
  });

  it('carries the compact muted label recipe and merges className', () => {
    render(<PanelFieldLabel className="mt-1">Fill</PanelFieldLabel>);
    const label = screen.getByText('Fill');
    expect(label.className).toContain('text-xs');
    expect(label.className).toContain('text-muted-foreground');
    expect(label.className).toContain('mt-1');
  });

  it('keeps upstream field-label slot so Field selectors still reach it', () => {
    render(<PanelFieldLabel>Fill</PanelFieldLabel>);
    expect(screen.getByText('Fill').getAttribute('data-slot')).toBe('field-label');
  });
});
```

`components/general/icon-chip.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

import { IconChip } from './icon-chip';

beforeAll(() => {
  // Base UI's tooltip positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('IconChip', () => {
  it('renders the icon inside a chip tinted by className', () => {
    render(
      <IconChip aria-label="Vision input" className="bg-emerald-500/15 text-emerald-600">
        <svg data-testid="glyph" />
      </IconChip>,
    );
    const chip = screen.getByLabelText('Vision input');
    expect(chip.getAttribute('data-slot')).toBe('icon-chip');
    expect(chip.contains(screen.getByTestId('glyph'))).toBe(true);
    expect(chip.className).toContain('rounded-sm');
    expect(chip.className).toContain('bg-emerald-500/15');
  });

  it('takes the trigger props of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconChip aria-label="Reasoning" />}>
            <svg />
          </TooltipTrigger>
          <TooltipContent>Reasoning</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const chip = screen.getByLabelText('Reasoning');
    expect(chip.className).toContain('size-5');
    expect(chip.hasAttribute('data-popup-open')).toBe(true);
    expect(screen.getByText('Reasoning', { selector: '[data-slot="tooltip-content"]' })).toBeTruthy();
  });
});
```

`components/general/icon-label.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

import { IconLabel } from './icon-label';

beforeAll(() => {
  // Base UI's tooltip positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('IconLabel', () => {
  it('holds the icon it is given and sizes an unsized svg to the compact glyph', () => {
    render(
      <IconLabel aria-label="Rotation">
        <svg data-testid="star" />
      </IconLabel>,
    );
    const label = screen.getByLabelText('Rotation');
    expect(label.getAttribute('data-slot')).toBe('icon-label');
    expect(label.contains(screen.getByTestId('star'))).toBe(true);
    expect(label.className).toContain("[&_svg:not([class*='size-'])]:size-3");
  });

  it('merges className and forwards arbitrary props onto the span', () => {
    render(
      <IconLabel className="ml-auto" data-testid="label">
        <svg />
      </IconLabel>,
    );
    const label = screen.getByTestId('label');
    expect(label.className).toContain('text-muted-foreground');
    expect(label.className).toContain('ml-auto');
  });

  it('takes the trigger props of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
            <svg />
          </TooltipTrigger>
          <TooltipContent>Rotation</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const label = screen.getByLabelText('Rotation');
    expect(label.className).toContain('text-muted-foreground');
    expect(label.hasAttribute('data-popup-open')).toBe(true);
    expect(screen.getByText('Rotation', { selector: '[data-slot="tooltip-content"]' })).toBeTruthy();
  });
});
```

The tooltip cases pass `open` rather than hovering: the tooltip does not open from a synthetic pointer event in jsdom, and what the case holds is that the chip takes the trigger's props (`data-popup-open`) when composed through `render`.

- [ ] **Step 2: Run them and watch them fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/general 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error:|Test Files|^ +Tests'
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/general/panel-field-label.spec.tsx [ registry/bases/base-ui/components/general/panel-field-label.spec.tsx ]
Error: Failed to resolve import "./panel-field-label" from "registry/bases/base-ui/components/general/panel-field-label.spec.tsx". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/general/icon-chip.spec.tsx > IconChip > renders the icon inside a chip tinted by className
TestingLibraryElementError: Unable to find a label with the text of: Vision input
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/general/icon-chip.spec.tsx > IconChip > takes the trigger props of a tooltip the consumer composes around it
TestingLibraryElementError: Unable to find a label with the text of: Reasoning
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/general/icon-label.spec.tsx > IconLabel > holds the icon it is given and sizes an unsized svg to the compact glyph
AssertionError: expected 'text-muted-foreground flex items-cent…' to contain '[&_svg:not([class*=\'size-\'])]:size-3'
 Test Files  3 failed (3)
      Tests  3 failed | 2 passed (5)
```

- [ ] **Step 3: Create `PanelFieldLabel` and delete `LabeledControl`**

`components/general/panel-field-label.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The dense, muted label a property panel puts over a control that has no
 * inline label of its own (a colour swatch, a custom picker). Compose it inside
 * an upstream `Field`:
 *
 *   <Field className="gap-1">
 *     <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
 *     <ColorSwatch id="fill" />
 *   </Field>
 *
 * It keeps upstream's `data-slot="field-label"`, which the `Field` recipes select on.
 */
function PanelFieldLabel({ className, ...props }: ComponentProps<typeof FieldLabel>): ReactNode {
  return <FieldLabel className={cn('text-muted-foreground text-xs font-normal', className)} {...props} />;
}

export { PanelFieldLabel };
```

Run (from the repo root):

```bash
git rm -q apps/registry-ui/registry/bases/base-ui/components/general/labeled-control.tsx apps/registry-ui/registry/bases/base-ui/components/general/labeled-control.spec.tsx
```

- [ ] **Step 4: Rewrite `IconChip` and `IconLabel`**

`components/general/icon-chip.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A small square holding one glyph, tinted by the caller's `className` (the
 * design system ships no tint). It carries no meaning of its own, so one chip
 * serves model abilities, generation types or any icon the caller picks. Give
 * it an `aria-label`, and compose a tooltip around it when the glyph needs words:
 *
 *   <Tooltip>
 *     <TooltipTrigger render={<IconChip aria-label="Vision input" className="bg-emerald-500/15 text-emerald-600" />}>
 *       <Eye className="size-3" />
 *     </TooltipTrigger>
 *     <TooltipContent>Vision input</TooltipContent>
 *   </Tooltip>
 */
function IconChip({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="icon-chip"
      className={cn('flex size-5 items-center justify-center rounded-sm', className)}
      {...props}
    />
  );
}

export { IconChip };
```

`components/general/icon-label.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * An icon standing in for a field's text label in a dense panel. Give it an
 * `aria-label`, and compose a tooltip around it to reveal the meaning on hover:
 *
 *   <Tooltip>
 *     <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
 *       <RotateCw />
 *     </TooltipTrigger>
 *     <TooltipContent>Rotation</TooltipContent>
 *   </Tooltip>
 *
 * An svg child with no `size-*` class of its own is drawn at `size-3`.
 */
function IconLabel({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="icon-label"
      className={cn("text-muted-foreground flex items-center [&_svg:not([class*='size-'])]:size-3", className)}
      {...props}
    />
  );
}

export { IconLabel };
```

- [ ] **Step 5: Run the specs, the type check, lint and the registry build**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/general 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-panels-3.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-panels-3.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-panels-3.log" 2>&1; grep 'error TS' "$S/tsc-panels-3.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/general 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-panels-3.log" 2>&1; tail -1 "$S/sb-panels-3.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  3 passed (3)
      Tests  8 passed (8)
 Test Files  72 passed (72)
      Tests  383 passed (383)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

- [ ] **Step 6: Commit**

`$S/msg-panels-3.txt`:

```
refactor(registry-ui): leave field and tooltip composition to the consumer

Why: LabeledControl, IconChip and IconLabel each re-assembled upstream
parts (Field and FieldLabel, Tooltip) around content props, so a caller
could not change the field's orientation, the tooltip's side or the
glyph's element without forking them. Each is now the element it adds:
PanelFieldLabel is the compact label recipe on FieldLabel, IconChip and
IconLabel are spans that take their glyph as children and forward the
props a TooltipTrigger render hands them. IconChip's 5px radius moves
onto the radius scale.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/components/general/panel-field-label.tsx $B/components/general/panel-field-label.spec.tsx
git commit -q -F "$S/msg-panels-3.txt" -- $B/components/general
git status --short -- $B/components/general
git log -1 --format='%h %s'
```

Expected: the status line prints nothing; the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 28: PageContainer, Center and FloatingToolbar take the rules every family takes

A pure reshape plus one prop removed. Each root names its return type and its doc comment is rewritten in plain ASCII; `Center`'s comment moves from the recipe onto the component it describes. `FloatingToolbar` drops `label`, which only set `aria-label` (a caller's `aria-label` already overrode it through the spread); its one importer, the mermaid preview, passes `aria-label`. `Center` had no spec; one pins its recipe, its `data-slot` and its `render` prop. `Center` keeps its subject-less name, the spec's written deviation: it is a layout atom whose identity is the centring.

**Files:**

- Create: `components/layout/center.spec.tsx`
- Modify: `components/layout/center.tsx` (rewritten), `components/layout/page-container.tsx` (rewritten), `components/layout/floating-toolbar.tsx` (rewritten), `components/layout/floating-toolbar.spec.tsx` (rewritten), `editor/mermaid/react/preview.tsx`

**Interfaces:**

- Consumes: the Task 27 tree.
- Produces: `Center(props: useRender.ComponentProps<'div'> & VariantProps<typeof centerVariants>): ReactNode`, `centerVariants`; `PageContainer(props: PageContainerProps): ReactNode`, `pageContainerVariants`, `type PageContainerProps`; `FloatingToolbar(props: ComponentProps<'div'>): ReactNode`.
- Removed: `FloatingToolbar`'s `label` prop (pass `aria-label`).

- [ ] **Step 1: Pin `Center` and move the toolbar spec onto `aria-label`**

`components/layout/center.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Center } from './center';

afterEach(cleanup);

describe('Center', () => {
  it('centres its children on both axes in block flow by default', () => {
    render(<Center data-testid="center">x</Center>);
    const center = screen.getByTestId('center');
    expect(center.tagName).toBe('DIV');
    expect(center.getAttribute('data-slot')).toBe('center');
    expect(center.className).toContain('items-center');
    expect(center.className).toContain('justify-center');
    expect(center.className).toContain('flex');
    expect(center.className).not.toContain('inline-flex');
  });

  it('switches to inline flow with inline', () => {
    render(
      <Center inline data-testid="center">
        x
      </Center>,
    );
    expect(screen.getByTestId('center').className).toContain('inline-flex');
  });

  it('renders the element the consumer passes through render, keeping the recipe and className', () => {
    render(<Center render={<main />} className="h-screen" />);
    const main = screen.getByRole('main');
    expect(main.getAttribute('data-slot')).toBe('center');
    expect(main.className).toContain('items-center');
    expect(main.className).toContain('h-screen');
  });
});
```

`components/layout/floating-toolbar.spec.tsx`:

```text
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FloatingToolbar } from './floating-toolbar';

afterEach(cleanup);

describe('FloatingToolbar', () => {
  it('renders a toolbar landmark named by its aria-label around its children', () => {
    render(
      <FloatingToolbar aria-label="Tools">
        <button type="button">tool</button>
      </FloatingToolbar>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Tools' });
    expect(toolbar.getAttribute('data-slot')).toBe('floating-toolbar');
    expect(toolbar.className).toContain('pointer-events-auto');
    expect(screen.getByRole('button', { name: 'tool' }).parentElement).toBe(toolbar);
  });

  it('owns only the visual shell identity, not outer placement', () => {
    render(<FloatingToolbar aria-label="Tools">x</FloatingToolbar>);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.className).toContain('bg-card/95');
    expect(toolbar.className).toContain('rounded-sm');
    // Placement is the consumer's; it is not baked into the shell identity.
    expect(toolbar.className).not.toContain('absolute');
    expect(toolbar.className).not.toContain('bottom-3');
    expect(toolbar.className).not.toContain('-translate-x-1/2');
  });

  it('merges a passed className', () => {
    render(<FloatingToolbar className="bottom-6">x</FloatingToolbar>);
    expect(screen.getByRole('toolbar').className).toContain('bottom-6');
  });
});
```

Both pass before and after the rewrite: nothing here changes what renders.

- [ ] **Step 2: Rewrite the three roots**

`components/layout/center.tsx`:

```text
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

const centerVariants = cva('items-center justify-center', {
  variants: {
    inline: {
      false: 'flex',
      true: 'inline-flex',
    },
  },
  defaultVariants: {
    inline: false,
  },
});

/**
 * Centres its children on both axes. The centring is fixed: a box whose
 * alignment the caller could change would be a flex box, not a centre. `inline`
 * picks inline flow over block flow. Size, spacing and placement (`h-screen`,
 * `gap-2`) come from `className`; `render={<main />}` swaps the element, and
 * its semantics are then the caller's.
 */
function Center({
  className,
  inline,
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof centerVariants>): ReactNode {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn(centerVariants({ inline }), className) }, props),
    render,
    state: {
      slot: 'center',
    },
  });
}

export { Center, centerVariants };
```

`components/layout/page-container.tsx`:

```text
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

const pageContainerVariants = cva('mx-auto w-full', {
  variants: {
    /**
     * Max content width, by name from the max-width scale, so a surface never
     * hardcodes one. `mx-auto w-full` centres the column at every size.
     */
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface PageContainerProps extends ComponentProps<'div'>, VariantProps<typeof pageContainerVariants> {}

/**
 * The centred, max-width content column of a full-width surface, so content
 * does not stretch edge to edge on a wide screen. Pick the width with `size`;
 * `className` carries the surface's own padding and vertical rhythm.
 *
 *   <PageContainer size="lg" className="px-6 py-6">...</PageContainer>
 */
function PageContainer({ size, className, ...props }: PageContainerProps): ReactNode {
  return <div data-slot="page-container" className={cn(pageContainerVariants({ size }), className)} {...props} />;
}

export { PageContainer, pageContainerVariants };
export type { PageContainerProps };
```

`components/layout/floating-toolbar.tsx`:

```text
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The floating tool palette of an editor canvas: a rounded, blurred card-colour
 * bar with a hairline ring and a shadow, around the tools the caller composes.
 * It is a `toolbar` landmark, so give it an `aria-label`. Placement (for
 * example `absolute bottom-3 left-1/2 -translate-x-1/2 z-20`) is the caller's
 * `className`. `pointer-events-auto` keeps it clickable inside a
 * `pointer-events-none` canvas overlay.
 */
function FloatingToolbar({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="floating-toolbar"
      role="toolbar"
      className={cn(
        'bg-card/95 ring-foreground/10 pointer-events-auto flex flex-row items-center gap-0.5 rounded-sm px-1.5 py-1 shadow-lg ring-1 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

export { FloatingToolbar };
```

- [ ] **Step 3: Name the mermaid zoom toolbar with `aria-label`**

In `editor/mermaid/react/preview.tsx`:

old:

```text
        <FloatingToolbar label="Zoom controls" className="absolute right-2 bottom-2">
```

new:

```text
        <FloatingToolbar aria-label="Zoom controls" className="absolute right-2 bottom-2">
```

Left as it was, `tsc` reports `label` as unknown on the div's props.

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/center.spec.tsx registry/bases/base-ui/components/layout/page-container.spec.tsx registry/bases/base-ui/components/layout/floating-toolbar.spec.tsx registry/bases/base-ui/editor/mermaid 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-panels-4.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-panels-4.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-panels-4.log" 2>&1; grep 'error TS' "$S/tsc-panels-4.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/center.tsx registry/bases/base-ui/components/layout/center.spec.tsx registry/bases/base-ui/components/layout/page-container.tsx registry/bases/base-ui/components/layout/floating-toolbar.tsx registry/bases/base-ui/components/layout/floating-toolbar.spec.tsx registry/bases/base-ui/editor/mermaid/react/preview.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-panels-4.log" 2>&1; tail -1 "$S/sb-panels-4.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  4 passed (4)
      Tests  13 passed (13)
 Test Files  73 passed (73)
      Tests  386 passed (386)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

- [ ] **Step 5: Commit**

`$S/msg-panels-4.txt`:

```
refactor(registry-ui): drop the toolbar label prop and pin the centre atom

Why: FloatingToolbar's label only set aria-label, which a caller could
already pass and which overrode it, so the toolbar had two names for one
attribute. The mermaid preview now names its zoom toolbar through
aria-label. Center had no spec; one now holds its recipe, its data-slot
and its render prop. The three layout roots name their return types and
their doc comments are plain ASCII.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/components/layout/center.spec.tsx
git commit -q -F "$S/msg-panels-4.txt" -- $B/components/layout/center.tsx $B/components/layout/center.spec.tsx \
  $B/components/layout/page-container.tsx $B/components/layout/floating-toolbar.tsx $B/components/layout/floating-toolbar.spec.tsx \
  $B/editor/mermaid/react/preview.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 29: FrontmatterForm leaves the description to upstream and composes the control's onChange

`FrontmatterFormFieldDescription` only renamed upstream `FieldDescription`; it goes, and the consumer composes `FieldDescription` in the field. `FrontmatterFormFieldControl` cloned its `render` element with its own `onChange`, which dropped the element's: a consumer's `onChange` on the `Input` never ran. It now calls the element's `onChange` before the field's. The wrapped upstream parts (`Field`, `FieldLabel`, `FieldError`) keep upstream's `data-slot`, which upstream's own recipes select on (`FieldLabel`'s `has-[>[data-slot=field]]`, `Field`'s `*:data-[slot=field-label]`).

**Files:**

- Modify: `components/layout/frontmatter-form.tsx` (rewritten), `components/layout/frontmatter-form.spec.tsx` (rewritten)

No other file imports `frontmatter-form`, and it is not a registry item.

**Interfaces:**

- Consumes: the Task 28 tree.
- Produces: `FrontmatterForm`, `FrontmatterFormField`, `FrontmatterFormFieldLabel`, `FrontmatterFormFieldControl({ render }: FrontmatterFormFieldControlProps): ReactNode` (render is `ReactElement<Pick<ComponentProps<'input'>, 'id' | 'value' | 'onChange' | 'aria-invalid' | 'aria-describedby'>>`), `FrontmatterFormFieldError`, `useFrontmatterFormField()`, and the types `FrontmatterFormValue`, `FrontmatterFormProps`, `FrontmatterFormFieldProps`, `FrontmatterFormFieldControlProps`.
- Removed: `FrontmatterFormFieldDescription`.

- [ ] **Step 1: Write the failing spec**

`components/layout/frontmatter-form.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldDescription } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  useFrontmatterFormField,
  type FrontmatterFormValue,
} from './frontmatter-form';

afterEach(() => {
  cleanup();
});

function NameEditor({
  value,
  onValueChange = () => {},
  errors,
}: {
  value: FrontmatterFormValue;
  onValueChange?: (value: FrontmatterFormValue) => void;
  errors?: Record<string, string>;
}) {
  return (
    <FrontmatterForm value={value} onValueChange={onValueChange} errors={errors} data-testid="form">
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input />} />
        <FieldDescription>Lowercase, dash-separated.</FieldDescription>
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
    </FrontmatterForm>
  );
}

describe('FrontmatterForm', () => {
  it('associates the label with the control and reflects the value', () => {
    render(<NameEditor value={{ name: 'pdf-toolkit' }} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('pdf-toolkit');
  });

  it('stamps data-slot on the root and places an upstream FieldDescription in the field', () => {
    render(<NameEditor value={{ name: 'a' }} />);
    expect(screen.getByTestId('form').getAttribute('data-slot')).toBe('frontmatter-form');
    const description = screen.getByText('Lowercase, dash-separated.');
    expect(description.getAttribute('data-slot')).toBe('field-description');
    expect(description.closest('[data-slot="field"]')).toBe(
      screen.getByLabelText('Name').closest('[data-slot="field"]'),
    );
  });

  it('reports the next document when a field changes (controlled)', () => {
    const onValueChange = vi.fn();
    render(<NameEditor value={{ name: 'a', description: 'keep' }} onValueChange={onValueChange} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'ab' },
    });
    // Merges into the existing document - other keys are preserved.
    expect(onValueChange).toHaveBeenCalledWith({
      name: 'ab',
      description: 'keep',
    });
  });

  it("calls the control's own onChange as well as binding the value", () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <FrontmatterForm value={{ name: 'a' }} onValueChange={onValueChange}>
        <FrontmatterFormField name="name">
          <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
          <FrontmatterFormFieldControl render={<Input onChange={onChange} />} />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'ab' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith({ name: 'ab' });
  });

  it('shows the consumer error and wires invalid-state a11y', () => {
    render(<NameEditor value={{ name: '' }} errors={{ name: 'Name is required.' }} />);
    const input = screen.getByLabelText('Name');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Name is required.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('renders no error region when the field is valid', () => {
    render(<NameEditor value={{ name: 'ok' }} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBeNull();
  });

  it('exposes the field binding via useFrontmatterFormField for custom controls', () => {
    const onValueChange = vi.fn();

    function ToggleField() {
      const field = useFrontmatterFormField();
      return (
        <button type="button" onClick={() => field.setValue(!field.value)}>
          {field.value ? 'on' : 'off'}
        </button>
      );
    }

    render(
      <FrontmatterForm value={{ network: false }} onValueChange={onValueChange}>
        <FrontmatterFormField name="network">
          <ToggleField />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'off' }));
    expect(onValueChange).toHaveBeenCalledWith({ network: true });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/frontmatter-form.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error:|Test Files|^ +Tests'
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/frontmatter-form.spec.tsx > FrontmatterForm > calls the control's own onChange as well as binding the value
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
```

- [ ] **Step 3: Rewrite `FrontmatterForm`**

`components/layout/frontmatter-form.tsx`:

```text
import * as React from 'react';

import { Field, FieldError, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** A frontmatter document: arbitrary keys, values usually strings. */
type FrontmatterFormValue = Record<string, unknown>;

interface FrontmatterFormContextValue {
  value: FrontmatterFormValue;
  setField: (name: string, fieldValue: unknown) => void;
  errors: Record<string, string>;
}

const FrontmatterFormContext = React.createContext<FrontmatterFormContextValue | null>(null);

function useFrontmatterFormContext(): FrontmatterFormContextValue {
  const ctx = React.useContext(FrontmatterFormContext);
  if (!ctx) {
    throw new Error('FrontmatterForm parts must be used within <FrontmatterForm>');
  }
  return ctx;
}

interface FrontmatterFormFieldContextValue {
  name: string;
  value: unknown;
  setValue: (fieldValue: unknown) => void;
  error: string | undefined;
  controlId: string;
  errorId: string;
}

const FrontmatterFormFieldContext = React.createContext<FrontmatterFormFieldContextValue | null>(null);

/**
 * The current field's binding: `value`, `setValue`, `error`, and the ids the
 * label and the error point at. Use it to bind a control that
 * `FrontmatterFormFieldControl` does not cover (a `Switch`, a tag input).
 * Throws outside a `FrontmatterFormField`.
 */
function useFrontmatterFormField(): FrontmatterFormFieldContextValue {
  const ctx = React.useContext(FrontmatterFormFieldContext);
  if (!ctx) {
    throw new Error('useFrontmatterFormField / FrontmatterFormField parts must be used within <FrontmatterFormField>');
  }
  return ctx;
}

interface FrontmatterFormProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  /** The frontmatter object (controlled). */
  value: FrontmatterFormValue;
  /** Receives the next object whenever a field changes. */
  onValueChange: (value: FrontmatterFormValue) => void;
  /**
   * Validation messages keyed by field name, computed by the consumer (the
   * component ships no rules). A field with an entry renders it and marks its
   * control invalid.
   */
  errors?: Record<string, string>;
}

/**
 * A frontmatter (YAML metadata) editor. The root holds the document and its
 * field setters; the consumer composes one `FrontmatterFormField` per key and
 * owns every label, hint (upstream `FieldDescription`), control and validation
 * rule.
 */
function FrontmatterForm({
  value,
  onValueChange,
  errors = {},
  className,
  ...props
}: FrontmatterFormProps): React.ReactNode {
  const ctx: FrontmatterFormContextValue = {
    value,
    setField: (name, fieldValue) => onValueChange({ ...value, [name]: fieldValue }),
    errors,
  };
  return (
    <FrontmatterFormContext.Provider value={ctx}>
      <div data-slot="frontmatter-form" className={cn('flex flex-col gap-5', className)} {...props} />
    </FrontmatterFormContext.Provider>
  );
}

interface FrontmatterFormFieldProps extends React.ComponentProps<typeof Field> {
  /** Frontmatter key this field binds to. */
  name: string;
}

/**
 * One field of a `FrontmatterForm`, bound to `name`: an upstream `Field`,
 * marked invalid when the root's `errors` hold `name`. It keeps upstream's
 * `data-slot="field"`, which `FieldLabel` and `FieldGroup` select on.
 */
function FrontmatterFormField({ name, ...props }: FrontmatterFormFieldProps): React.ReactNode {
  const ctx = useFrontmatterFormContext();
  const controlId = React.useId();
  const errorId = React.useId();
  const error = ctx.errors[name];

  const fieldCtx: FrontmatterFormFieldContextValue = {
    name,
    value: ctx.value[name],
    setValue: (fieldValue) => ctx.setField(name, fieldValue),
    error,
    controlId,
    errorId,
  };

  return (
    <FrontmatterFormFieldContext.Provider value={fieldCtx}>
      <Field data-invalid={error ? true : undefined} {...props} />
    </FrontmatterFormFieldContext.Provider>
  );
}

/** Label for the current field, pointed at its control. */
function FrontmatterFormFieldLabel(props: React.ComponentProps<typeof FieldLabel>): React.ReactNode {
  const field = useFrontmatterFormField();
  return <FieldLabel htmlFor={field.controlId} {...props} />;
}

type FrontmatterFormFieldControlElementProps = Pick<
  React.ComponentProps<'input'>,
  'id' | 'value' | 'onChange' | 'aria-invalid' | 'aria-describedby'
>;

interface FrontmatterFormFieldControlProps {
  /**
   * The text control to bind, such as `<Input placeholder="my-skill" />` or
   * `<Textarea />`. It receives the field's `id`, string `value` and the
   * invalid-state attributes, which replace its own; its own `onChange` still
   * runs, before the field's. For a non-text control use
   * `useFrontmatterFormField()` instead.
   */
  render: React.ReactElement<FrontmatterFormFieldControlElementProps>;
}

/** Binds a text control (`Input`, `Textarea`) to the current field's string value. */
function FrontmatterFormFieldControl({ render }: FrontmatterFormFieldControlProps): React.ReactNode {
  const field = useFrontmatterFormField();
  const ownOnChange = render.props.onChange;
  return React.cloneElement(render, {
    id: field.controlId,
    value: (field.value ?? '') as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      ownOnChange?.(event);
      field.setValue(event.target.value);
    },
    'aria-invalid': field.error ? true : undefined,
    'aria-describedby': field.error ? field.errorId : undefined,
  });
}

/** The current field's message from the root's `errors`; renders nothing while the field is valid. */
function FrontmatterFormFieldError(props: React.ComponentProps<typeof FieldError>): React.ReactNode {
  const field = useFrontmatterFormField();
  if (!field.error) return null;
  return (
    <FieldError id={field.errorId} {...props}>
      {field.error}
    </FieldError>
  );
}

export {
  useFrontmatterFormField,
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldLabel,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
};
export type { FrontmatterFormValue, FrontmatterFormProps, FrontmatterFormFieldProps, FrontmatterFormFieldControlProps };
```

- [ ] **Step 4: Run the specs, the type check, lint and the registry build**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/frontmatter-form.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-panels-5.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-panels-5.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-panels-5.log" 2>&1; grep 'error TS' "$S/tsc-panels-5.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/frontmatter-form.tsx registry/bases/base-ui/components/layout/frontmatter-form.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-panels-5.log" 2>&1; tail -1 "$S/sb-panels-5.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  7 passed (7)
 Test Files  73 passed (73)
      Tests  388 passed (388)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

- [ ] **Step 5: Commit**

`$S/msg-panels-5.txt`:

```
fix(registry-ui): keep the control's own onChange in the frontmatter form

Why: FrontmatterFormFieldControl cloned its render element with the
field's onChange, which replaced the element's own, so a consumer's
onChange on the Input never ran. It now calls the element's handler
before the field's. FrontmatterFormFieldDescription only renamed
upstream FieldDescription, so the consumer composes that instead.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-panels-5.txt" -- $B/components/layout/frontmatter-form.tsx $B/components/layout/frontmatter-form.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 30: AvatarPicker panes sit in Tabs the consumer declares

`AvatarPickerContent` scanned its children's component types against a module `TAB_META` map to build a tab strip, wrapped them in its own `Tabs`, and placed `AvatarPickerRemove` itself. A pane wrapped in anything (a fragment, a memo, a consumer component) vanished from the strip. The consumer now composes upstream `Tabs`, declares a `TabsTrigger` per pane (the pane values are `AvatarPickerTab`), and places `AvatarPickerRemove`; `AvatarPickerContent` is the popover body alone. On the way: the upload pane carries `data-uploading` while `onUpload` is pending, so replacement copy can style off it; `AvatarPickerRemove` called `remove` from an `onClick` the caller's spread `onClick` replaced, and now runs both; the current colour swatch is marked `aria-pressed` instead of by a conditional class. The swatch palette moves to `constants/avatar-colors.ts`, out of the component file (a module array in a component file is what the class-string check reads).

**Files:**

- Create: `constants/avatar-colors.ts`
- Modify: `components/layout/avatar-picker.tsx` (rewritten), `components/layout/avatar-picker.spec.tsx` (rewritten)

No other file imports `avatar-picker`, and it is not a registry item.

**Interfaces:**

- Consumes: the Task 29 tree; `EmojiPicker` from `components/data-entry/emoji-picker` with its current `onSelect` prop.
- Produces: `AvatarPicker`, `AvatarPickerTrigger`, `AvatarPickerContent`, `AvatarPickerRemove`, `AvatarPickerEmoji`, `AvatarPickerUpload`, `AvatarPickerColor`, each returning `ReactNode`; `type AvatarPickerValue`, `type AvatarPickerTab` (`'emoji' | 'upload' | 'color'`), `type AvatarPickerProps`, `type AvatarPickerUploadProps`, `type AvatarPickerColorProps` (`colors?: readonly string[]`); `constants/avatar-colors`: `AVATAR_COLORS`.
- Removed: the tab strip and the auto-placed Remove inside `AvatarPickerContent`; `TAB_META`; `AvatarPickerRemove`'s `ml-auto` (placement is the consumer's `className`).

- [ ] **Step 1: Write the failing spec**

`components/layout/avatar-picker.spec.tsx`:

```text
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Palette, Smile, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

import {
  AvatarPicker,
  AvatarPickerColor,
  AvatarPickerContent,
  AvatarPickerEmoji,
  AvatarPickerRemove,
  AvatarPickerTrigger,
  AvatarPickerUpload,
  type AvatarPickerTab,
  type AvatarPickerValue,
} from './avatar-picker';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // Base UI's popover positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
});

function Picker({
  value = {},
  onValueChange = vi.fn(),
  defaultTab,
  strip = true,
  onRemove,
  children,
}: {
  value?: AvatarPickerValue;
  onValueChange?: (value: AvatarPickerValue) => void;
  defaultTab: AvatarPickerTab;
  strip?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <AvatarPicker value={value} onValueChange={onValueChange}>
      <AvatarPickerTrigger>
        <span>avatar</span>
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs defaultValue={defaultTab} className="gap-0">
          <div className="flex items-center gap-1 p-2">
            {strip && (
              <TabsList variant="line">
                <TabsTrigger value="emoji" aria-label="Emoji" className="flex-none px-2">
                  <Smile />
                </TabsTrigger>
                <TabsTrigger value="upload" aria-label="Upload" className="flex-none px-2">
                  <Upload />
                </TabsTrigger>
                <TabsTrigger value="color" aria-label="Color" className="flex-none px-2">
                  <Palette />
                </TabsTrigger>
              </TabsList>
            )}
            <AvatarPickerRemove className="ml-auto" onClick={onRemove} />
          </div>
          {children}
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

const openEditor = () => fireEvent.click(screen.getByRole('button', { name: 'Edit avatar' }));

describe('AvatarPicker', () => {
  it('shows only the pane the consumer composes when it declares no tab strip', () => {
    render(
      <Picker defaultTab="upload" strip={false}>
        <AvatarPickerUpload />
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Click to upload an image')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('switches panes through the tabs the consumer declares', () => {
    render(
      <Picker defaultTab="upload">
        <AvatarPickerEmoji />
        <AvatarPickerUpload />
        <AvatarPickerColor />
      </Picker>,
    );
    openEditor();

    expect(screen.getAllByRole('tab').map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Emoji',
      'Upload',
      'Color',
    ]);
    fireEvent.click(screen.getByRole('tab', { name: 'Color' }));
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeTruthy();
  });

  it('lets children override the upload copy', () => {
    render(
      <Picker defaultTab="upload">
        <AvatarPickerUpload>Upload a photo</AvatarPickerUpload>
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Upload a photo')).toBeTruthy();
    expect(screen.queryByText('Click to upload an image')).toBeNull();
  });

  it('marks the upload pane data-uploading until onUpload settles, then adopts the resolved URL', async () => {
    let resolve: (url: string) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const onChange = vi.fn();
    render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <AvatarPickerUpload onUpload={onUpload} />
      </Picker>,
    );
    openEditor();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledWith(file);
    const pane = document.querySelector('[data-slot="avatar-picker-upload"]') as HTMLElement;
    expect(pane.hasAttribute('data-uploading')).toBe(true);

    resolve('https://cdn.example/a.png');
    await waitFor(() => expect(pane.hasAttribute('data-uploading')).toBe(false));
    expect(onChange).toHaveBeenCalledWith({ imageUrl: 'https://cdn.example/a.png', emoji: null });
  });

  it("clears emoji and image on Remove and still runs the consumer's onClick", () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <Picker defaultTab="upload" value={{ emoji: 'x' }} onValueChange={onChange} onRemove={onRemove}>
        <AvatarPickerUpload />
      </Picker>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, imageUrl: null });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('marks the current colour swatch pressed and sets the colour on a click', () => {
    const onChange = vi.fn();
    render(
      <Picker defaultTab="color" value={{ color: '#ec4899' }} onValueChange={onChange}>
        <AvatarPickerColor />
      </Picker>,
    );
    openEditor();

    expect(screen.getByRole('button', { name: '#ec4899' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '#6366f1' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: '#6366f1' }));
    expect(onChange).toHaveBeenCalledWith({ color: '#6366f1' });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/avatar-picker.spec.tsx 2>&1 | grep -E '^ FAIL|^[A-Za-z]*Error:|Test Files|^ +Tests'
```

Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/avatar-picker.spec.tsx > AvatarPicker > marks the upload pane data-uploading until onUpload settles, then adopts the resolved URL
AssertionError: expected false to be true // Object.is equality
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/avatar-picker.spec.tsx > AvatarPicker > clears emoji and image on Remove and still runs the consumer's onClick
TestingLibraryElementError: Found multiple elements with the role "button" and name "Remove avatar"
 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/avatar-picker.spec.tsx > AvatarPicker > marks the current colour swatch pressed and sets the colour on a click
AssertionError: expected null to be 'true' // Object.is equality
 Test Files  1 failed (1)
      Tests  3 failed | 3 passed (6)
```

The three composition cases pass against the old code only because the old `AvatarPickerContent` wraps the consumer's `Tabs` in its own empty one; the second Remove button in the second failure is the one it still auto-places.

- [ ] **Step 3: Move the palette to `constants/`**

`constants/avatar-colors.ts`:

```text
/** The default swatches of an avatar tile's colour: twelve hues spread evenly round the wheel. */
export const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
] as const satisfies readonly string[];
```

- [ ] **Step 4: Rewrite `AvatarPicker`**

`components/layout/avatar-picker.tsx`:

```text
import { Loader2, Trash2, Upload } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { TabsContent } from '@/registry/bases/base-ui/ui/tabs';
import { AVATAR_COLORS } from '@/registry/bases/base-ui/constants/avatar-colors';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { EmojiPicker } from '../data-entry/emoji-picker';

interface AvatarPickerValue {
  /** Emoji glyph avatar, or null. */
  emoji?: string | null;
  /** Uploaded image avatar (data URL / asset URL), or null. */
  imageUrl?: string | null;
  /** Tile background color (any CSS color), or null. */
  color?: string | null;
}

/** The `value` of each pane, and so of the `TabsTrigger` the consumer declares for it. */
type AvatarPickerTab = 'emoji' | 'upload' | 'color';

interface AvatarPickerContextValue {
  value: AvatarPickerValue;
  /** Set the emoji (clears any image). */
  setEmoji: (emoji: string) => void;
  /** Set the tile color. */
  setColor: (color: string) => void;
  /** Set the image URL (clears any emoji). */
  setImage: (url: string) => void;
  /** Clear emoji + image. */
  remove: () => void;
}

const AvatarPickerContext = React.createContext<AvatarPickerContextValue | null>(null);

/** Read the value/Setters shared by the surrounding <AvatarPicker>. */
function useAvatarPicker(): AvatarPickerContextValue {
  const ctx = React.useContext(AvatarPickerContext);
  if (!ctx) {
    throw new Error('AvatarPicker parts must be used within <AvatarPicker>');
  }
  return ctx;
}

interface AvatarPickerProps {
  value: AvatarPickerValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarPickerValue) => void;
  /** Open state - uncontrolled by default; pass `open` to control it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Compose `AvatarPickerTrigger` + `AvatarPickerContent`. */
  children?: React.ReactNode;
}

/**
 * Avatar picker: a Popover whose parts edit one avatar value. The consumer
 * composes the panes inside upstream `Tabs`, declaring a `TabsTrigger` per pane
 * it includes (or none, for a single pane), and places `AvatarPickerRemove`:
 *
 *   <AvatarPicker value={avatar} onValueChange={setAvatar}>
 *     <AvatarPickerTrigger>{tile}</AvatarPickerTrigger>
 *     <AvatarPickerContent>
 *       <Tabs defaultValue="emoji" className="gap-0">
 *         <div className="flex items-center gap-1 p-2">
 *           <TabsList variant="line">
 *             <TabsTrigger value="emoji" aria-label="Emoji"><Smile /></TabsTrigger>
 *             <TabsTrigger value="color" aria-label="Color"><Palette /></TabsTrigger>
 *           </TabsList>
 *           <AvatarPickerRemove className="ml-auto" />
 *         </div>
 *         <AvatarPickerEmoji />
 *         <AvatarPickerColor />
 *       </Tabs>
 *     </AvatarPickerContent>
 *   </AvatarPicker>
 */
function AvatarPicker({
  value,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: AvatarPickerProps): React.ReactNode {
  const ctx: AvatarPickerContextValue = {
    value,
    setEmoji: (emoji) => onValueChange({ ...value, emoji, imageUrl: null }),
    setColor: (color) => onValueChange({ ...value, color }),
    setImage: (imageUrl) => onValueChange({ ...value, imageUrl, emoji: null }),
    remove: () => onValueChange({ ...value, emoji: null, imageUrl: null }),
  };
  return (
    <AvatarPickerContext.Provider value={ctx}>
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} data-slot="avatar-picker">
        {children}
      </Popover>
    </AvatarPickerContext.Provider>
  );
}

/** The clickable avatar tile that opens the editor. */
function AvatarPickerTrigger({
  className,
  'aria-label': ariaLabel = 'Edit avatar',
  ...props
}: React.ComponentProps<typeof PopoverTrigger>): React.ReactNode {
  return (
    <PopoverTrigger
      data-slot="avatar-picker-trigger"
      aria-label={ariaLabel}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex rounded-[inherit] outline-none focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

/** The popover body the consumer fills with `Tabs` and the panes. */
function AvatarPickerContent({
  className,
  align = 'start',
  side = 'bottom',
  ...props
}: React.ComponentProps<typeof PopoverContent>): React.ReactNode {
  return (
    <PopoverContent
      data-slot="avatar-picker-content"
      align={align}
      side={side}
      className={cn('w-84 gap-0 overflow-hidden p-0', className)}
      {...props}
    />
  );
}

/** Clears both emoji and image, then runs the consumer's own `onClick`. */
function AvatarPickerRemove({
  className,
  onClick,
  'aria-label': ariaLabel = 'Remove avatar',
  ...props
}: React.ComponentProps<typeof Button>): React.ReactNode {
  const { remove } = useAvatarPicker();
  return (
    <Button
      data-slot="avatar-picker-remove"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      onClick={(event) => {
        remove();
        onClick?.(event);
      }}
      className={cn('text-muted-foreground hover:text-destructive', className)}
      {...props}
    >
      <Trash2 />
    </Button>
  );
}

/** Emoji pane (tab value `emoji`): picks an emoji and clears any image. */
function AvatarPickerEmoji({
  className,
  ...props
}: Omit<React.ComponentProps<typeof TabsContent>, 'value'>): React.ReactNode {
  const { setEmoji } = useAvatarPicker();
  return (
    <TabsContent data-slot="avatar-picker-emoji" value="emoji" className={cn('p-0', className)} {...props}>
      <EmojiPicker onSelect={setEmoji} />
    </TabsContent>
  );
}

interface AvatarPickerUploadProps extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /**
   * Hand the raw file to a backend and resolve the persisted URL (which becomes
   * `imageUrl`); resolve `null` for a no-op. Omit to read the file inline as a
   * data URL.
   */
  onUpload?: (file: File) => string | null | Promise<string | null>;
}

/**
 * Upload pane (tab value `upload`). A picked file goes to `onUpload`, or is read
 * inline as a data URL when that is omitted. The pane carries `data-uploading`
 * while `onUpload` is pending, so `children` that replace the default dropzone
 * copy can style off it.
 */
function AvatarPickerUpload({ className, children, onUpload, ...props }: AvatarPickerUploadProps): React.ReactNode {
  const { setImage } = useAvatarPicker();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const onFile = (file: File | undefined): void => {
    if (!file) return;
    if (onUpload) {
      setUploading(true);
      Promise.resolve(onUpload(file))
        .then((url) => {
          if (url) setImage(url);
        })
        .catch(() => {
          /* the consumer owns error messaging; just stop the spinner */
        })
        .finally(() => setUploading(false));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <TabsContent
      data-slot="avatar-picker-upload"
      data-uploading={uploading || undefined}
      value="upload"
      className={cn('group/avatar-picker-upload p-3', className)}
      {...props}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
      />
      {/* A raw element, not the Button primitive: a drop target is a tall
          column (icon over copy, `py-10`) that no Button `size` variant
          expresses, and forcing one would mean overriding its fixed height and
          row layout. */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="bg-muted/50 text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 flex w-full flex-col items-center justify-center gap-2 rounded-lg py-10 text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-60"
      >
        {children ?? (
          <>
            {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
            <span>{uploading ? 'Uploading...' : 'Click to upload an image'}</span>
            <span className="text-xs">PNG, JPG or GIF</span>
          </>
        )}
      </button>
    </TabsContent>
  );
}

interface AvatarPickerColorProps extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /** Swatches shown on the Color pane. */
  colors?: readonly string[];
}

/**
 * Color pane (tab value `color`): swatches, the current one pressed, and a
 * custom picker whose label `children` replace.
 */
function AvatarPickerColor({
  className,
  children,
  colors = AVATAR_COLORS,
  ...props
}: AvatarPickerColorProps): React.ReactNode {
  const { value, setColor } = useAvatarPicker();
  return (
    <TabsContent data-slot="avatar-picker-color" value="color" className={cn('p-3', className)} {...props}>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={c}
            aria-pressed={value.color === c}
            style={{ backgroundColor: c }}
            className="ring-ring ring-offset-popover size-9 rounded-full ring-offset-2 transition-transform outline-none hover:scale-110 focus-visible:ring-2 aria-pressed:ring-2"
          />
        ))}
      </div>
      <label className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
        {children ?? 'Custom'}
        <input
          type="color"
          value={value.color ?? '#000000'}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Custom color"
          className="h-8 w-12 cursor-pointer rounded-md bg-transparent"
        />
      </label>
    </TabsContent>
  );
}

export {
  AvatarPicker,
  AvatarPickerTrigger,
  AvatarPickerContent,
  AvatarPickerRemove,
  AvatarPickerEmoji,
  AvatarPickerUpload,
  AvatarPickerColor,
};
export type { AvatarPickerValue, AvatarPickerTab, AvatarPickerProps, AvatarPickerUploadProps, AvatarPickerColorProps };
```

- [ ] **Step 5: Run the specs, the type check, lint and the registry build**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/avatar-picker.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-panels-6.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-panels-6.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-panels-6.log" 2>&1; grep 'error TS' "$S/tsc-panels-6.log" | cut -c1-80
pnpm exec eslint registry/bases/base-ui/components/layout/avatar-picker.tsx registry/bases/base-ui/components/layout/avatar-picker.spec.tsx registry/bases/base-ui/constants/avatar-colors.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-panels-6.log" 2>&1; tail -1 "$S/sb-panels-6.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  6 passed (6)
 Test Files  73 passed (73)
      Tests  389 passed (389)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

Then the spec's checks over this group's files, from `apps/registry-ui/registry/bases/base-ui/` (bash):

```bash
F="components/layout/avatar-picker.tsx components/layout/frontmatter-form.tsx components/layout/panel-header.tsx components/layout/panel-row.tsx components/layout/panel-field-group.tsx components/layout/page-container.tsx components/layout/center.tsx components/layout/floating-toolbar.tsx components/general/panel-field-label.tsx components/general/icon-chip.tsx components/general/icon-label.tsx"
grep -nE '^export (function|const [A-Z])' $F
grep -nE "^(export )?const [A-Z_]+ = ['\"\`\[]" $F
grep -noE '[a-z-]+-\[[0-9.]+(px|rem)\]' $F
grep -nE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' $F
```

Expected: all four print nothing.

- [ ] **Step 6: Commit**

`$S/msg-panels-6.txt`:

```
refactor(registry-ui): let the consumer declare the avatar picker tabs

Why: AvatarPickerContent built its tab strip by matching its children's
component types against a module map, so a pane wrapped in a fragment,
a memo or a consumer component silently lost its tab, and it placed the
Remove button itself. The consumer now composes upstream Tabs, declares
a trigger per pane and places AvatarPickerRemove, whose remove no
longer gives way to a caller's onClick. The upload pane carries
data-uploading while onUpload is pending, the current swatch is
aria-pressed, and the palette moves to constants/.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/constants/avatar-colors.ts
git commit -q -F "$S/msg-panels-6.txt" -- $B/constants/avatar-colors.ts $B/components/layout/avatar-picker.tsx $B/components/layout/avatar-picker.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

## Integration and checks

### Task 31: StatusTone moves to types/, ModelList dims only `data-unavailable="true"`, constants/ folds into its readers

Integration fixes after every family task. `StatusTone` now has two readers (`StatusIndicator`, `AiProviderCard`), so it leaves `status-indicator.tsx` for `types/status-tone.ts`, and each registry item that ships a reader ships the file. `ModelListContent` dimmed any `Item` carrying `data-unavailable`: React writes `data-unavailable={false}` as `"false"`, so an available model was dimmed; the selector keys on `data-[unavailable=true]`. `constants/` takes a value only at its second consumer, and both of its files have one reader each: `constants/code-languages.ts` goes back into `lib/language-options.tsx`, `constants/avatar-colors.ts` into `components/layout/avatar-picker.tsx`, and the folder goes.

**Files:**

- Create: `types/status-tone.ts`
- Modify: `components/feedback/status-indicator.tsx`, `components/data-display/ai-provider-card.tsx`, `components/layout/model-list.tsx`, `components/layout/model-list.spec.tsx`, `lib/language-options.tsx`, `components/layout/avatar-picker.tsx`, `apps/registry-ui/registry.json` (items `status-dot`, `ai-provider-card`)
- Delete: `constants/code-languages.ts`, `constants/avatar-colors.ts` (and so `constants/`)

**Interfaces:**

- Consumes: the tree after every family task of plan B.
- Produces:
  - `types/status-tone.ts`: `type StatusTone = 'online' | 'offline' | 'busy' | 'idle'`
  - `components/feedback/status-indicator`: exports `StatusIndicator` and `type StatusIndicatorProps`; no longer exports `StatusTone`.
  - `ModelListContent` dims an `Item` whose `data-unavailable` is `"true"`; `data-unavailable={false}` or an absent attribute is not dimmed.
  - `lib/language-options`: exports unchanged (`canonicalCodeId`, `codeLanguageIcon`, `codeLanguageOptions`, `findLanguageOption`, `localeOptions`); `CODE_LANGUAGES` and `CODE_ALIASES` are module-private there.
  - `AvatarPickerColor`'s `colors` default is unchanged (the same twelve swatches), written inline.
- Registry: `status-dot` ships `types/status-tone.ts`; `ai-provider-card` ships `types/status-tone.ts` and drops its `status-dot` URL dependency (it imported only the type).

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`. Commands run from `apps/registry-ui` unless a step says otherwise.

- [ ] **Step 1: Write the failing ModelList spec**

In `components/layout/model-list.spec.tsx`, replace:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
```

with:

```text
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { compile } from 'tailwindcss';
import { afterEach, describe, expect, it, vi } from 'vitest';
```

Replace:

```text
afterEach(cleanup);
```

with:

```text
afterEach(cleanup);

/** Whether an opacity rule compiled from the enclosing `ModelListContent`'s classes applies to `item`. */
async function isDimmed(item: Element | null): Promise<boolean> {
  const content = item?.closest('[data-slot="model-list-content"]');
  if (!item || !content) throw new Error('no item rendered inside a ModelListContent');
  const compiler = await compile('@tailwind utilities;');
  const style = document.createElement('style');
  style.textContent = compiler.build([...content.classList]);
  document.head.append(style);
  const rules = [...(style.sheet?.cssRules ?? [])].filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.style.getPropertyValue('opacity') !== '',
  );
  style.remove();
  // jsdom's selector engine matches no escaped class name inside :is(), so the
  // content is addressed by its data-slot, which selects the same element.
  return rules.some((rule) =>
    item.matches(rule.selectorText.replace(/\.(?:\\.|[\w-])+/g, '[data-slot="model-list-content"]')),
  );
}
```

Replace the whole `describe('ModelListContent', ...)` block:

```text
describe('ModelListContent', () => {
  it('dims an item marked unavailable', () => {
    render(
      <ModelListContent>
        <ItemGroup>
          <Item size="sm" data-unavailable>
            <ItemContent>
              <ItemTitle>GPT-4o</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ModelListContent>,
    );

    const content = document.querySelector('[data-slot="model-list-content"]');
    expect(content?.className).toContain('**:data-[slot=item]:data-unavailable:opacity-55');
    expect(content?.querySelector('[data-slot="item"]')?.hasAttribute('data-unavailable')).toBe(true);
  });
});
```

with:

```text
describe('ModelListContent', () => {
  it('dims an item marked unavailable', async () => {
    render(
      <ModelListContent>
        <ItemGroup>
          <Item size="sm" data-unavailable>
            <ItemContent>
              <ItemTitle>GPT-4o</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ModelListContent>,
    );

    expect(await isDimmed(document.querySelector('[data-slot="item"]'))).toBe(true);
  });

  it('does not dim an item whose data-unavailable is false', async () => {
    render(
      <ModelListContent>
        <ItemGroup>
          <Item size="sm" data-unavailable={false}>
            <ItemContent>
              <ItemTitle>GPT-4o</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ModelListContent>,
    );

    const item = document.querySelector('[data-slot="item"]');
    expect(item?.getAttribute('data-unavailable')).toBe('false');
    expect(await isDimmed(item)).toBe(false);
  });
});
```

(jsdom computes no Tailwind class, so the spec compiles the content's own class list with the app's `tailwindcss` devDependency and matches each rule that sets `opacity` against the item. The first case now asserts the dimming rather than the class string.)

- [ ] **Step 2: Run it and watch it fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/model-list.spec.tsx 2>&1 | grep -E '✓|×|AssertionError|Test Files|^ +Tests' | sed -E 's/ [0-9]+ms$//'
```

Expected:

```
     ✓ renders the title, controls, tabs, and content
     ✓ renders its content in order without transforming it
     ✓ dims an item marked unavailable
     × does not dim an item whose data-unavailable is false
     ✓ renders a labelled remove control that calls onClick
     ✓ takes the consumer label in place of the default
     ✓ renders six placeholder items by default
     ✓ renders the requested number of placeholder items, each matching the item shape
AssertionError: expected true to be false // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```

- [ ] **Step 3: Key the dimming on `data-unavailable="true"`**

In `components/layout/model-list.tsx`, replace:

```text
 *       <Item size="sm" data-unavailable={unavailable || undefined}>
```

with:

```text
 *       <Item size="sm" data-unavailable={unavailable}>
```

Replace:

```text
/**
 * The scrolling region: item groups, an empty state or a `ModelListSkeleton`.
 * An `Item` inside it carrying `data-unavailable` is dimmed; set the attribute
 * only when the model is unavailable, since `data-unavailable="false"` counts too.
 */
```

with:

```text
/**
 * The scrolling region: item groups, an empty state or a `ModelListSkeleton`.
 * An `Item` inside it with `data-unavailable={true}` is dimmed.
 */
```

Replace:

```text
**:data-[slot=item]:data-unavailable:opacity-55
```

with:

```text
**:data-[slot=item]:data-[unavailable=true]:opacity-55
```

- [ ] **Step 4: Run it and watch it pass**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/model-list.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
```

Expected:

```
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

- [ ] **Step 5: Move `StatusTone` to `types/`**

`types/status-tone.ts`:

```text
/**
 * A semantic status, read the same way on every surface. online: connected,
 * enabled, active. offline: disconnected, disabled. busy: an error,
 * unavailable. idle: pending, away.
 */
type StatusTone = 'online' | 'offline' | 'busy' | 'idle';

export type { StatusTone };
```

In `components/feedback/status-indicator.tsx`, replace:

```text
import { cn } from '@/registry/bases/base-ui/lib/utils';

type StatusTone = 'online' | 'offline' | 'busy' | 'idle';

interface StatusIndicatorProps extends React.ComponentProps<'span'> {
  /**
   * online: connected, enabled, active. offline: disconnected, disabled.
   * busy: an error, unavailable. idle: pending, away.
   */
  tone: StatusTone;
```

with:

```text
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { StatusTone } from '@/registry/bases/base-ui/types/status-tone';

interface StatusIndicatorProps extends React.ComponentProps<'span'> {
  /** The status the dot's colour reports. */
  tone: StatusTone;
```

and replace:

```text
export type { StatusIndicatorProps, StatusTone };
```

with:

```text
export type { StatusIndicatorProps };
```

In `components/data-display/ai-provider-card.tsx`, replace:

```text
import type { StatusTone } from '../feedback/status-indicator';
```

with:

```text
import type { StatusTone } from '@/registry/bases/base-ui/types/status-tone';
```

- [ ] **Step 6: Ship `types/status-tone.ts` with both items**

In `apps/registry-ui/registry.json`, replace:

```text
      "description": "A small tone-coded presence dot (online, offline, busy, idle). Exports the `StatusTone` union that other items reuse for their own status surfaces.",
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/status-indicator.tsx",
          "type": "registry:component"
        }
      ]
```

with:

```text
      "description": "A small tone-coded presence dot (online, offline, busy, idle).",
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/status-indicator.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/types/status-tone.ts",
          "type": "registry:lib"
        }
      ]
```

and replace:

```text
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/status-dot.json", "@shadcn/card", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/ai-provider-card.tsx",
          "type": "registry:component"
        }
      ]
```

with:

```text
      "registryDependencies": ["@shadcn/card", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/ai-provider-card.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/types/status-tone.ts",
          "type": "registry:lib"
        }
      ]
```

(The description no longer says the item exports the union for other items: each item now ships the file itself. The card's `status-dot` URL was there only for the type.)

- [ ] **Step 7: Fold `constants/` back into its two readers**

In `lib/language-options.tsx`, replace the head of the file:

```text
import { DocumentIcon } from '@zeroxsolutions/icons/material/document';

import { CODE_ALIASES, CODE_LANGUAGES } from '@/registry/bases/base-ui/constants/code-languages';
import type { LanguageIcon, LanguageKind, LanguageOption } from '@/registry/bases/base-ui/types/language-option';
```

with (the icon imports and the two tables of `constants/code-languages.ts`, word for word, less its `export` line):

```text
import { CIcon } from '@zeroxsolutions/icons/material/c';
import { ConsoleIcon } from '@zeroxsolutions/icons/material/console';
import { CppIcon } from '@zeroxsolutions/icons/material/cpp';
import { CssIcon } from '@zeroxsolutions/icons/material/css';
import { CsharpIcon } from '@zeroxsolutions/icons/material/csharp';
import { DatabaseIcon } from '@zeroxsolutions/icons/material/database';
import { DockerIcon } from '@zeroxsolutions/icons/material/docker';
import { DocumentIcon } from '@zeroxsolutions/icons/material/document';
import { GoIcon } from '@zeroxsolutions/icons/material/go';
import { HtmlIcon } from '@zeroxsolutions/icons/material/html';
import { JavaIcon } from '@zeroxsolutions/icons/material/java';
import { JavascriptIcon } from '@zeroxsolutions/icons/material/javascript';
import { JsonIcon } from '@zeroxsolutions/icons/material/json';
import { KotlinIcon } from '@zeroxsolutions/icons/material/kotlin';
import { LessIcon } from '@zeroxsolutions/icons/material/less';
import { LuaIcon } from '@zeroxsolutions/icons/material/lua';
import { MarkdownIcon } from '@zeroxsolutions/icons/material/markdown';
import { MermaidIcon } from '@zeroxsolutions/icons/material/mermaid';
import { PhpIcon } from '@zeroxsolutions/icons/material/php';
import { PythonIcon } from '@zeroxsolutions/icons/material/python';
import { ReactIcon } from '@zeroxsolutions/icons/material/react';
import { RubyIcon } from '@zeroxsolutions/icons/material/ruby';
import { RustIcon } from '@zeroxsolutions/icons/material/rust';
import { SassIcon } from '@zeroxsolutions/icons/material/sass';
import { SwiftIcon } from '@zeroxsolutions/icons/material/swift';
import { TexIcon } from '@zeroxsolutions/icons/material/tex';
import { TomlIcon } from '@zeroxsolutions/icons/material/toml';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import { XmlIcon } from '@zeroxsolutions/icons/material/xml';
import { YamlIcon } from '@zeroxsolutions/icons/material/yaml';

import type { LanguageIcon, LanguageKind, LanguageOption } from '@/registry/bases/base-ui/types/language-option';

/**
 * The programming languages the design system can syntax-highlight (the Shiki
 * registry in `lib/shiki.ts`), each with a display label and its full-color
 * Material file-type icon. A self-contained copy of the id set, so importing it
 * loads no Shiki highlighter; `lib/language-options.spec.tsx` fails when it
 * drifts from the highlighter's `CODE_LANGUAGE_IDS`. A few ids reuse a
 * near-neighbour icon (`jsx`/`tsx` -> React, `shellscript` -> console,
 * `dockerfile` -> docker, `sql` -> database, `ini` -> document, `scss` -> sass).
 */
const CODE_LANGUAGES: readonly {
  id: string;
  label: string;
  Icon: LanguageIcon;
}[] = [
  { id: 'markdown', label: 'Markdown', Icon: MarkdownIcon },
  { id: 'mermaid', label: 'Mermaid', Icon: MermaidIcon },
  { id: 'latex', label: 'LaTeX', Icon: TexIcon },
  { id: 'json', label: 'JSON', Icon: JsonIcon },
  { id: 'yaml', label: 'YAML', Icon: YamlIcon },
  { id: 'toml', label: 'TOML', Icon: TomlIcon },
  { id: 'ini', label: 'INI', Icon: DocumentIcon },
  { id: 'xml', label: 'XML', Icon: XmlIcon },
  { id: 'html', label: 'HTML', Icon: HtmlIcon },
  { id: 'css', label: 'CSS', Icon: CssIcon },
  { id: 'scss', label: 'SCSS', Icon: SassIcon },
  { id: 'less', label: 'Less', Icon: LessIcon },
  { id: 'javascript', label: 'JavaScript', Icon: JavascriptIcon },
  { id: 'typescript', label: 'TypeScript', Icon: TypescriptIcon },
  { id: 'jsx', label: 'JSX', Icon: ReactIcon },
  { id: 'tsx', label: 'TSX', Icon: ReactIcon },
  { id: 'python', label: 'Python', Icon: PythonIcon },
  { id: 'shellscript', label: 'Shell', Icon: ConsoleIcon },
  { id: 'sql', label: 'SQL', Icon: DatabaseIcon },
  { id: 'dockerfile', label: 'Dockerfile', Icon: DockerIcon },
  { id: 'go', label: 'Go', Icon: GoIcon },
  { id: 'rust', label: 'Rust', Icon: RustIcon },
  { id: 'java', label: 'Java', Icon: JavaIcon },
  { id: 'kotlin', label: 'Kotlin', Icon: KotlinIcon },
  { id: 'swift', label: 'Swift', Icon: SwiftIcon },
  { id: 'c', label: 'C', Icon: CIcon },
  { id: 'cpp', label: 'C++', Icon: CppIcon },
  { id: 'csharp', label: 'C#', Icon: CsharpIcon },
  { id: 'php', label: 'PHP', Icon: PhpIcon },
  { id: 'ruby', label: 'Ruby', Icon: RubyIcon },
  { id: 'lua', label: 'Lua', Icon: LuaIcon },
];

/**
 * Common code-fence aliases -> the canonical id in {@link CODE_LANGUAGES}, so a
 * value like `ts` or `py` (as stored by an editor code block) still resolves to
 * its option for display. Mirrors the highlighter's alias table for the ids listed here.
 */
const CODE_ALIASES: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  cs: 'csharp',
  'c++': 'cpp',
  sh: 'shellscript',
  shell: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  console: 'shellscript',
  yml: 'yaml',
  md: 'markdown',
  htm: 'html',
};
```

In `components/layout/avatar-picker.tsx`, delete the line:

```text
import { AVATAR_COLORS } from '@/registry/bases/base-ui/constants/avatar-colors';
```

replace:

```text
  /** Swatches shown on the Color pane. */
  colors?: readonly string[];
```

with:

```text
  /** Swatches shown on the Color pane. Defaults to twelve hues spread evenly round the wheel. */
  colors?: readonly string[];
```

and replace:

```text
  colors = AVATAR_COLORS,
```

with:

```text
  colors = [
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#10b981',
    '#14b8a6',
    '#0ea5e9',
    '#3b82f6',
  ],
```

(The swatches go into the parameter default rather than a module `const`: the spec's class-string check matches any `const X = [` in a component file, and the prop's doc already names what the list is.)

Run (from the repo root):

```bash
git rm -q apps/registry-ui/registry/bases/base-ui/constants/code-languages.ts apps/registry-ui/registry/bases/base-ui/constants/avatar-colors.ts
ls apps/registry-ui/registry/bases/base-ui/constants 2>&1
grep -rn -e 'constants/' -e 'CODE_LANGUAGES\|AVATAR_COLORS' apps/registry-ui/registry apps/registry-ui/src apps/registry-ui/registry.json | grep -v 'lib/language-options.tsx'
```

Expected: `ls: apps/registry-ui/registry/bases/base-ui/constants: No such file or directory`, and the grep prints nothing.

- [ ] **Step 8: Run the specs, the type check, lint, the registry build and the spec's checks**

Run:

```bash
B=registry/bases/base-ui
pnpm exec vitest run $B/components/layout/model-list.spec.tsx $B/components/feedback/status-indicator.spec.tsx $B/components/data-display/ai-provider-card.spec.tsx $B/components/layout/avatar-picker.spec.tsx $B/lib/language-options.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-int-1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-int-1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-int-1.log" 2>&1; grep 'error TS' "$S/tsc-int-1.log" | cut -c1-80
pnpm exec eslint $B/types/status-tone.ts $B/components/feedback/status-indicator.tsx $B/components/data-display/ai-provider-card.tsx $B/components/layout/model-list.tsx $B/components/layout/model-list.spec.tsx $B/lib/language-options.tsx $B/components/layout/avatar-picker.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-int-1.log" 2>&1; tail -1 "$S/sb-int-1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  5 passed (5)
      Tests  36 passed (36)
 Test Files  79 passed (79)
      Tests  427 passed (427)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

Then the spec's checks over the whole tree, from `apps/registry-ui/registry/bases/base-ui/` (bash):

```bash
find components -mindepth 1 -maxdepth 1 -type d ! -name docs ! -name data-entry \
  ! -name navigation ! -name feedback ! -name data-display ! -name layout ! -name general
find components -maxdepth 1 -type f
grep -rlnE '^export (function|const [A-Z])' components --include='*.tsx' | grep -v /docs/
grep -rnE "^(export )?const [A-Z_]+ = ['\"\`\[]" components --include='*.tsx' | grep -v /docs/
grep -rnoE '[a-z-]+-\[[0-9.]+(px|rem)\]' components --include='*.tsx' | grep -v /docs/
grep -rnE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' \
  components --include='*.tsx' | grep -v /docs/
ls -d */
```

Expected: the six checks print nothing; `ls -d */` prints `blocks/ components/ editor/ examples/ hooks/ lib/ pages/ types/ ui/`, one per line, with no `constants/`.

- [ ] **Step 9: Commit**

`$S/msg-int-1.txt`:

```
fix(registry-ui): dim only unavailable models and settle shared values

Why: ModelListContent dimmed any Item carrying data-unavailable, and
React writes data-unavailable={false} as "false", so an available model
rendered dimmed. The selector keys on data-[unavailable=true] now, pinned
by a spec that compiles the content's classes and matches the rule
against the item. StatusTone has two readers, StatusIndicator and
AiProviderCard, so it moves to types/ and both items ship the file. The
code-language tables and the avatar swatches have one reader each, so
constants/ goes and each value returns inline to its reader.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add -- $B/types/status-tone.ts
git commit -q -F "$S/msg-int-1.txt" -- $B/types/status-tone.ts $B/components/feedback/status-indicator.tsx \
  $B/components/data-display/ai-provider-card.tsx $B/components/layout/model-list.tsx $B/components/layout/model-list.spec.tsx \
  $B/lib/language-options.tsx $B/components/layout/avatar-picker.tsx $B/constants/code-languages.ts $B/constants/avatar-colors.ts \
  apps/registry-ui/registry.json
git status --short
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; `git status --short` prints nothing; the log shows the subject above.

---

### Task 32: Check family names, part shape and registry dependencies by script, and fix what they find

The spec's two checks that need a script rather than a grep (every exported name opens with its file's root; every part spreads its props and carries a `data-slot`), plus the one plan A's final review asked for (every registry item declares what its files import). Each is a small Python script written to `$S/checks/`, run from `apps/registry-ui`, printing nothing and exiting 0 when its rule holds. They are the plan's checks, not the repository's, and are not committed. On the tree after Task 31 the name check and the registry check print nothing; the part check finds one violation, in the panels family: `AvatarPicker` took `open`, `defaultOpen` and `onOpenChange` by name and dropped every other upstream `Popover` root prop. It now takes `Popover`'s props and spreads what it does not read.

No violation is a deviation the spec names: `FileTree` and `Center` keep names with no upstream shape or no subject, which neither script reads, and `Center` passes the part check through `useRender` (its props go through `mergeProps`, its slot through `state`). So no script carries an allowlist.

**Files:**

- Create (outside the repository): `$S/checks/family-names.py`, `$S/checks/part-shape.py`, `$S/checks/registry-deps.py`
- Modify: `components/layout/avatar-picker.tsx`, `components/layout/avatar-picker.spec.tsx`

**Interfaces:**

- Consumes: the tree after Task 31.
- Produces: `AvatarPicker(props: React.ComponentProps<typeof Popover> & { value: AvatarPickerValue; onValueChange: (value: AvatarPickerValue) => void })`; `type AvatarPickerProps` now extends upstream `Popover`'s props, so `open`, `defaultOpen`, `onOpenChange`, `modal`, `actionsRef` and the rest reach `Popover`. No importer outside the family's spec (no registry item ships avatar-picker).

Paths are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/` or `$S`. Commands run from `apps/registry-ui` unless a step says otherwise.

- [ ] **Step 1: Write the three checks**

`$S/checks/family-names.py`:

```python
"""Every name a component family file exports opens with the file's root name.

Run from apps/registry-ui. Prints one line per violation and exits 1; prints
nothing and exits 0 when the rule holds. The root is the PascalCase of the file
stem; a hook may be use<Root>, a recipe or a helper the root's lowerCamel.
"""

import pathlib
import re
import sys

COMPONENTS = pathlib.Path('registry/bases/base-ui/components')
EXPORT_BLOCK = re.compile(r'^export\s+(?:type\s+)?\{([^}]*)\}', re.MULTILINE)
EXPORT_INLINE = re.compile(
    r'^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)',
    re.MULTILINE,
)


def root_of(stem: str) -> str:
    return ''.join(word[:1].upper() + word[1:] for word in stem.split('-'))


def opens_with(name: str, prefix: str) -> bool:
    # ModelListing does not open with ModelList: the next character starts a new word or the name ends.
    return name.startswith(prefix) and (len(name) == len(prefix) or name[len(prefix)].isupper())


def exported_names(source: str) -> list[str]:
    names = []
    for block in EXPORT_BLOCK.findall(source):
        for entry in block.split(','):
            entry = entry.strip()
            if not entry:
                continue
            # `A as B` exports B; `type A` inside a mixed block exports A.
            entry = re.sub(r'^type\s+', '', entry)
            names.append(entry.split(' as ')[-1].strip())
    names.extend(EXPORT_INLINE.findall(source))
    return names


def main() -> int:
    violations = []
    for path in sorted(COMPONENTS.rglob('*.tsx')):
        if 'docs' in path.relative_to(COMPONENTS).parts or path.name.endswith('.spec.tsx'):
            continue
        root = root_of(path.stem)
        allowed = (root, 'use' + root, root[:1].lower() + root[1:])
        for name in exported_names(path.read_text()):
            if not any(opens_with(name, prefix) for prefix in allowed):
                violations.append(f'{path}: {name} does not open with {root}')
    print('\n'.join(violations), end='\n' if violations else '')
    return 1 if violations else 0


if __name__ == '__main__':
    sys.exit(main())
```

`$S/checks/part-shape.py`:

```python
"""Every part a component family file exports spreads its props and carries a data-slot.

Run from apps/registry-ui. Prints one line per violation and exits 1; prints
nothing and exits 0 when the rule holds.

A part is an exported PascalCase function in components/ (docs/ and specs
excluded). It spreads its rest props, or its whole props object, into the JSX it
renders or into the props it hands useRender. It writes a data-slot (useRender
takes it as `slot` in its state), or the element it renders is a ui/ primitive,
which already carries upstream's slot that upstream's own recipes select on.
A part whose body renders nothing but context providers, fragments and parts of
its own family renders no element of its own, so it has nothing to spread onto.
"""

import pathlib
import re
import sys

COMPONENTS = pathlib.Path('registry/bases/base-ui/components')
EXPORT_BLOCK = re.compile(r'^export\s+\{([^}]*)\}', re.MULTILINE)
UI_IMPORT = re.compile(r"^import\s+\{([^}]*)\}\s+from\s+'@/registry/bases/base-ui/ui/[\w-]+';", re.MULTILINE)
# A type argument follows an identifier (useRef<T>); a JSX tag never does.
JSX_TAG = re.compile(r'(?<![\w.$])<([A-Za-z][\w.]*)')
WRAPPER = re.compile(r'\.Provider$|^React\.Fragment$|^Fragment$')


def balanced(source: str, start: int, open_char: str, close_char: str) -> str:
    """The text between the bracket at `start` and its match, brackets excluded."""
    depth = 0
    for index in range(start, len(source)):
        if source[index] == open_char:
            depth += 1
        elif source[index] == close_char:
            depth -= 1
            if depth == 0:
                return source[start + 1 : index]
    raise ValueError(f'unbalanced {open_char} at {start}')


def names_in(block: str) -> list[str]:
    return [entry.strip().split(' as ')[-1].strip() for entry in block.split(',') if entry.strip()]


def check(path: pathlib.Path, root: str, name: str, source: str, upstream: set[str]) -> list[str]:
    match = re.search(rf'^function {name}\b[^(]*\(', source, re.MULTILINE)
    if match is None:
        return [f'{path}: {name} is not a function declaration']
    params = balanced(source, match.end() - 1, '(', ')')
    # The return type annotation holds no brace, so the next one opens the body.
    body = balanced(source, source.index('{', match.end() + len(params)), '{', '}')
    rendered = [tag for tag in JSX_TAG.findall(body) if not WRAPPER.search(tag)]
    uses_render = 'useRender(' in body
    if not uses_render and all(tag.startswith(root) for tag in rendered):
        return []
    problems = []
    rest = re.search(r'\.\.\.(\w+)', params)
    whole = re.match(r'\s*(\w+)\s*:', params)
    spread = rest.group(1) if rest else whole.group(1) if whole else None
    spreads = spread is not None and (
        re.search(rf'\{{\s*\.\.\.{spread}\s*\}}', body) is not None
        or (uses_render and re.search(rf'mergeProps\b[^;]*\b{spread}\s*\)', body) is not None)
    )
    if not spreads:
        problems.append(f'{path}: {name} does not spread its props onto the element it renders')
    slotted = 'data-slot' in body or (uses_render and re.search(r'\bslot:\s*[\'"]', body) is not None)
    if not slotted and (not rendered or rendered[0].split('.')[0] not in upstream):
        problems.append(f'{path}: {name} carries no data-slot')
    return problems


def main() -> int:
    violations = []
    for path in sorted(COMPONENTS.rglob('*.tsx')):
        if 'docs' in path.relative_to(COMPONENTS).parts or path.name.endswith('.spec.tsx'):
            continue
        source = path.read_text()
        root = ''.join(word[:1].upper() + word[1:] for word in path.stem.split('-'))
        upstream = {name for block in UI_IMPORT.findall(source) for name in names_in(block)}
        for block in EXPORT_BLOCK.findall(source):
            for name in names_in(block):
                if name[:1].isupper():
                    violations.extend(check(path, root, name, source, upstream))
    print('\n'.join(violations), end='\n' if violations else '')
    return 1 if violations else 0


if __name__ == '__main__':
    sys.exit(main())
```

`$S/checks/registry-deps.py`:

```python
"""Every registry.json item declares exactly what its files import.

Run from apps/registry-ui. Prints one line per violation and exits 1; prints
nothing and exits 0 when the rule holds.

A ui/ primitive import needs @shadcn/<name> in registryDependencies, as do the
two other files shadcn vendors here (lib/utils, hooks/use-mobile). An import of
another file of this registry needs that file in the item's own files, or the
URL of an item that ships it in registryDependencies. A bare package import
needs the package in dependencies; react, react-dom and next are the app's own.
A declaration that no file of the item needs is reported as well.
"""

import json
import pathlib
import posixpath
import re
import sys

BASE = '@/registry/bases/base-ui/'
BASE_DIR = 'registry/bases/base-ui/'
REGISTRY_URL = 'https://ui.zeroxsolutions.com/r/'
VENDORED = {'lib/utils': '@shadcn/utils', 'hooks/use-mobile': '@shadcn/use-mobile'}
PROVIDED = {'react', 'react-dom', 'next'}
IMPORT = re.compile(
    r"""^(?:import|export)\s+(?:type\s+)?[\w$*{}\s,]*?from\s+['"]([^'"]+)['"]"""  # import / re-export ... from
    r"""|^import\s+['"]([^'"]+)['"]"""  # side-effect import
    r"""|\bimport\(\s*['"]([^'"]+)['"]\s*\)""",  # dynamic import
    re.MULTILINE,
)


def specifiers(source: str) -> list[str]:
    return [next(group for group in groups if group) for groups in IMPORT.findall(source)]


def package_of(specifier: str) -> str:
    """The package a specifier or a dependencies entry names: `@scope/pkg/sub` -> `@scope/pkg`, `pkg@^1` -> `pkg`."""
    parts = specifier.split('/')
    name = '/'.join(parts[:2]) if specifier.startswith('@') else parts[0]
    return name[0] + name[1:].split('@')[0]


def resolve(importer: str, specifier: str) -> str:
    """The registry.json path a local import reaches, extension included."""
    if specifier.startswith(BASE):
        stem = BASE_DIR + specifier[len(BASE) :]
    else:
        stem = posixpath.normpath(posixpath.join(posixpath.dirname(importer), specifier))
    for candidate in (stem + '.tsx', stem + '.ts', stem + '/index.ts'):
        if pathlib.Path(candidate).exists():
            return candidate
    return stem


def main() -> int:
    items = json.loads(pathlib.Path('registry.json').read_text())['items']
    files_of = {item['name']: {file['path'] for file in item['files']} for item in items}
    violations = []
    for item in items:
        name = item['name']
        own = files_of[name]
        registry_deps = item.get('registryDependencies', [])
        declared_upstream = {dep for dep in registry_deps if dep.startswith('@shadcn/')}
        declared_items = {dep[len(REGISTRY_URL) : -len('.json')] for dep in registry_deps if dep.startswith(REGISTRY_URL)}
        declared_packages = {package_of(dep) for dep in item.get('dependencies', [])}
        needed_upstream: set[str] = set()
        needed_items: set[str] = set()
        needed_packages: set[str] = set()
        for path in sorted(own):
            for specifier in specifiers(pathlib.Path(path).read_text()):
                local = specifier[len(BASE) :] if specifier.startswith(BASE) else None
                if local is not None and local.startswith('ui/'):
                    needed_upstream.add('@shadcn/' + local[len('ui/') :])
                elif local in VENDORED:
                    needed_upstream.add(VENDORED[local])
                elif local is not None or specifier.startswith('.'):
                    target = resolve(path, specifier)
                    if target in own:
                        continue
                    shippers = sorted(other for other, paths in files_of.items() if target in paths)
                    covered = [other for other in shippers if other in declared_items]
                    if covered:
                        needed_items.update(covered)
                    elif shippers:
                        violations.append(f'{name}: {path} imports {target}; add it to files or depend on {REGISTRY_URL}{shippers[0]}.json')
                    else:
                        violations.append(f'{name}: {path} imports {target}, which no item ships; add it to files')
                elif specifier.startswith('@/'):
                    violations.append(f'{name}: {path} imports {specifier}, which is outside the registry')
                elif package_of(specifier) not in PROVIDED:
                    needed_packages.add(package_of(specifier))
        for dep in sorted(needed_upstream - declared_upstream):
            violations.append(f'{name}: registryDependencies lacks {dep}')
        for dep in sorted(declared_upstream - needed_upstream):
            violations.append(f'{name}: registryDependencies declares {dep}, which no file imports')
        for dep in sorted(declared_items - needed_items):
            violations.append(f'{name}: registryDependencies declares {REGISTRY_URL}{dep}.json, which no file imports')
        for dep in sorted(needed_packages - declared_packages):
            violations.append(f'{name}: dependencies lacks {dep}')
        for dep in sorted(declared_packages - needed_packages):
            violations.append(f'{name}: dependencies declares {dep}, which no file imports')
    print('\n'.join(violations), end='\n' if violations else '')
    return 1 if violations else 0


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 2: Run them and read what they find**

Run:

```bash
for check in family-names part-shape registry-deps; do python3 "$S/checks/$check.py"; echo "$check exit $?"; done
```

Expected:

```
family-names exit 0
registry/bases/base-ui/components/layout/avatar-picker.tsx: AvatarPicker does not spread its props onto the element it renders
part-shape exit 1
registry-deps exit 0
```

(Before Task 31, `family-names` also printed `registry/bases/base-ui/components/feedback/status-indicator.tsx: StatusTone does not open with StatusIndicator`; that task moved the type to `types/`.)

- [ ] **Step 3: Write the failing AvatarPicker spec**

In `components/layout/avatar-picker.spec.tsx`, replace:

```text
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Palette, Smile, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
```

with:

```text
import type { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Palette, Smile, Upload } from 'lucide-react';
import { createRef, type ReactNode } from 'react';
```

and replace the end of the file:

```text
    fireEvent.click(screen.getByRole('button', { name: '#6366f1' }));
    expect(onChange).toHaveBeenCalledWith({ color: '#6366f1' });
  });
});
```

with:

```text
    fireEvent.click(screen.getByRole('button', { name: '#6366f1' }));
    expect(onChange).toHaveBeenCalledWith({ color: '#6366f1' });
  });

  it('hands upstream Popover the root props it does not read', async () => {
    const actionsRef = createRef<PopoverPrimitive.Root.Actions>();
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()} defaultOpen actionsRef={actionsRef}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <Tabs defaultValue="color">
            <AvatarPickerColor />
          </Tabs>
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeTruthy();

    act(() => actionsRef.current?.close());

    await waitFor(() => expect(screen.queryByRole('button', { name: '#6366f1' })).toBeNull());
  });
});
```

(`actionsRef` is a `Popover.Root` prop the picker never names; closing through it is observable in jsdom, where `modal` is not.)

- [ ] **Step 4: Run it and watch it fail**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/avatar-picker.spec.tsx 2>&1 | grep -E '✓|×|AssertionError|Test Files|^ +Tests' | sed -E 's/ [0-9]+ms$//'
```

Expected:

```
     ✓ shows only the pane the consumer composes when it declares no tab strip
     ✓ switches panes through the tabs the consumer declares
     ✓ lets children override the upload copy
     ✓ marks the upload pane data-uploading until onUpload settles, then adopts the resolved URL
     ✓ clears emoji and image on Remove and still runs the consumer's onClick
     ✓ marks the current colour swatch pressed and sets the colour on a click
     × hands upstream Popover the root props it does not read
AssertionError: expected <button type="button" …(4)></button> to be null
 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
```

- [ ] **Step 5: Spread the root's props onto `Popover`**

In `components/layout/avatar-picker.tsx`, replace:

```text
interface AvatarPickerProps {
  value: AvatarPickerValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarPickerValue) => void;
  /** Open state - uncontrolled by default; pass `open` to control it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Compose `AvatarPickerTrigger` + `AvatarPickerContent`. */
  children?: React.ReactNode;
}
```

with:

```text
interface AvatarPickerProps extends React.ComponentProps<typeof Popover> {
  value: AvatarPickerValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarPickerValue) => void;
}
```

replace:

```text
function AvatarPicker({
  value,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: AvatarPickerProps): React.ReactNode {
```

with:

```text
function AvatarPicker({ value, onValueChange, ...props }: AvatarPickerProps): React.ReactNode {
```

and replace:

```text
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} data-slot="avatar-picker">
        {children}
      </Popover>
```

with:

```text
      <Popover data-slot="avatar-picker" {...props} />
```

- [ ] **Step 6: Run the spec and the three checks**

Run:

```bash
pnpm exec vitest run registry/bases/base-ui/components/layout/avatar-picker.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
for check in family-names part-shape registry-deps; do python3 "$S/checks/$check.py"; echo "$check exit $?"; done
```

Expected:

```
 Test Files  1 passed (1)
      Tests  7 passed (7)
family-names exit 0
part-shape exit 0
registry-deps exit 0
```

- [ ] **Step 7: Run the whole suite, the type check, lint and the registry build**

Run:

```bash
F=registry/bases/base-ui/components/layout
pnpm exec vitest run > "$S/vt-int-2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-int-2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-int-2.log" 2>&1; grep 'error TS' "$S/tsc-int-2.log" | cut -c1-80
pnpm exec eslint $F/avatar-picker.tsx $F/avatar-picker.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec shadcn build > "$S/sb-int-2.log" 2>&1; tail -1 "$S/sb-int-2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  79 passed (79)
      Tests  428 passed (428)
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
✔ Building registry.
✔ Checked 1 registry file and 22 items.
```

(eslint prints no problem line; the only tsc error is the baseline one.)

- [ ] **Step 8: Commit**

`$S/msg-int-2.txt`:

```
fix(registry-ui): hand the avatar picker's popover props to upstream

Why: AvatarPicker took open, defaultOpen and onOpenChange by name and
dropped every other Popover root prop, so a consumer could not reach
modal or actionsRef. It now takes upstream Popover's props and spreads
what it does not read onto it, as every other part of the family does.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git commit -q -F "$S/msg-int-2.txt" -- $B/components/layout/avatar-picker.tsx $B/components/layout/avatar-picker.spec.tsx
git status --short
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; `git status --short` prints nothing; the log shows the subject above.

---
