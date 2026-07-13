import type { ComponentPropsWithoutRef, FC, ReactNode } from "react"

import { CIcon } from "@zeroxsolutions/icons/material/c"
import { ConsoleIcon } from "@zeroxsolutions/icons/material/console"
import { CppIcon } from "@zeroxsolutions/icons/material/cpp"
import { CssIcon } from "@zeroxsolutions/icons/material/css"
import { CsharpIcon } from "@zeroxsolutions/icons/material/csharp"
import { DatabaseIcon } from "@zeroxsolutions/icons/material/database"
import { DockerIcon } from "@zeroxsolutions/icons/material/docker"
import { DocumentIcon } from "@zeroxsolutions/icons/material/document"
import { GoIcon } from "@zeroxsolutions/icons/material/go"
import { HtmlIcon } from "@zeroxsolutions/icons/material/html"
import { JavaIcon } from "@zeroxsolutions/icons/material/java"
import { JavascriptIcon } from "@zeroxsolutions/icons/material/javascript"
import { JsonIcon } from "@zeroxsolutions/icons/material/json"
import { KotlinIcon } from "@zeroxsolutions/icons/material/kotlin"
import { LessIcon } from "@zeroxsolutions/icons/material/less"
import { LuaIcon } from "@zeroxsolutions/icons/material/lua"
import { MarkdownIcon } from "@zeroxsolutions/icons/material/markdown"
import { MermaidIcon } from "@zeroxsolutions/icons/material/mermaid"
import { PhpIcon } from "@zeroxsolutions/icons/material/php"
import { PythonIcon } from "@zeroxsolutions/icons/material/python"
import { ReactIcon } from "@zeroxsolutions/icons/material/react"
import { RubyIcon } from "@zeroxsolutions/icons/material/ruby"
import { RustIcon } from "@zeroxsolutions/icons/material/rust"
import { SassIcon } from "@zeroxsolutions/icons/material/sass"
import { SwiftIcon } from "@zeroxsolutions/icons/material/swift"
import { TomlIcon } from "@zeroxsolutions/icons/material/toml"
import { TypescriptIcon } from "@zeroxsolutions/icons/material/typescript"
import { XmlIcon } from "@zeroxsolutions/icons/material/xml"
import { YamlIcon } from "@zeroxsolutions/icons/material/yaml"

/** The domain a switcher's built-in option data is drawn from. */
export type LanguageKind = "locale" | "code"

/** One selectable language: a stable `value`, a display `label`, an optional leading icon. */
export interface LanguageOption {
  value: string
  label: string
  icon?: ReactNode
}

/** A Material icon component — scales by `size` and accepts the usual svg props (`className`, …). */
export type LanguageIcon = FC<
  { size?: string | number } & ComponentPropsWithoutRef<"svg">
>

/**
 * The programming languages the design system can syntax-highlight (the shiki
 * registry in `src/lib/shiki.ts`), each with a display label and its full-color
 * Material file-type icon. This is a deliberate, self-contained copy of the id
 * set — importing it drags in no Shiki highlighter — kept in sync with the
 * highlighter's `CODE_LANGUAGE_IDS` by a co-located test. A few ids reuse a
 * near-neighbour icon (`jsx`/`tsx` → React, `shellscript` → console,
 * `dockerfile` → docker, `sql` → database, `ini` → document, `scss` → sass).
 */
