import { Image } from 'expo-image';
import { createContext, Fragment, memo, useContext, useState, type ComponentProps, type ReactNode } from 'react';
import { Linking, Platform, View, type TextStyle } from 'react-native';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { isPlainLanguage } from '../../lib/code-language';
import { defaultUrlTransform } from '../../lib/url-transform';
import { cn } from '../../lib/utils';
import { Checkbox } from '../../ui/checkbox';
import { Separator } from '../../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Text, TextClassContext } from '../../ui/text';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '../layout/collapsible-card';
import { CodeCard, CodeCardActions, CodeCardCode, CodeCardContent, CodeCardCopy, CodeCardLanguage } from './code-card';

/** GitHub-Flavored Markdown to an mdast tree; it holds no state between documents, so one serves every view. */
const parser = unified().use(remarkParse).use(remarkGfm);

type Root = ReturnType<typeof parser.parse>;
type Node = Root['children'][number];
type NodeOf<Type extends Node['type']> = Extract<Node, { type: Type }>;
type Phrasing = NodeOf<'paragraph'>['children'][number];
type Alignment = NodeOf<'table'>['align'];

/** The face inline code is drawn in, as CodeBlockLine draws code, since a phone has no CSS font stack. */
const MONOSPACE: TextStyle = {
  fontFamily: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  }),
};

/** The text classes of the view itself, which every Text inside it takes. */
const ROOT_TEXT = 'text-foreground text-sm leading-relaxed';

/**
 * Each heading's text classes and its margins, the second margin taken only when the heading is not the first
 * block of its parent. The web styles h1 to h4; h5 and h6 take the view's own text.
 */
const HEADINGS: Readonly<Record<number, { text: string; margin: string; notFirst: string }>> = {
  1: { text: 'text-2xl font-sans-semibold', margin: 'mb-3', notFirst: 'mt-6' },
  2: { text: 'text-xl font-sans-semibold', margin: 'mb-2', notFirst: 'mt-6' },
  3: { text: 'text-lg font-sans-semibold', margin: 'mb-2', notFirst: 'mt-5' },
  4: { text: 'font-sans-semibold', margin: 'mb-1', notFirst: 'mt-4' },
};

/** Each column alignment GFM records as its Text's alignment class; an unaligned column starts at the start. */
const ALIGNMENT_CLASSES: Readonly<Record<NonNullable<NonNullable<Alignment>[number]>, string>> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/** The URL of each link and image definition, by its normalized identifier, for reference links and images. */
type Definitions = ReadonlyMap<string, { url: string }>;

const DefinitionsContext = createContext<Definitions>(new Map());

/** Every definition in `nodes` and below them; micromark makes a reference only where a definition exists. */
function collectDefinitions(nodes: readonly Node[], into = new Map<string, { url: string }>()): Definitions {
  for (const node of nodes) {
    if (node.type === 'definition') {
      // The first definition of an identifier wins, as CommonMark has it.
      if (!into.has(node.identifier)) into.set(node.identifier, { url: node.url });
    } else if ('children' in node) {
      collectDefinitions(node.children as Node[], into);
    }
  }
  return into;
}

/** The text a reader would read in `node`, as a task checkbox's name; an image reads as its alt text. */
function plainText(node: Node): string {
  if ('value' in node && node.type !== 'html') return node.value;
  if (node.type === 'image' || node.type === 'imageReference') return node.alt ?? '';
  if ('children' in node) return (node.children as Node[]).map(plainText).join('');
  return '';
}

/**
 * Whether a list's items render their paragraphs as plain lines, with no paragraph margin; a list is loose,
 * and its paragraphs keep their margin, when it or any item is spread, or an item with no spread recorded
 * holds more than one block. That is how mdast-util-to-hast decides it for the web.
 */
function isTight(list: NodeOf<'list'>): boolean {
  if (list.spread) return false;
  return !list.children.some((item) => (item.spread ?? item.children.length > 1) === true);
}

type InheritedTextProps = ComponentProps<typeof Text> & {
  /** Text classes this Text takes and hands every Text nested in it, which would otherwise reset them. */
  inherit?: string;
};

/** A Text whose `inherit` classes its nested Texts take too; its `className`, such as a margin, stays its own. */
function InheritedText({ inherit, className, ...props }: InheritedTextProps): ReactNode {
  const outer = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(outer, inherit)}>
      <Text className={cn(inherit, className)} {...props} />
    </TextClassContext.Provider>
  );
}

