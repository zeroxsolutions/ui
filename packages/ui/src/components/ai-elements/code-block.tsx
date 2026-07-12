import { Check, Copy } from 'lucide-react';
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import {
  Fragment,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { codeLanguageIcon } from '@/components/language-switcher-data';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { ScrollBar } from '@/components/ui/scroll-area';
import { highlightToLines, type HighlightLine } from '@/lib/shiki';
import { cn } from '@/lib/utils';

/**
 * Lazily loaded so read-only consumers (markdown, tool panels) never bundle the
 * CodeMirror/Shiki editing surface — it loads only when `editable` is used.
 */
const CodeEditorPane = lazy(() =>
  import('@/components/code-editor-pane').then((module) => ({
    default: module.CodeEditorPane,
  })),
);

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
 * Pass `editable` to make the body an editable code surface (the lazily-loaded
 * `CodeEditorPane` — CodeMirror + Shiki), wiring edits back through `onCodeChange`
 * and, when `onLanguageChange` is given, turning the header label into a language
 * picker. Editable and read-only share the same header/copy chrome, so a code
 * block reads identically whether it is being edited or displayed.
 *
 * `code` is the source string. Presentational — copy uses the Clipboard API
 * best-effort and resets after ~2s.
 */
export interface CodeBlockProps {
  code: string;
  /** Shiki language id (e.g. `ts`, `json`, `bash`); drives highlighting + header. */
  language?: string;
  className?: string;
  /** Make the body an editable code surface (CodeMirror + Shiki) instead of a `<pre>`. */
  editable?: boolean;
  /** Fired with the full code on every edit (requires `editable`). */
  onCodeChange?: (code: string) => void;
  /** When given (and `editable`), the header language label becomes a picker. */
  onLanguageChange?: (language: string) => void;
}

const COPY_RESET_MS = 2000;

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

function CopyButton({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(() => {
    if (!navigator?.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        timer.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
      })
      .catch(() => {
        /* best-effort */
      });
  }, [code]);

  const Icon = copied ? Check : Copy;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={className}
    >
      <Icon />
    </Button>
  );
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

export function CodeBlock({
  code,
  language,
  className,
  editable,
  onCodeChange,
  onLanguageChange,
}: CodeBlockProps) {
  // Skip the read-only tokenizer while editing — `CodeEditorPane` highlights itself.
  const lines = useHighlightedLines(code, editable ? undefined : language);
  const isPlain = isPlainLanguage(language);
  // An editable block always carries the header (so it has a language picker +
  // copy); a read-only block only when the language is real (else a hover copy).
  const hasHeader = editable || !isPlain;
  // The full-color Material icon for the language (shared with the language
  // switcher); it self-scales at 1em, so it carries no size class.
  const LanguageIcon = !isPlain ? codeLanguageIcon(language as string) : null;

  return (
    <div
      data-slot="code-block"
      data-language={language}
      className={cn(
        // Borderless on purpose — the surface is delineated by `bg-muted`, not a
        // border, so a code block nested inside a tool/JSON card doesn't stack
        // border-inside-border.
        'group/code relative w-full overflow-hidden rounded-md bg-muted/50',
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-1.5">
          {/* The picker renders its own language icon — only show a standalone
              icon for the read-only label. */}
          {LanguageIcon && !(editable && onLanguageChange) ? (
            <LanguageIcon className="shrink-0" />
          ) : null}
          {editable && onLanguageChange ? (
            <LanguageSwitcher
              kind="code"
              searchable
              value={language ?? 'text'}
              onValueChange={onLanguageChange}
              aria-label="Language"
              placeholder="Language…"
            />
          ) : (
            <span className="text-[11px] font-medium text-muted-foreground">
              {isPlain ? 'Text' : languageLabel(language as string)}
            </span>
          )}
          <span className="flex-1" />
          <CopyButton code={code} />
        </div>
      ) : (
        <CopyButton
          code={code}
          className="absolute right-1 top-1 z-10 bg-muted/70 opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
        />
      )}
      {editable ? (
        <Suspense
          fallback={
            <pre className="m-0 px-3 py-2 text-xs leading-relaxed">
              <code className="font-mono">{code}</code>
            </pre>
          }
        >
          <CodeEditorPane
            value={code}
            language={isPlain ? undefined : language}
            onValueChange={onCodeChange}
            className="border-0 bg-transparent"
          />
        </Suspense>
      ) : (
        // A long line (an id, a URL, a base64 blob) overflows sideways. A native
        // `overflow-x-auto` pre leaves that to the OS scrollbar, which on macOS is
        // an overlay that only flashes mid-scroll — the row reads as un-scrollable.
        // Scroll through a Base UI ScrollArea instead, so the horizontal rail is
        // the same styled thin scrollbar the rest of the system uses.
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
      )}
    </div>
  );
}
