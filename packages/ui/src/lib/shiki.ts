import type { CSSProperties } from 'react';
import { createHighlighter, type Highlighter } from 'shiki';
import type { ThemedToken } from 'shiki/types';

import { CODE_THEME_NAME, codeTheme } from './code-theme';

/**
 * Framework-agnostic Shiki core — the single highlighter instance, lazy grammar
 * loading, and the brand syntax theme, with NO CodeMirror imports so a static
 * `<pre>` (the chat `CodeBlock`) can highlight without dragging the editor into
 * its bundle. The CodeMirror bridge ({@link file://./code-syntax.ts}) and the
 * static renderer both consume this module, sharing one highlighter + one
 * grammar cache.
 *
 * The theme is {@link codeTheme} — a hand-authored TextMate theme whose token
 * colors are `var(--code-*)` design tokens (defined in `styles.css`), so the
 * palette is brand-linked and flips light/dark for free.
 */

/** Name of the registered syntax theme; passed to `codeToTokens`. */
export const SHIKI_THEME_NAME = CODE_THEME_NAME;

let highlighter: Highlighter | null = null;
let creating: Promise<Highlighter> | null = null;
const loadingLangs = new Map<string, Promise<void>>();

export function ensureHighlighter(): Promise<Highlighter> {
  if (highlighter) return Promise.resolve(highlighter);
  if (!creating) {
    creating = createHighlighter({
      themes: [codeTheme],
      langs: [],
    }).then((h) => {
      highlighter = h;
      return h;
    });
  }
  return creating;
}

/**
 * Grammar loaders, one LITERAL dynamic import per language we highlight. shiki's
 * own `loadLanguage('<id>')` resolves a grammar through its internal
 * `bundledLanguages[id]()` map keyed on a COMPUTED id — which a bundler's static
 * scanner cannot follow. Under Vite that means a grammar is discovered only at
 * first highlight, which forces an on-demand dep re-optimization; the already
 * loaded shiki chunk then imports the grammar with a now-stale `?v=` hash, the
 * request 504s ("Outdated Optimize Dep"), shiki swallows it, and the file is
 * left unhighlighted with no error. Importing each grammar by a LITERAL
 * specifier here makes the dependency statically analyzable, so every bundler
 * pre-bundles it deterministically — no runtime discovery, no hash drift. A
 * language absent from this map degrades to plain text. The set mirrors the
 * file router's `EXTENSION_TO_LANGUAGE` (file-content-router) plus Markdown.
 */
