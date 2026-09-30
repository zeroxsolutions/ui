import { useEffect, useState } from 'react';

import { isPlainLanguage } from '@/registry/bases/base-ui/lib/code-language';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

/**
 * Tokenize `code` as `language` via the shared Shiki highlighter. Returns `null`
 * until the (async, lazily loaded) grammar resolves, and for plain or unknown
 * languages; the caller renders the raw string meanwhile. Unmount-safe; re-runs
 * on a code or language change. Shiki itself is imported on the first call
 * with a language, so a page that never highlights in the browser never loads it.
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
    import('@/registry/bases/base-ui/lib/shiki')
      .then(({ highlightToLines }) => highlightToLines(code, language as string))
      .then((result) => {
        if (active) setLines(result);
      });
    return () => {
      active = false;
    };
  }, [code, language]);

  return lines;
}

export { useHighlightedLines };
