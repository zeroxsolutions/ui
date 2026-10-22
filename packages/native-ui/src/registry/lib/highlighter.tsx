import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { createHighlighterCore, type GrammarState, type HighlighterCore, type ThemedToken } from 'shiki/core';
import { createJavaScriptRegexEngine, defaultJavaScriptRegexConstructor } from 'shiki/engine/javascript';
import { useColorScheme } from './color-scheme';

// Add the languages you need and remove the rest: a device's bundle carries every one listed, and each is
// parsed the first time it is used.
const languages = {
  bash: () => import('shiki/langs/shellscript.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
};

const aliases: Record<string, keyof typeof languages> = {
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  shellscript: 'bash',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
};

let matchAllKeepsGroups: boolean | undefined;

/** The engine's own matchAll, while {@link matchAllByExec} stands in for it. */
let ownMatchAll = String.prototype.matchAll;

/** Each match of `regexp` in `text` from its `lastIndex`, as `exec` finds them. */
function* execMatches(regexp: RegExp, text: string): Generator<RegExpExecArray, undefined> {
  const unicode = regexp.flags.includes('u') || regexp.flags.includes('v');
  let match: RegExpExecArray | null;
  while ((match = regexp.exec(text)) !== null) {
    yield match;
    if (match[0] === '') regexp.lastIndex += unicode && (text.codePointAt(regexp.lastIndex) ?? 0) > 0xffff ? 2 : 1;
  }
  return undefined;
}

/**
 * `String.prototype.matchAll` as the language defines it, by `exec`. Hermes's own yields each match
 * without its named `groups`, which the regex engine's conversion of a recursive pattern reads.
 */
function matchAllByExec(this: string, regexp: RegExp): RegExpStringIterator<RegExpExecArray> {
  // The engine's own takes a string as a pattern, and throws for a regexp without the global flag, where `exec`
  // would never move on from the first match.
  if (!(regexp instanceof RegExp) || !regexp.global) return ownMatchAll.call(this, regexp);
  const copy = new RegExp(regexp.source, regexp.flags);
  copy.lastIndex = regexp.lastIndex;
  // A generator is the iterator matchAll returns, short of the toStringTag its type names.
  return execMatches(copy, this) as unknown as RegExpStringIterator<RegExpExecArray>;
}

/**
 * Converts a grammar's pattern as the engine's default does. Where matchAll drops named groups, the
 * conversion runs with {@link matchAllByExec} in its place, put back before it returns; without it a
 * recursive pattern fails to convert and is skipped, and bash, HTML and Markdown lose most of their colours.
 */
function toRegExp(pattern: string): RegExp {
  matchAllKeepsGroups ??= 'a'.matchAll(/(?<a>a)/g).next().value?.groups !== undefined;
  if (matchAllKeepsGroups) return defaultJavaScriptRegexConstructor(pattern);
  ownMatchAll = String.prototype.matchAll;
  String.prototype.matchAll = matchAllByExec;
  try {
    return defaultJavaScriptRegexConstructor(pattern);
  } finally {
    String.prototype.matchAll = ownMatchAll;
  }
}

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true, regexConstructor: toRegExp }),
  });

  return highlighter;
}

function getLanguage(language: string): keyof typeof languages | 'ansi' | null {
  const name = language.toLowerCase();

  if (name === 'ansi') {
    return name;
  }

  if (name in languages) {
    return name as keyof typeof languages;
  }

  return aliases[name] ?? null;
}

/** One line's tokens, each a Text in its colour for the scheme the app draws, inside the line's Text. */
function HighlightedTokens({ tokens }: { tokens: readonly ThemedToken[] }): ReactNode {
  const colorScheme = useColorScheme();

  return tokens.map((token, index) => (
    <Text key={index} style={{ color: token.htmlStyle?.[colorScheme === 'dark' ? '--shiki-dark' : '--shiki-light'] }}>
      {token.content}
    </Text>
  ));
}

/** A highlighter for one language, from {@link loadHighlighter}. */
interface Highlighter {
  /**
   * One node per line of `code`, each to go inside a Text, and the grammar state after the last line.
   * Pass that state back to continue where the code left off.
   */
  highlight: (code: string, state?: GrammarState) => { lines: ReactNode[]; state: GrammarState | undefined };
}

/**
 * Loads `language`, a name or an alias such as `ts`, or `ansi` for terminal output, and returns a
 * highlighter for it, or null for a language that is not listed.
 */
async function loadHighlighter(language: string): Promise<Highlighter | null> {
  const lang = getLanguage(language);

  if (!lang) {
    return null;
  }

  const shiki = await getHighlighter();

  if (lang !== 'ansi' && !shiki.getLoadedLanguages().includes(lang)) {
    await shiki.loadLanguage(languages[lang]);
  }

  return {
    highlight(code, state) {
      const tokenize = (text: string): ThemedToken[][] =>
        shiki.codeToTokens(text, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
          grammarState: state,
        }).tokens;

      // ANSI has no grammar state, so each line is tokenized on its own and
      // gets the same colors whether it arrives in one piece or streams.
      const tokens = lang === 'ansi' ? code.split('\n').flatMap((line) => tokenize(line)) : tokenize(code);

      return {
        lines: tokens.map((line, index) => <HighlightedTokens key={index} tokens={line} />),
        state: shiki.getLastGrammarState(tokens),
      };
    },
  };
}

/** One node per line of `code`, each to go inside a Text, or null for a language that is not listed. */
async function highlightCode(code: string, language: string): Promise<ReactNode[] | null> {
  const loaded = await loadHighlighter(language);

  return loaded ? loaded.highlight(code).lines : null;
}

export { highlightCode, loadHighlighter };
export type { Highlighter };