const CODE_LANGUAGES: readonly { id: string; label: string; Icon: LanguageIcon }[] = [
  { id: "markdown", label: "Markdown", Icon: MarkdownIcon },
  { id: "mermaid", label: "Mermaid", Icon: MermaidIcon },
  { id: "json", label: "JSON", Icon: JsonIcon },
  { id: "yaml", label: "YAML", Icon: YamlIcon },
  { id: "toml", label: "TOML", Icon: TomlIcon },
  { id: "ini", label: "INI", Icon: DocumentIcon },
  { id: "xml", label: "XML", Icon: XmlIcon },
  { id: "html", label: "HTML", Icon: HtmlIcon },
  { id: "css", label: "CSS", Icon: CssIcon },
  { id: "scss", label: "SCSS", Icon: SassIcon },
  { id: "less", label: "Less", Icon: LessIcon },
  { id: "javascript", label: "JavaScript", Icon: JavascriptIcon },
  { id: "typescript", label: "TypeScript", Icon: TypescriptIcon },
  { id: "jsx", label: "JSX", Icon: ReactIcon },
  { id: "tsx", label: "TSX", Icon: ReactIcon },
  { id: "python", label: "Python", Icon: PythonIcon },
  { id: "shellscript", label: "Shell", Icon: ConsoleIcon },
  { id: "sql", label: "SQL", Icon: DatabaseIcon },
  { id: "dockerfile", label: "Dockerfile", Icon: DockerIcon },
  { id: "go", label: "Go", Icon: GoIcon },
  { id: "rust", label: "Rust", Icon: RustIcon },
  { id: "java", label: "Java", Icon: JavaIcon },
  { id: "kotlin", label: "Kotlin", Icon: KotlinIcon },
  { id: "swift", label: "Swift", Icon: SwiftIcon },
  { id: "c", label: "C", Icon: CIcon },
  { id: "cpp", label: "C++", Icon: CppIcon },
  { id: "csharp", label: "C#", Icon: CsharpIcon },
  { id: "php", label: "PHP", Icon: PhpIcon },
  { id: "ruby", label: "Ruby", Icon: RubyIcon },
  { id: "lua", label: "Lua", Icon: LuaIcon },
]

/** The canonical code-language ids this module offers, in display order (for the sync test). */
export const CODE_LANGUAGE_OPTION_IDS: readonly string[] = CODE_LANGUAGES.map(
  (l) => l.id,
)

/**
 * Common code-fence aliases → the canonical id in {@link CODE_LANGUAGES}, so a
 * value like `ts` or `py` (as stored by an editor code block) still resolves to
 * its option for display. Mirrors the highlighter's alias table for the ids we list.
 */
const CODE_ALIASES: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  cs: "csharp",
  "c++": "cpp",
  sh: "shellscript",
  shell: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  console: "shellscript",
  yml: "yaml",
  md: "markdown",
  htm: "html",
}

/** The canonical code id for a possibly-aliased value (`ts` → `typescript`); unchanged if unknown. */
export function canonicalCodeId(value: string): string {
  return CODE_ALIASES[value] ?? value
}

const CODE_ICON_BY_ID: Record<string, LanguageIcon> = Object.fromEntries(
  CODE_LANGUAGES.map((l) => [l.id, l.Icon]),
)

/**
 * The full-color Material icon component for a code-language id — resolving
 * aliases (`ts` → `typescript`), falling back to a generic document icon for ids
 * outside the highlightable set. Lets other surfaces (e.g. a read-only code-block
 * header) show the same icons the switcher uses. Self-scales at `size="1em"`.
 */
export function codeLanguageIcon(id: string): LanguageIcon {
  return CODE_ICON_BY_ID[canonicalCodeId(id)] ?? DocumentIcon
}

let cachedCodeOptions: LanguageOption[] | null = null

/**
 * The built-in `kind="code"` options: every highlightable language as a
 * {@link LanguageOption} carrying its Material icon. Computed once and reused.
 */
export function codeLanguageOptions(): LanguageOption[] {
  cachedCodeOptions ??= CODE_LANGUAGES.map(({ id, label, Icon }) => ({
    value: id,
    label,
    icon: <Icon aria-hidden />,
  }))
  return cachedCodeOptions
}

/** The native language name for a BCP-47 code (`vi` → `Tiếng Việt`), or the raw code as fallback. */
function localeLabel(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code
  } catch {
    return code
  }
}

/**
 * The built-in `kind="locale"` options: each BCP-47 code labelled with its own
 * native language name. Pass an explicit `options` to the switcher to override
 * these labels.
 */
export function localeOptions(codes: readonly string[]): LanguageOption[] {
  return codes.map((code) => ({ value: code, label: localeLabel(code) }))
}
