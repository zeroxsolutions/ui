import { cva, type VariantProps } from 'class-variance-authority';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform, ScrollView, View, type TextStyle } from 'react-native';
import { useFocusVisible } from '../lib/focus-visible';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes in the registry's style, `cn-<slot>/text` for its
// text classes and `cn-<slot>/icon` for its icon size, `@size=sm` for the classes behind the small size,
// `@variant=destructive` for those behind the destructive block, `@focused` for those while the content holds
// keyboard focus, `@slot=code-block-header` for those of content below a header, `@parent=code-block` for
// actions straight inside the block, `@numbered` for a numbered line, and `@part=before` and `@part=after` for a
// line's number and diff marker; the registry build replaces each with the classes translated for the target
// engine.

/** The face code is drawn in: the platform's own monospace, since the theme ships none. */
const MONOSPACE: TextStyle = {
  fontFamily: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  }),
};

type CodeBlockSize = 'default' | 'sm';

/** A row a CodeBlock may hold around its content. */
type CodeBlockRow = 'header' | 'footer';

/** What a CodeBlock tells the parts inside it: its tone and size, and which rows it holds around the content. */
interface CodeBlockState {
  destructive: boolean;
  size: CodeBlockSize;
  hasHeader: boolean;
  hasFooter: boolean;
  /** The text classes of the code, in the block's tone and size. */
  codeText: string;
  /** Tells the block a row is drawn inside it, however deep; returns the call that says it has gone. */
  holdRow: (row: CodeBlockRow) => () => void;
  /** Tells the block whether its content holds keyboard focus, which rings the block. */
  reportFocus: (focusVisible: boolean) => void;
}

const CodeBlockContext = createContext<CodeBlockState>({
  destructive: false,
  size: 'default',
  hasHeader: false,
  hasFooter: false,
  codeText: '',
  holdRow: () => () => {},
  reportFocus: () => undefined,
});

/** Tells the CodeBlock around it that `row` is drawn, for as long as the calling part is. */
function useHeldRow(row: CodeBlockRow): void {
  const { holdRow } = useContext(CodeBlockContext);
  useEffect(() => holdRow(row), [holdRow, row]);
}

/** Whether a CodeBlockActions sits in a CodeBlockHeader, rather than floating over the content. */
const CodeBlockHeaderContext = createContext(false);

/** What CodeBlockContent tells each line: how it lays lines out, and the number of the line, when it numbers them. */
interface CodeBlockLineState {
  wrap: boolean;
  number?: number;
  /** The digits of the widest number, which every number is padded to. */
  digits: number;
  /** The text classes of the code, with the content's line height. */
  codeText: string;
}

const CodeBlockLineContext = createContext<CodeBlockLineState>({ wrap: false, digits: 0, codeText: '' });

