import { createContext, Fragment, useContext, type ComponentProps, type ReactNode } from 'react';
import { Text as NativeText, Platform, View, type TextStyle } from 'react-native';
import { useHighlightedCode } from '../../hooks/use-highlighted-code';
import { isPlainLanguage, languageLabel } from '../../lib/code-language';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { CodeBlockContent, CodeBlockLine } from '../../ui/code-block';
import { Text, TextClassContext } from '../../ui/text';
import { CopyButton, type CopyButtonProps } from '../feedback/copy-button';
import { CollapsibleCard, CollapsibleCardContent } from '../layout/collapsible-card';

/** One run of a line in one colour; `style` is drawn on the run's Text, and a run without one takes the line's. */
interface HighlightToken {
  content: string;
  style?: TextStyle;
}

/** The runs of one line of code, in order, with no newline. */
type HighlightLine = HighlightToken[];

interface CodeCardContextValue {
  language: string | undefined;
  code: string;
  /** One node per line of the code, each to go inside a Text. */
  lines: ReactNode[];
}

const CodeCardContext = createContext<CodeCardContextValue | null>(null);

function useCodeCard(): CodeCardContextValue {
  const context = useContext(CodeCardContext);
  if (!context) throw new Error('CodeCard parts must be placed inside a CodeCard.');
  return context;
}

/** The face CodeBlockLine draws code in, so the gutter's numbers sit on the code's lines. */
const MONOSPACE: TextStyle = {
  fontFamily: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  }),
};

/** `code` without the one trailing newline the highlighter leaves out, so a gutter numbers the lines drawn. */
function withoutTrailingNewline(code: string): string {
  return code.endsWith('\n') ? code.slice(0, -1) : code;
}

/** Each given line as one node, a run with a style in a Text of its own. */
function tokenNodes(lines: HighlightLine[]): ReactNode[] {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {line.map((token, at) =>
        token.style ? (
          <NativeText key={at} style={token.style}>
            {token.content}
          </NativeText>
        ) : (
          <Fragment key={at}>{token.content}</Fragment>
        ),
      )}
    </Fragment>
  ));
}

type CodeCardProps = ComponentProps<typeof CollapsibleCard> & {
  /** The source shown, and what a copy writes to the clipboard. */
  code: string;
  /**
   * A language id or alias, such as `ts`, `json` or `bash`. Absent or plain text draws the code plain, and so
   * does a language the highlighter does not list.
   */
  language?: string;
  /**
   * `code` already tokenized, one run list per line, for a block highlighted ahead of render; given, the block
   * highlights nothing itself, and `null` draws `code` plain.
   */
  lines?: HighlightLine[] | null;
};

/**
 * Read-only source over a collapsible card, highlighted through the registry's highlighter and plain until
 * the grammar loads. The root holds the code; its parts show it. Compose a header from `CollapsibleCard`
 * parts, then the body:
 *
 * ```tsx
 * <CodeCard code={source} language="ts">
 *   <CollapsibleCardHeader>
 *     <CollapsibleCardTitle>
 *       <CodeCardLanguage />
 *     </CollapsibleCardTitle>
 *     <CollapsibleCardActions>
 *       <CodeCardCopy />
 *       <CollapsibleCardTrigger />
 *     </CollapsibleCardActions>
 *   </CollapsibleCardHeader>
 *   <CodeCardContent>
 *     <CodeCardLineNumbers />
 *     <CodeCardCode />
 *   </CodeCardContent>
 * </CodeCard>
 * ```
 *
 * A block with no header floats its copy over the code instead:
 * `<CodeCardActions><CodeCardCopy variant="secondary" /></CodeCardActions>` before the content.
 */
function CodeCard({
  code,
  language,
  lines: givenLines,
  variant = 'muted',
  className,
  ...props
}: CodeCardProps): ReactNode {
  // Given lines, the hook is handed no language, so it neither loads a grammar nor highlights.
  const highlighted = useHighlightedCode(code, givenLines === undefined ? (language ?? '') : '');
  let lines = highlighted;
  if (givenLines === null) lines = withoutTrailingNewline(code).split('\n');
  else if (givenLines !== undefined) lines = tokenNodes(givenLines);

  return (
    <CodeCardContext.Provider value={{ code, language, lines }}>
      <CollapsibleCard variant={variant} className={cn('relative', className)} {...props} />
    </CodeCardContext.Provider>
  );
}

/**
 * The actions of a block with no header, floated over the code's top-right corner. They always show, since a
 * touchscreen has no hover to reveal them.
 */
function CodeCardActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('absolute top-1 right-1 z-10 flex-row items-center gap-0.5', className)} {...props} />;
}

/**
 * The body the card's trigger folds: a CodeBlockContent that scrolls the code sideways, and down once a height
 * class caps it, holding its children in a row, usually `CodeCardLineNumbers` and `CodeCardCode`.
 */
function CodeCardContent({ children, ...props }: ComponentProps<typeof CollapsibleCardContent>): ReactNode {
  const textClass = useContext(TextClassContext);
  return (
    <CollapsibleCardContent {...props}>
      <TextClassContext.Provider value={cn(textClass, 'text-xs')}>
        <CodeBlockContent>
          <View className="flex-row gap-4">{children}</View>
        </CodeBlockContent>
      </TextClassContext.Provider>
    </CollapsibleCardContent>
  );
}

/**
 * A gutter numbering each line of the block's code, hidden from assistive technology. It is at least `min-w-6`
 * wide, so the code starts at the same place in a 9-line block and a 99-line one.
 */
function CodeCardLineNumbers({ className, style, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { lines } = useCodeCard();
  return (
    <Text
      aria-hidden
      className={cn('text-muted-foreground min-w-6 shrink-0 text-right leading-relaxed', className)}
      style={[MONOSPACE, style]}
      {...props}
    >
      {lines.map((_, index) => index + 1).join('\n')}
    </Text>
  );
}

/** The block's code, a CodeBlockLine per line, painted once its highlighted lines arrive and plain until then. */
function CodeCardCode({ className, ...props }: Omit<ComponentProps<typeof View>, 'children'>): ReactNode {
  const { lines } = useCodeCard();
  return (
    <View className={cn('min-w-0 flex-col', className)} {...props}>
      {lines.map((line, index) => (
        <CodeBlockLine key={index}>{line}</CodeBlockLine>
      ))}
    </View>
  );
}

/** The block's language as its display name, `Plain text` when it has none; `children` replace the name. */
function CodeCardLanguage({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const { language } = useCodeCard();
  const textClass = useContext(TextClassContext);
  const plain = isPlainLanguage(language);

  return (
    <TextClassContext.Provider value={cn(textClass, 'text-xs')}>
      <View className={cn('min-w-0 flex-row items-center gap-1.5', className)} {...props}>
        {asText(children ?? (plain ? 'Plain text' : languageLabel(language as string)), { numberOfLines: 1 })}
      </View>
    </TextClassContext.Provider>
  );
}

type CodeCardCopyProps = Omit<CopyButtonProps, 'value'>;

/** Copies the block's code; takes every `CopyButton` prop but `value`. */
function CodeCardCopy({ label = 'Copy code', size = 'icon', ...props }: CodeCardCopyProps): ReactNode {
  const { code } = useCodeCard();
  return <CopyButton value={code} label={label} size={size} {...props} />;
}

export {
  CodeCard,
  CodeCardActions,
  CodeCardContent,
  CodeCardLineNumbers,
  CodeCardCode,
  CodeCardLanguage,
  CodeCardCopy,
};
export type { CodeCardProps, CodeCardCopyProps, HighlightLine, HighlightToken };