/** A link, opened by the platform when pressed, and only when react-markdown's filter keeps its URL. */
function MarkdownViewLink({ url, children }: { url: string; children: ReactNode }): ReactNode {
  const href = defaultUrlTransform(url);
  return (
    <InheritedText
      role="link"
      inherit="text-primary underline underline-offset-4"
      // A URL no app on the device opens, such as a relative one, rejects; the press then does nothing.
      onPress={href ? () => void Linking.openURL(href).catch(() => undefined) : undefined}
    >
      {children}
    </InheritedText>
  );
}

/**
 * An image as wide as the view, scaled to its own aspect once it loads and never past its own width, announced
 * by its alt text. A URL react-markdown's filter drops loads nothing.
 */
function MarkdownViewImage({ url, alt }: { url: string; alt: string | null | undefined }): ReactNode {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const source = defaultUrlTransform(url) || undefined;
  return (
    <View
      accessible
      role="img"
      aria-label={alt ?? undefined}
      className="w-full max-w-full overflow-hidden rounded-md"
      style={size ? { aspectRatio: size.width / size.height, maxWidth: size.width } : { aspectRatio: 16 / 9 }}
    >
      <Image
        source={source}
        accessible={false}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
        onLoad={({ source: loaded }) => setSize({ width: loaded.width, height: loaded.height })}
      />
    </View>
  );
}

/** Phrasing content inside a Text: strings and nested Texts. An image in the run reads as its alt text. */
function renderInline(nodes: readonly Phrasing[], definitions: Definitions): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'emphasis':
        return (
          <InheritedText key={index} inherit="italic">
            {renderInline(node.children, definitions)}
          </InheritedText>
        );
      case 'strong':
        return (
          <InheritedText key={index} inherit="font-sans-semibold">
            {renderInline(node.children, definitions)}
          </InheritedText>
        );
      case 'delete':
        return (
          <InheritedText key={index} inherit="line-through">
            {renderInline(node.children, definitions)}
          </InheritedText>
        );
      case 'inlineCode':
        return (
          <Text key={index} className="bg-muted rounded px-1.5 py-0.5 font-mono" style={MONOSPACE}>
            {node.value}
          </Text>
        );
      case 'break':
        return '\n';
      case 'link':
        return (
          <MarkdownViewLink key={index} url={node.url}>
            {renderInline(node.children, definitions)}
          </MarkdownViewLink>
        );
      case 'linkReference': {
        const definition = definitions.get(node.identifier);
        const children = renderInline(node.children, definitions);
        return definition ? (
          <MarkdownViewLink key={index} url={definition.url}>
            {children}
          </MarkdownViewLink>
        ) : (
          <Fragment key={index}>{children}</Fragment>
        );
      }
      case 'image':
      case 'imageReference':
        return node.alt ?? '';
      case 'footnoteReference':
        return `[${node.label ?? node.identifier}]`;
      default:
        // Raw HTML is dropped, as the web drops it.
        return null;
    }
  });
}

/** Whether a phrasing node is an image a paragraph draws as a block of its own. */
function isImage(node: Phrasing): node is NodeOf<'image'> | NodeOf<'imageReference'> {
  return node.type === 'image' || node.type === 'imageReference';
}

/**
 * A paragraph: one Text, or, where it holds images, its runs of text as Texts with each image drawn between
 * them, since a Text cannot lay an image out at its own size. A paragraph of a tight list item has no margin.
 */
function MarkdownViewParagraph({ node, tight }: { node: NodeOf<'paragraph'>; tight: boolean }): ReactNode {
  const definitions = useContext(DefinitionsContext);
  const margin = tight ? undefined : 'my-3';
  if (!node.children.some(isImage)) return <Text className={margin}>{renderInline(node.children, definitions)}</Text>;

  const runs: (Phrasing[] | NodeOf<'image'> | NodeOf<'imageReference'>)[] = [];
  for (const child of node.children) {
    if (isImage(child)) runs.push(child);
    else if (Array.isArray(runs.at(-1))) (runs.at(-1) as Phrasing[]).push(child);
    else runs.push([child]);
  }
  // The line break between two images on their own lines would otherwise draw an empty line.
  const isBlank = (run: (typeof runs)[number]): boolean =>
    Array.isArray(run) && run.every((child) => child.type === 'text' && child.value.trim() === '');
  return (
    <View className={cn('gap-2', margin)}>
      {runs
        .filter((run) => !isBlank(run))
        .map((run, index) => {
          if (Array.isArray(run)) return <Text key={index}>{renderInline(run, definitions)}</Text>;
          const url = run.type === 'image' ? run.url : definitions.get(run.identifier)?.url;
          return url === undefined ? (
            <Text key={index}>{run.alt}</Text>
          ) : (
            <MarkdownViewImage key={index} url={url} alt={run.alt} />
          );
        })}
    </View>
  );
}

