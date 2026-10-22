import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { GrammarState } from 'shiki/core';
import { loadHighlighter, type Highlighter } from '../lib/highlighter';

/** The complete lines highlighted so far, with the text they cover and the grammar state after them. */
interface HighlightedLines {
  highlighter: Highlighter | null;
  text: string;
  lines: ReactNode[];
  state?: GrammarState;
}

/**
 * One node per line of `value`, each to go inside a Text, highlighted as `language`: a name or an alias
 * such as `ts`, or `ansi` for terminal output. A trailing newline is ignored. The lines are plain text
 * until the highlighter has loaded, and for a language it does not list.
 */
function useHighlightedCode(value: string, language: string): ReactNode[] {
  // A trailing newline would render as an extra empty line.
  const code = value.endsWith('\n') ? value.slice(0, -1) : value;
  const [loaded, setLoaded] = useState<{ language: string; highlighter: Highlighter | null } | null>(null);
  const highlighter = loaded?.language === language ? loaded.highlighter : null;

  useEffect(() => {
    let cancelled = false;

    loadHighlighter(language)
      .then((next) => {
        if (!cancelled) {
          setLoaded({ language, highlighter: next });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [language]);

  // The complete lines, highlighted. While the code streams, only the new
  // lines are tokenized, starting from the grammar state of the last one.
  const [done, setDone] = useState<HighlightedLines>({ highlighter: null, text: '', lines: [] });

  let next = done;

  if (next.highlighter !== highlighter || !code.startsWith(next.text)) {
    next = { highlighter, text: '', lines: [] };
  }

  const end = code.lastIndexOf('\n') + 1;

  if (highlighter && end > next.text.length) {
    const result = highlighter.highlight(code.slice(next.text.length, end - 1), next.state);

    next = {
      highlighter,
      text: code.slice(0, end),
      lines: [...next.lines, ...result.lines],
      state: result.state,
    };
  }

  if (next !== done) {
    setDone(next);
  }

  // The last line is still being written, so it is tokenized on every render.
  const tail = code.slice(end);

  return useMemo(() => {
    if (!highlighter) {
      return code.split('\n');
    }

    return [...next.lines, highlighter.highlight(tail, next.state).lines[0]];
  }, [code, highlighter, next, tail]);
}

export { useHighlightedCode };