const codeBlockVariants = cva('relative w-full min-w-0 flex-col overflow-hidden cn-code-block', {
  variants: {
    variant: {
      default: 'cn-code-block-variant-default',
      destructive: 'cn-code-block-variant-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type CodeBlockProps = ComponentProps<typeof View> &
  VariantProps<typeof codeBlockVariants> & {
    size?: CodeBlockSize;
  };

/**
 * A surface for code, terminal output, logs or a diff: a CodeBlockHeader, a CodeBlockContent and a
 * CodeBlockFooter, each optional. `size="sm"` has tighter padding and smaller code, for tool output.
 */
function CodeBlock({ className, variant, size = 'default', children, ...props }: CodeBlockProps): ReactNode {
  const parts = Children.toArray(children);
  const destructive = variant === 'destructive';
  // A row straight inside is known on the first draw; one inside an app's own component tells the block
  // once it is drawn.
  const [held, setHeld] = useState<Readonly<Record<CodeBlockRow, number>>>({ header: 0, footer: 0 });
  const holdRow = useCallback((row: CodeBlockRow) => {
    setHeld((current) => ({ ...current, [row]: current[row] + 1 }));
    return () => setHeld((current) => ({ ...current, [row]: current[row] - 1 }));
  }, []);
  const [focused, setFocused] = useState(false);
  const state: CodeBlockState = {
    destructive,
    size,
    holdRow,
    reportFocus: setFocused,
    hasHeader: held.header > 0 || parts.some((part) => isValidElement(part) && part.type === CodeBlockHeader),
    hasFooter: held.footer > 0 || parts.some((part) => isValidElement(part) && part.type === CodeBlockFooter),
    codeText: cn(
      'cn-code-block/text',
      size === 'sm' && 'cn-code-block/text@size=sm',
      destructive ? 'cn-code-block-variant-destructive/text' : 'cn-code-block-variant-default/text',
    ),
  };

  return (
    <CodeBlockContext.Provider value={state}>
      <View
        className={cn(
          codeBlockVariants({ variant }),
          focused && 'cn-code-block@focused',
          focused && !destructive && 'cn-code-block-variant-default@focused',
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </CodeBlockContext.Provider>
  );
}

/** A row above the content for a CodeBlockTitle and CodeBlockActions, in the block's muted text. */
function CodeBlockHeader({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { destructive, size } = useContext(CodeBlockContext);
  useHeldRow('header');

  return (
    <CodeBlockHeaderContext.Provider value>
      <TextClassContext.Provider
        value={cn('cn-code-block-header/text', destructive && 'cn-code-block-header/text@variant=destructive')}
      >
        <View
          className={cn(
            'min-w-0 shrink-0 flex-row items-center cn-code-block-header',
            size === 'sm' && 'cn-code-block-header@size=sm',
            className,
          )}
          {...props}
        />
      </TextClassContext.Provider>
    </CodeBlockHeaderContext.Provider>
  );
}

/**
 * A filename or a label, with an optional Icon before it. Text children are drawn on one line, cut short
 * where the row runs out.
 */
function CodeBlockTitle({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const { destructive, size } = useContext(CodeBlockContext);
  const sm = size === 'sm';

  return (
    <IconClassContext.Provider value={cn('cn-code-block-title/icon', sm && 'cn-code-block-title/icon@size=sm')}>
      <TextClassContext.Provider
        value={cn(
          'cn-code-block-title/text',
          sm && 'cn-code-block-title/text@size=sm',
          destructive && 'cn-code-block-title/text@variant=destructive',
        )}
      >
        <View className={cn('min-w-0 shrink flex-row items-center gap-1.5 cn-code-block-title', className)} {...props}>
          {Children.map(children, (child) =>
            typeof child === 'string' || typeof child === 'number' ? (
              <Text numberOfLines={1} className="shrink">
                {child}
              </Text>
            ) : (
              child
            ),
          )}
        </View>
      </TextClassContext.Provider>
    </IconClassContext.Provider>
  );
}

/**
 * Buttons at the end of a CodeBlockHeader. Put straight inside a CodeBlock, they float over the top end
 * of the content, each on the page's background.
 */
function CodeBlockActions({ className, style, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const inHeader = useContext(CodeBlockHeaderContext);
  const { size } = useContext(CodeBlockContext);

  if (inHeader) {
    return (
      <View
        className={cn('shrink-0 flex-row items-center cn-code-block-actions', className)}
        // The margin that pushes the actions to the end of the row the page's direction runs.
        style={[{ marginStart: 'auto' }, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      className={cn(
        'absolute z-10 shrink-0 flex-row items-center cn-code-block-actions cn-code-block-actions@parent=code-block',
        size === 'sm' && 'cn-code-block-actions@parent=code-block+size=sm',
        className,
      )}
      style={style}
      {...props}
    >
      {Children.map(children, (child) =>
        isValidElement<{ className?: string }>(child)
          ? cloneElement(child, {
              className: cn('cn-code-block-actions@parent=code-block+part=button', child.props.className),
            })
          : child,
      )}
    </View>
  );
}

type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  /** The text to copy. */
  value: string;
};

/** How long the button says Copied after a copy, in ms. */
const COPIED_MS = 2000;

/**
 * A ghost icon button that copies `value` to the clipboard, then says Copied for two seconds. Screen readers
 * hear Copied once the copy has succeeded. It takes Button's props.
 */
function CodeBlockCopyButton({
  value,
  variant = 'ghost',
  size = 'icon-xs',
  className,
  onPress,
  ...props
}: CodeBlockCopyButtonProps): ReactNode {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        aria-label={copied ? 'Copied' : 'Copy'}
        className={className}
        onPress={(event) => {
          onPress?.(event);
          Clipboard.setStringAsync(value)
            .then(() => {
              setCopied(true);
              // A live region is Android's and the web's alone; iOS announces only what it is told to.
              if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility('Copied');
            })
            .catch(() => {});
        }}
        {...props}
      >
        <Icon as={copied ? Check : Copy} />
      </Button>
      <View aria-live="polite" pointerEvents="none" className="absolute h-px w-px overflow-hidden opacity-0">
        <Text>{copied ? 'Copied' : ''}</Text>
      </View>
    </>
  );
}

type CodeBlockContentProps = ComponentProps<typeof ScrollView> & {
  /** A string, or a list of CodeBlockLine. */
  children?: ReactNode;
  /** Wraps long lines instead of scrolling them sideways. */
  wrap?: boolean;
  /** Numbers each line. A string child is split into lines. */
  lineNumbers?: boolean;
  /** The number of the first line, when `lineNumbers` is set. */
  startLine?: number;
  /** On the web, makes the content focusable so the keyboard scrolls it; -1 removes the tab stop. */
  tabIndex?: 0 | -1;
};

/**
 * The code, always read left to right. Long lines scroll sideways unless `wrap` is set, and a height capped
 * with a class such as `max-h-72` scrolls the content inside the block.
 */
function CodeBlockContent({
  className,
  children,
  style,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  tabIndex = 0,
  scrollEnabled,
  onLayout,
  onContentSizeChange,
  ...props
}: CodeBlockContentProps): ReactNode {
  const { size, hasHeader, hasFooter, codeText, reportFocus } = useContext(CodeBlockContext);
  const { focusVisible, onFocus: focusChanged, onBlur: blurred } = useFocusVisible();
  useEffect(() => {
    if (!focusVisible) return undefined;
    reportFocus(true);
    return () => reportFocus(false);
  }, [focusVisible, reportFocus]);
  const tall = useOverflow();
  const wide = useOverflow();
  const sm = size === 'sm';
  let lines = children;
  if (typeof children === 'string') {
    lines = lineNumbers ? (
      children
        .replace(/\n$/, '')
        .split('\n')
        .map((line, index) => <CodeBlockLine key={index}>{line}</CodeBlockLine>)
    ) : (
      <CodeBlockLine>{children}</CodeBlockLine>
    );
  }
  const body = (
    <View
      className={cn(
        'min-w-full flex-col cn-code-block-content',
        sm && 'cn-code-block-content@size=sm',
        hasHeader && 'cn-code-block-content@slot=code-block-header',
        sm && hasHeader && 'cn-code-block-content@size=sm+slot=code-block-header',
        hasFooter && 'cn-code-block-content@slot=code-block-footer',
      )}
    >
      <NumberedLines
        wrap={wrap}
        lineNumbers={lineNumbers}
        startLine={startLine}
        codeText={cn(codeText, 'cn-code-block-content/text')}
      >
        {lines}
      </NumberedLines>
    </View>
  );
  const web = Platform.OS === 'web';
  const focusProps = { onFocus: focusChanged, onBlur: blurred };

  // Each scroller takes a drag only while its content overflows it, and does not bounce, so a drag on a
  // block whose code fits moves the page around it.
  return (
    <ScrollView
      nestedScrollEnabled
      alwaysBounceVertical={false}
      bounces={false}
      scrollEnabled={scrollEnabled ?? tall.overflows}
      className={cn('min-h-0 min-w-0', className)}
      style={[{ direction: 'ltr' }, style]}
      tabIndex={web && wrap ? tabIndex : undefined}
      {...(wrap ? focusProps : {})}
      onLayout={(event) => {
        tall.setViewport(event.nativeEvent.layout.height);
        onLayout?.(event);
      }}
      onContentSizeChange={(width, height) => {
        tall.setContent(height);
        onContentSizeChange?.(width, height);
      }}
      {...props}
    >
      {wrap ? (
        body
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          alwaysBounceHorizontal={false}
          bounces={false}
          scrollEnabled={wide.overflows}
          contentContainerStyle={{ flexGrow: 1 }}
          tabIndex={web ? tabIndex : undefined}
          {...focusProps}
          onLayout={(event) => wide.setViewport(event.nativeEvent.layout.width)}
          onContentSizeChange={(width) => wide.setContent(width)}
        >
          {body}
        </ScrollView>
      )}
    </ScrollView>
  );
}

/** Whether a scroller's content runs past it along one axis, from the two lengths its layout reports. */
function useOverflow(): {
  overflows: boolean;
  setViewport: (length: number) => void;
  setContent: (length: number) => void;
} {
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  // Below a pixel is rounding between the two measures, not code out of sight.
  return { overflows: content - viewport >= 1, setViewport, setContent };
}

/** Hands each line whether it wraps, its text classes, and its number from `startLine` when `lineNumbers` is set. */
function NumberedLines({
  wrap,
  lineNumbers,
  startLine,
  codeText,
  children,
}: {
  wrap: boolean;
  lineNumbers: boolean;
  startLine: number;
  codeText: string;
  children: ReactNode;
}): ReactNode {
  const lines = Children.toArray(children);
  const digits = lineNumbers ? String(startLine + lines.length - 1).length : 0;

  return lines.map((line, index) => (
    <CodeBlockLineContext.Provider
      key={isValidElement(line) && line.key !== null ? line.key : index}
      value={{ wrap, digits, codeText, number: lineNumbers ? startLine + index : undefined }}
    >
      {line}
    </CodeBlockLineContext.Provider>
  ));
}

const codeBlockLineVariants = cva('relative flex-row cn-code-block-line', {
  variants: {
    variant: {
      default: '',
      added: 'cn-code-block-line-variant-added',
      removed: 'cn-code-block-line-variant-removed',
      highlighted: 'cn-code-block-line-variant-highlighted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/** The sign drawn at the start of a line each diff variant marks. */
const LINE_MARKERS: Partial<Record<NonNullable<VariantProps<typeof codeBlockLineVariants>['variant']>, string>> = {
  added: '+',
  removed: '\u2212',
};

type CodeBlockLineProps = ComponentProps<typeof View> &
  VariantProps<typeof codeBlockLineVariants> & {
    children?: ReactNode;
  };

/**
 * One line of code: text, or the highlighted tokens of a line from `useHighlightedCode`. `added` and
 * `removed` tint it and mark it with a plus or a minus, and `highlighted` tints it.
 */
function CodeBlockLine({ className, variant = 'default', children, ...props }: CodeBlockLineProps): ReactNode {
  const { size } = useContext(CodeBlockContext);
  const { wrap, number, digits, codeText } = useContext(CodeBlockLineContext);
  const marker = variant ? LINE_MARKERS[variant] : undefined;
  const empty =
    children === undefined ||
    children === null ||
    children === '' ||
    (Array.isArray(children) && children.length === 0);

  return (
    <View
      className={cn(
        codeBlockLineVariants({ variant }),
        size === 'sm' && 'cn-code-block-line@size=sm',
        number !== undefined && 'cn-code-block-line@numbered',
        className,
      )}
      {...props}
    >
      {marker ? (
        <Text
          style={MONOSPACE}
          className={cn(
            'absolute top-0',
            codeText,
            'cn-code-block-line@part=after cn-code-block-line/text@part=after',
            variant === 'removed' && 'cn-code-block-line-variant-removed/text@part=after',
          )}
        >
          {marker}
        </Text>
      ) : null}
      {number !== undefined ? (
        <Text
          aria-hidden
          style={MONOSPACE}
          // The code reads left to right, so the end its number aligns to is the right, which React Native names.
          className={cn(codeText, 'cn-code-block-line@part=before cn-code-block-line/text@part=before', 'text-right')}
        >
          {String(number).padStart(digits, ' ')}
        </Text>
      ) : null}
      {/* An empty line holds a space, so it keeps the height of a line. */}
      <Text selectable style={MONOSPACE} className={cn(wrap ? 'min-w-0 flex-1' : 'shrink-0', codeText)}>
        {empty ? ' ' : children}
      </Text>
    </View>
  );
}

/** A row below the content, such as for a Show more Button. */
function CodeBlockFooter({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { size } = useContext(CodeBlockContext);
  useHeldRow('footer');

  return (
    <TextClassContext.Provider value="cn-code-block-footer/text">
      <View
        className={cn(
          'min-w-0 shrink-0 flex-row items-center cn-code-block-footer',
          size === 'sm' && 'cn-code-block-footer@size=sm',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
};