/** A heading announced at its level, with the web's size, weight and margins for h1 to h4. */
function MarkdownViewHeading({ node, first }: { node: NodeOf<'heading'>; first: boolean }): ReactNode {
  const definitions = useContext(DefinitionsContext);
  const style = HEADINGS[node.depth];
  return (
    <InheritedText
      role="heading"
      aria-level={node.depth}
      inherit={style?.text}
      className={cn(style?.margin, !first && style?.notFirst)}
    >
      {renderInline(node.children, definitions)}
    </InheritedText>
  );
}

/** A quotation behind a rule at its start, its text muted and leaning. */
function MarkdownViewBlockquote({ node }: { node: NodeOf<'blockquote'> }): ReactNode {
  const outer = useContext(TextClassContext);
  return (
    <View className="border-border my-3 border-l-2 pl-4">
      <TextClassContext.Provider value={cn(outer, 'text-muted-foreground italic')}>
        <MarkdownViewBlocks nodes={node.children} />
      </TextClassContext.Provider>
    </View>
  );
}

/**
 * One item of a list. A task item draws a read-only checkbox where the marker would be, named by the item's own
 * text, with its text beside it and any nested list below; any other item draws its marker, a disc or its
 * number, in the list's padding.
 */
function MarkdownViewListItem({
  item,
  number,
  tight,
}: {
  item: NodeOf<'listItem'>;
  number: number | undefined;
  tight: boolean;
}): ReactNode {
  if (typeof item.checked === 'boolean') {
    const row = item.children.filter((child) => child.type !== 'list');
    const nestedLists = item.children.filter((child) => child.type === 'list');
    return (
      <View role="listitem" className="my-1">
        <View className="-ms-6 flex-row items-start gap-2">
          <Checkbox
            checked={item.checked}
            // The reader sees the state and cannot change it, as on the web.
            onCheckedChange={() => undefined}
            aria-readonly
            aria-label={row.map(plainText).join(' ')}
            className="mt-1"
          />
          <View className="min-w-0 flex-1">
            <MarkdownViewBlocks nodes={row} tight={tight} />
          </View>
        </View>
        <MarkdownViewBlocks nodes={nestedLists} tight={tight} />
      </View>
    );
  }
  return (
    <View role="listitem" className="my-1 flex-row">
      <View className="-ms-6 w-6">
        {number === undefined ? <Text aria-hidden>{'\u2022'}</Text> : <Text>{`${number}.`}</Text>}
      </View>
      <View className="min-w-0 flex-1">
        <MarkdownViewBlocks nodes={item.children} tight={tight} />
      </View>
    </View>
  );
}

/** An ordered list numbered from its `start`, or a list of discs; React Native draws no list markers. */
function MarkdownViewList({ node }: { node: NodeOf<'list'> }): ReactNode {
  const tight = isTight(node);
  const start = node.start ?? 1;
  return (
    <View role="list" className="my-3 pl-6">
      {node.children.map((item, index) => (
        <MarkdownViewListItem key={index} item={item} number={node.ordered ? start + index : undefined} tight={tight} />
      ))}
    </View>
  );
}