const LANG_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  markdown: () => import('@shikijs/langs/markdown'),
  json: () => import('@shikijs/langs/json'),
  yaml: () => import('@shikijs/langs/yaml'),
  toml: () => import('@shikijs/langs/toml'),
  ini: () => import('@shikijs/langs/ini'),
  xml: () => import('@shikijs/langs/xml'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  less: () => import('@shikijs/langs/less'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  python: () => import('@shikijs/langs/python'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  sql: () => import('@shikijs/langs/sql'),
  dockerfile: () => import('@shikijs/langs/dockerfile'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  java: () => import('@shikijs/langs/java'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  swift: () => import('@shikijs/langs/swift'),
  c: () => import('@shikijs/langs/c'),
  cpp: () => import('@shikijs/langs/cpp'),
  csharp: () => import('@shikijs/langs/csharp'),
  php: () => import('@shikijs/langs/php'),
  ruby: () => import('@shikijs/langs/ruby'),
  lua: () => import('@shikijs/langs/lua'),
};

/**
 * Common shiki language aliases → the canonical id in {@link LANG_LOADERS}.
 * The editor passes canonical ids (the file router's `EXTENSION_TO_LANGUAGE`),
 * but a Markdown code fence (chat `CodeBlock`) carries whatever the author typed
 * — `js`, `ts`, `py`, `sh`, ```` ```bash ````, … — so those must map back to the
 * one grammar we load.
 */
const LANG_ALIASES: Record<string, string> = {
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

/**
 * Canonical grammar id for a (possibly aliased) language, or `undefined` when no
 * grammar is bundled for it — the signal to render plain text.
 */
export function resolveLanguage(lang: string): string | undefined {
  const id = LANG_ALIASES[lang] ?? lang;
  return id in LANG_LOADERS ? id : undefined;
}

// Lazy per-language load (the full grammar bundle is ~10MB — never load it all).
// `lang` may be an alias; we key the in-flight guard by the CANONICAL id so two
// aliases of one grammar share a single load. A failed or unsupported load still
// resolves so the language degrades to plain text, not an infinite re-highlight.
export function ensureLanguage(lang: string): Promise<void> {
  const canonical = resolveLanguage(lang);
  const key = canonical ?? lang;
  const existing = loadingLangs.get(key);
  if (existing) return existing;
  // No grammar for this id → cache a settled no-op so the caller stops retrying.
  if (!canonical) {
    const noop = Promise.resolve();
    loadingLangs.set(key, noop);
    return noop;
  }
  const p = ensureHighlighter()
    .then((h) =>
      h.getLoadedLanguages().includes(canonical)
        ? undefined
        : LANG_LOADERS[canonical]().then((mod) =>
            h.loadLanguage(
              mod.default as Parameters<Highlighter['loadLanguage']>[0],
            ),
          ),
    )
    .then(() => undefined)
    .catch(() => undefined);
  loadingLangs.set(key, p);
  return p;
}

/** The loaded highlighter, or `null` until {@link ensureHighlighter} resolves. */
export function getLoadedHighlighter(): Highlighter | null {
  return highlighter;
}

/** Whether highlighter creation has been kicked off (the load is in flight or done). */
export function highlighterPending(): boolean {
  return creating != null;
}

/** Whether a load for `lang` is already tracked (the de-dup guard for re-highlight). */
export function languagePending(lang: string): boolean {
  return loadingLangs.has(lang);
}

/** A token's mark range in document coordinates plus the inline style to apply. */
export interface SyntaxRange {
  from: number;
  to: number;
  style: string;
}

/**
 * Inline style for a Shiki token. `fontStyle` is the vscode-textmate `FontStyle`
 * bitflag (Italic 1 · Bold 2 · Underline 4 · Strikethrough 8); we read the bits
 * directly rather than importing the inlined `const enum`. Returns `''` when the
 * token carries no visible styling (e.g. whitespace). CodeMirror's
 * `Decoration.mark` takes a CSS string; the React renderer uses
 * {@link styleObjectForToken}.
 */
export function styleForToken(color?: string, fontStyle?: number): string {
  const parts: string[] = [];
  if (color) parts.push(`color:${color}`);
  if (fontStyle && fontStyle > 0) {
    if (fontStyle & 1) parts.push('font-style:italic');
    if (fontStyle & 2) parts.push('font-weight:bold');
    const decoration: string[] = [];
    if (fontStyle & 4) decoration.push('underline');
    if (fontStyle & 8) decoration.push('line-through');
    if (decoration.length) parts.push(`text-decoration:${decoration.join(' ')}`);
  }
  return parts.join(';');
}

/**
 * React-inline-style variant of {@link styleForToken} — a `CSSProperties` object
 * for a `<span style>` rather than a CSS string. Empty object for an unstyled
 * token (e.g. whitespace).
 */
export function styleObjectForToken(color?: string, fontStyle?: number): CSSProperties {
  const style: CSSProperties = {};
  if (color) style.color = color;
  if (fontStyle && fontStyle > 0) {
    if (fontStyle & 1) style.fontStyle = 'italic';
    if (fontStyle & 2) style.fontWeight = 'bold';
    const decoration: string[] = [];
    if (fontStyle & 4) decoration.push('underline');
    if (fontStyle & 8) decoration.push('line-through');
    if (decoration.length) style.textDecoration = decoration.join(' ');
  }
  return style;
}

/**
 * Map Shiki's 2D token array to flat mark ranges. Each token's `offset` is
 * absolute to the input (0-indexed), so it maps straight to a CodeMirror
 * position. Pure — no Shiki, no CodeMirror — so it is unit-testable in
 * isolation. Zero-length and unstyled tokens are dropped.
 */
export function tokensToRanges(tokens: ThemedToken[][]): SyntaxRange[] {
  const ranges: SyntaxRange[] = [];
  for (const line of tokens) {
    for (const token of line) {
      const length = token.content.length;
      if (length === 0) continue;
      const style = styleForToken(token.color, token.fontStyle);
      if (!style) continue;
      ranges.push({ from: token.offset, to: token.offset + length, style });
    }
  }
  return ranges;
}

/** A single highlighted token: its text and, when styled, a React inline style. */
export interface HighlightToken {
  content: string;
  style?: CSSProperties;
}

/** Highlighted tokens for one source line (whitespace preserved, no trailing newline). */
export type HighlightLine = HighlightToken[];

/**
 * Tokenize `code` as `language` into styled lines for a static `<pre>`. Resolves
 * to `null` — meaning "render plain text" — when the language is empty, the
 * grammar is unknown, or the highlighter throws; the caller shows the raw string
 * until (and unless) this resolves to real lines. Awaits the lazy grammar load,
 * so the first call for a language returns after Shiki has fetched it.
 */
export async function highlightToLines(
  code: string,
  language: string,
): Promise<HighlightLine[] | null> {
  const canonical = resolveLanguage(language.trim());
  if (!canonical) return null;
  await ensureLanguage(canonical);
  const h = highlighter;
  if (!h || !h.getLoadedLanguages().includes(canonical)) return null;

  let tokens: ThemedToken[][];
  try {
    tokens = h.codeToTokens(code, {
      // `canonical` is loaded above; the bundled signature narrows to known ids,
      // so widen our checked string to it.
      lang: canonical as Parameters<Highlighter['codeToTokens']>[1]['lang'],
      theme: SHIKI_THEME_NAME,
    }).tokens;
  } catch {
    return null;
  }

  return tokens.map((line) =>
    line.map((token) => {
      const style = styleObjectForToken(token.color, token.fontStyle);
      return Object.keys(style).length > 0
        ? { content: token.content, style }
        : { content: token.content };
    }),
  );
}
