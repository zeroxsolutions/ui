import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { Fragment, useEffect, useState } from 'react';

import { CopyButton } from '@/registry/bases/base-ui/components/copy-button';
import {
  Disclosure,
  DisclosureActions,
  DisclosureContent,
  DisclosureHeader,
  DisclosureTitle,
  DisclosureTrigger,
} from '@/registry/bases/base-ui/components/disclosure';
import { codeLanguageIcon } from '@/registry/bases/base-ui/components/language-switcher-data';
import { ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import {
  highlightToLines,
  type HighlightLine,
} from '@/registry/bases/base-ui/lib/shiki';
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
 * (`MarkdownView codeBlocks`), tool Parameters/Result panels, and JSON
 * disclosures.
 *
 * A read-only view: it renders the highlighted source, never an editing surface
 * — the editable code surface lives in the composite editor package's code-block
 * feature, which composes this same `Disclosure` chrome so the two read
 * identically.
 *
 * `code` is the source string. Presentational — copy uses the Clipboard API
 * best-effort and resets after ~2s.
 */
export interface CodeBlockProps {
  code: string;
  /** Shiki language id (e.g. `ts`, `json`, `bash`); drives highlighting + header. */
  language?: string;
  className?: string;
}

/** Languages with no real grammar — no header, no highlight (plain `<pre>`). */
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

function isPlainLanguage(language: string | undefined): boolean {
  return !language || PLAIN_LANGUAGES.has(language.toLowerCase());
}

function languageLabel(language: string): string {
  return LANGUAGE_LABEL[language.toLowerCase()] ?? language;
}

/**
 * Tokenize `code` as `language` via the shared Shiki highlighter. Returns `null`
 * until the (async, lazily loaded) grammar resolves and for unknown languages —
 * the caller renders the raw string meanwhile. Unmount-safe; re-runs on code or
 * language change.
 */
function useHighlightedLines(
  code: string,
  language: string | undefined,
): HighlightLine[] | null {
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

function HighlightedCode({ lines }: { lines: HighlightLine[] }) {
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

export function CodeBlock({ code, language, className }: CodeBlockProps) {
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
          <code className="font-mono">
            {lines ? <HighlightedCode lines={lines} /> : code}
          </code>
        </pre>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );

  // An unlabelled block stays a minimal muted surface with a hover copy — no
  // header, so no Disclosure chrome; used for fenced code inside markdown and JSON
  // panels, where a header/collapse would be noise. Borderless on purpose: the
  // surface is delineated by `bg-muted`, so a block nested inside a card doesn't
  // stack border-inside-border.
  if (!hasHeader) {
    return (
      <div
        data-slot="code-block"
        data-language={language}
        className={cn(
          'group/code relative w-full overflow-hidden rounded-md bg-muted/50',
          className,
        )}
      >
        <CopyButton
          value={code}
          label="Copy code"
          className="absolute right-1 top-1 z-10 bg-muted/70 opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
        />
        {body}
      </div>
    );
  }

  // A labelled block composes the shared Disclosure: the language (icon + label)
  // fills the title; copy + the collapse toggle fill the actions; the code body
  // is the collapsible content. `data-slot` stays "code-block" — the editor
  // stylesheet targets it — so the Disclosure root carries it instead of its
  // default "disclosure".
  return (
    <Disclosure
      variant="muted"
      data-slot="code-block"
      data-language={language}
      className={cn('group/code', className)}
    >
      <DisclosureHeader>
        <DisclosureTitle>
          {LanguageIcon ? <LanguageIcon className="shrink-0" /> : null}
          <span className="text-xs">{languageLabel(language as string)}</span>
        </DisclosureTitle>
        <DisclosureActions>
          <CopyButton value={code} label="Copy code" size="icon" />
          <DisclosureTrigger />
        </DisclosureActions>
      </DisclosureHeader>
      <DisclosureContent>{body}</DisclosureContent>
    </Disclosure>
  );
}