/** A GFM table as the registry's Table, its first row the header, each column's cells aligned as GFM marks them. */
function MarkdownViewTable({ node }: { node: NodeOf<'table'> }): ReactNode {
  const definitions = useContext(DefinitionsContext);
  const [head, ...body] = node.children;
  // A row with fewer cells than the header takes empty ones, and one with more loses the rest, as on the web.
  const columns = node.align?.length ?? head?.children.length ?? 0;
  const cells = (row: NodeOf<'tableRow'>): ReactNode[] =>
    Array.from({ length: columns }, (_, column) => {
      const align = node.align?.[column];
      return (
        <Text key={column} className={align ? ALIGNMENT_CLASSES[align] : undefined}>
          {renderInline(row.children[column]?.children ?? [], definitions)}
        </Text>
      );
    });
  return (
    <View className="my-3">
      <Table>
        {head ? (
          <TableHeader>
            <TableRow>
              {cells(head).map((cell, column) => (
                <TableHead key={column}>{cell}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        ) : null}
        {body.length > 0 ? (
          <TableBody>
            {body.map((row, index) => (
              <TableRow key={index}>
                {cells(row).map((cell, column) => (
                  <TableCell key={column}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : null}
      </Table>
    </View>
  );
}

/**
 * Fenced code as a CodeCard, headed with its language, a copy action and the collapse trigger when the fence
 * names one; plain text has no header and floats its copy over the code. The language is the fence's first
 * word, as the web reads it off the `language-` class.
 */
function MarkdownViewCode({ node }: { node: NodeOf<'code'> }): ReactNode {
  const language = /^\w+/.exec(node.lang ?? '')?.[0];
  return (
    <CodeCard code={node.value} language={language ?? 'text'} className="my-3">
      {isPlainLanguage(language) ? (
        <CodeCardActions>
          <CodeCardCopy variant="secondary" />
        </CodeCardActions>
      ) : (
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <CodeCardLanguage />
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeCardCopy />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      )}
      <CodeCardContent>
        <CodeCardCode />
      </CodeCardContent>
    </CodeCard>
  );
}

/** A footnote's text where it is defined, after its label. */
function MarkdownViewFootnote({ node }: { node: NodeOf<'footnoteDefinition'> }): ReactNode {
  return (
    <View className="my-1 flex-row gap-2">
      <Text>{`[${node.label ?? node.identifier}]`}</Text>
      <View className="min-w-0 flex-1">
        <MarkdownViewBlocks nodes={node.children} tight />
      </View>
    </View>
  );
}

/** One block; `first` says it opens its parent, which a heading's top margin skips. */
function MarkdownViewBlock({ node, first, tight }: { node: Node; first: boolean; tight: boolean }): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <MarkdownViewParagraph node={node} tight={tight} />;
    case 'heading':
      return <MarkdownViewHeading node={node} first={first} />;
    case 'thematicBreak':
      return <Separator decorative={false} className="my-6" />;
    case 'blockquote':
      return <MarkdownViewBlockquote node={node} />;
    case 'list':
      return <MarkdownViewList node={node} />;
    case 'table':
      return <MarkdownViewTable node={node} />;
    case 'code':
      return <MarkdownViewCode node={node} />;
    case 'footnoteDefinition':
      return <MarkdownViewFootnote node={node} />;
    default:
      return null;
  }
}

/** Whether a block draws anything: raw HTML is dropped, as the web drops it, and a definition draws nothing. */
function isDrawn(node: Node): boolean {
  return node.type !== 'html' && node.type !== 'definition';
}

/** Blocks in order; `tight` draws their paragraphs as plain lines, for a tight list's items. */
function MarkdownViewBlocks({ nodes, tight = false }: { nodes: readonly Node[]; tight?: boolean }): ReactNode {
  return nodes
    .filter(isDrawn)
    .map((node, index) => <MarkdownViewBlock key={index} node={node} first={index === 0} tight={tight} />);
}

type MarkdownViewProps = Omit<ComponentProps<typeof View>, 'children'> & {
  /** Markdown source to render (GitHub-Flavored Markdown). */
  children: string;
};

/**
 * Renders a Markdown string (GFM: tables, task lists, strikethrough, autolinks) styled to the design tokens,
 * with tables as the registry's `Table` and fenced code as a `CodeCard` (highlighting, copy, collapse). Raw
 * embedded HTML is not rendered, so untrusted content is safe, and a link opens only when its URL is relative
 * or names http, https, irc, ircs, mailto or xmpp. A wide table or a long code line scrolls sideways inside
 * its own block.
 */
function MarkdownView({ children, className, ...props }: MarkdownViewProps): ReactNode {
  const outer = useContext(TextClassContext);
  const tree = parser.parse(children);
  return (
    <View className={className} {...props}>
      <TextClassContext.Provider value={cn(outer, ROOT_TEXT)}>
        <DefinitionsContext.Provider value={collectDefinitions(tree.children)}>
          <MarkdownViewBlocks nodes={tree.children} />
        </DefinitionsContext.Provider>
      </TextClassContext.Provider>
    </View>
  );
}

// A streaming chat list re-renders every message on each chunk; memo keeps a settled message from re-parsing.
// Its props are a string and plain View props, so the shallow comparison holds.
const MemoizedMarkdownView = memo(MarkdownView);

export { MemoizedMarkdownView as MarkdownView };
export type { MarkdownViewProps };
