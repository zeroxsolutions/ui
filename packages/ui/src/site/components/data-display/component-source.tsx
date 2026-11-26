import type { ComponentProps, ReactNode } from 'react';

import { SourceCodeCard } from './source-code-card';
import { packHighlightLines, unpackHighlightLines } from '../../lib/packed-lines';

import { StyledSource, type StyleSources } from './styled-source';

interface ComponentSourceProps extends Omit<ComponentProps<typeof SourceCodeCard>, 'code' | 'language' | 'lines'> {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first; `rehypeDocsCode` reads it, not this component. */
  file?: string;
  /**
   * The file's source, its language and its lines, packed by `packHighlightLines`, which `rehypeDocsCode`
   * sets as the page compiles.
   */
  code?: string;
  language?: string;
  lines?: string;
  /**
   * The file as each web style other than the default writes it, where that differs, as JSON with its
   * lines packed the same, which `rehypeDocsCode` sets for a file that writes slots; `code` and `lines`
   * are then the default style's.
   */
  styleSources?: string;
  /** Shows only the first this many lines. */
  maxLines?: number;
}

/**
 * A source file of a demo or registry item, as a `SourceCodeCard` its children compose: its first
 * file, or the one `file` names. Its source and highlighting are read as the docs page compiles, so it
 * works only inside a docs page; anywhere else it throws.
 */
function ComponentSource({
  name,
  file: _file,
  code,
  language,
  lines,
  styleSources,
  maxLines,
  ...props
}: ComponentSourceProps): ReactNode {
  if (code === undefined) throw new Error(`ComponentSource: "${name}" has no source; only a docs page reads it`);
  const card = (source: string, sourceLines: string | undefined): ReactNode => {
    if (!maxLines) return <SourceCodeCard code={source} language={language} lines={sourceLines ?? 'null'} {...props} />;
    const excerpt = source.split('\n').slice(0, maxLines).join('\n');
    const excerptLines = unpackHighlightLines(sourceLines, source)?.slice(0, maxLines) ?? null;
    return (
      <SourceCodeCard code={excerpt} language={language} lines={packHighlightLines(excerptLines, excerpt)} {...props} />
    );
  };
  if (!styleSources) return card(code, lines);
  const others = JSON.parse(styleSources) as StyleSources;
  return (
    <StyledSource
      fallback={card(code, lines)}
      byStyle={Object.fromEntries(
        Object.entries(others).map(([style, other]) => [style, card(other.code, other.lines)]),
      )}
    />
  );
}

export { ComponentSource };
