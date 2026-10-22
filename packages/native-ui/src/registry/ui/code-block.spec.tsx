import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from './code-block';
import { emittedClasses } from '../../build/slot-tokens.testing';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const setStringAsync = jest.mocked(Clipboard.setStringAsync);

const output = 'npm install\nadded 1 package in 2s';

/** The nearest element above `element` that is a live region. */
function liveRegionAround(element: ReturnType<typeof screen.getByText>) {
  let at = element.parent;
  while (at && at.props['aria-live'] === undefined) at = at.parent;
  return at;
}

/** Whether `element` or one above it is hidden from screen readers. */
function hiddenFromScreenReaders(element: ReturnType<typeof screen.getByText>): boolean {
  for (let at: typeof element | null = element; at; at = at.parent) {
    if (at.props['aria-hidden'] === true) return true;
  }
  return false;
}

type JsonNode = ReturnType<typeof screen.toJSON>;

/** The props of each scroll view the block draws. */
function scrollers(): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const visit = (node: JsonNode | string): void => {
    if (node === null || typeof node === 'string') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.type === 'RCTScrollView') found.push(node.props);
    node.children?.forEach(visit);
  };
  visit(screen.toJSON());
  return found;
}

describe('CodeBlock', () => {
  it('draws a header with its title and actions above the content', async () => {
    await render(
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>Terminal</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={output} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent>{output}</CodeBlockContent>
        <CodeBlockFooter testID="footer" />
      </CodeBlock>,
    );

    expect(screen.getByText('Terminal')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
    expect(screen.getByText(output)).toBeOnTheScreen();
    expect(screen.getByTestId('footer')).toBeOnTheScreen();
  });
});

/** The box CodeBlockContent pads its lines with, around the line drawing `text`. */
function contentBoxAround(text: string) {
  const box = screen.getByText(text).parent?.parent;
  if (!box) throw new Error(`No content box around ${text}`);
  return box;
}

function FileHeader({ children }: { children: ReactNode }) {
  return (
    <CodeBlockHeader>
      <CodeBlockTitle>{children}</CodeBlockTitle>
    </CodeBlockHeader>
  );
}

describe('CodeBlock rows around the content', () => {
  it('draws the content closer under a header', async () => {
    await render(
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>route.ts</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>code</CodeBlockContent>
      </CodeBlock>,
    );

    expect(emittedClasses(contentBoxAround('code').props.className)).toContain('pt-2');
  });

  it('draws it closer under a header an app wraps in a component of its own', async () => {
    await render(
      <CodeBlock>
        <FileHeader>route.ts</FileHeader>
        <CodeBlockContent>code</CodeBlockContent>
      </CodeBlock>,
    );

    expect(emittedClasses(contentBoxAround('code').props.className)).toContain('pt-2');
  });

  it('keeps the full padding with no header', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent>code</CodeBlockContent>
      </CodeBlock>,
    );

    const classes = emittedClasses(contentBoxAround('code').props.className);

    expect(classes).toContain('py-4');
    expect(classes).not.toContain('pt-2');
  });
});

describe('CodeBlockContent', () => {
  it('scrolls a long line sideways', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent>{output}</CodeBlockContent>
      </CodeBlock>,
    );

    expect(scrollers().some((scroller) => scroller.horizontal === true)).toBe(true);
  });

  it('wraps long lines instead of scrolling them with wrap', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent wrap>{output}</CodeBlockContent>
      </CodeBlock>,
    );

    expect(scrollers().some((scroller) => scroller.horizontal === true)).toBe(false);
  });

  it('reads left to right whatever the direction around it', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent testID="content">{output}</CodeBlockContent>
      </CodeBlock>,
    );

    expect(StyleSheet.flatten(screen.getByTestId('content').props.style)).toMatchObject({ direction: 'ltr' });
  });

  it('numbers each line of a string from startLine, hiding the numbers from screen readers', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent lineNumbers startLine={9}>
          {'first\nsecond\n'}
        </CodeBlockContent>
      </CodeBlock>,
    );

    expect(screen.getByText('first')).toBeOnTheScreen();
    expect(screen.getByText('second')).toBeOnTheScreen();
    expect(screen.queryByText(/^\s*11$/, { includeHiddenElements: true })).toBeNull();
    expect(hiddenFromScreenReaders(screen.getByText(/^\s*9$/, { includeHiddenElements: true }))).toBe(true);
    expect(hiddenFromScreenReaders(screen.getByText('10', { includeHiddenElements: true }))).toBe(true);
  });

  it('pads each number to the width of the widest', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent lineNumbers startLine={9}>
          <CodeBlockLine>a</CodeBlockLine>
          <CodeBlockLine>b</CodeBlockLine>
        </CodeBlockContent>
      </CodeBlock>,
    );

    expect(screen.getByText(' 9', { includeHiddenElements: true, normalizer: (text) => text })).toBeOnTheScreen();
    expect(screen.getByText('10', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('draws no numbers without lineNumbers', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent>
          <CodeBlockLine>a</CodeBlockLine>
        </CodeBlockContent>
      </CodeBlock>,
    );

    expect(screen.queryByText('1', { includeHiddenElements: true })).toBeNull();
  });
});

type HostElement = ReturnType<typeof screen.getByTestId>;

/** The horizontal scroller inside `content`, the CodeBlockContent's own scroller. */
function sidewaysScrollerIn(content: HostElement): HostElement {
  const queue: HostElement[] = [...(content.children as HostElement[])];
  for (let at = queue.shift(); at; at = queue.shift()) {
    if (typeof at === 'object' && at.props.horizontal === true) return at;
    if (typeof at === 'object') queue.push(...(at.children as HostElement[]));
  }
  throw new Error('No sideways scroller');
}

/** Lays `scroller` out at `viewport` long along `axis` around content `content` long. */
async function layOut(scroller: HostElement, axis: 'width' | 'height', viewport: number, content: number) {
  const size = (length: number) => ({ width: 0, height: 0, [axis]: length });
  await fireEvent(scroller, 'layout', { nativeEvent: { layout: { x: 0, y: 0, ...size(viewport) } } });
  const { width, height } = size(content);
  await fireEvent(scroller, 'contentSizeChange', width, height);
}

describe('CodeBlockContent scrolling', () => {
  async function renderContent(props: { scrollEnabled?: boolean } = {}) {
    await render(
      <CodeBlock>
        <CodeBlockContent testID="content" {...props}>
          {output}
        </CodeBlockContent>
      </CodeBlock>,
    );
    return screen.getByTestId('content');
  }

  it('leaves a drag to the page while the code fits, and neither scroller bounces', async () => {
    const content = await renderContent();
    await layOut(content, 'height', 200, 120);
    await layOut(sidewaysScrollerIn(content), 'width', 300, 280);

    expect(content).toHaveProp('scrollEnabled', false);
    expect(content).toHaveProp('bounces', false);
    expect(sidewaysScrollerIn(content)).toHaveProp('scrollEnabled', false);
    expect(sidewaysScrollerIn(content)).toHaveProp('bounces', false);
  });

  it('scrolls a long line sideways, and a capped block down, once the code runs past them', async () => {
    const content = await renderContent();
    await layOut(content, 'height', 200, 480);
    await layOut(sidewaysScrollerIn(content), 'width', 300, 720);

    expect(content).toHaveProp('scrollEnabled', true);
    expect(sidewaysScrollerIn(content)).toHaveProp('scrollEnabled', true);
  });

  it("takes the caller's scrollEnabled over its own", async () => {
    const content = await renderContent({ scrollEnabled: false });
    await layOut(content, 'height', 200, 480);

    expect(content).toHaveProp('scrollEnabled', false);
  });
});

describe('CodeBlockLine', () => {
  it('marks an added line with a plus and a removed one with a minus, read with the line', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent>
          <CodeBlockLine variant="removed">old</CodeBlockLine>
          <CodeBlockLine variant="added">new</CodeBlockLine>
          <CodeBlockLine variant="highlighted">same</CodeBlockLine>
        </CodeBlockContent>
      </CodeBlock>,
    );

    expect(hiddenFromScreenReaders(screen.getByText('+'))).toBe(false);
    expect(hiddenFromScreenReaders(screen.getByText('\u2212'))).toBe(false);
    expect(screen.getAllByText(/^[+\u2212]$/)).toHaveLength(2);
  });

  it('keeps the height of a line for an empty one', async () => {
    await render(
      <CodeBlock>
        <CodeBlockContent>
          <CodeBlockLine testID="empty" />
        </CodeBlockContent>
      </CodeBlock>,
    );

    expect(screen.getByTestId('empty')).toHaveTextContent(' ', { normalizer: (text) => text });
  });
});

describe('CodeBlockCopyButton', () => {
  let announce: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    setStringAsync.mockReset();
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    announce.mockRestore();
  });

  async function renderCopy(onPress?: () => void) {
    await render(
      <CodeBlock>
        <CodeBlockActions>
          <CodeBlockCopyButton value={output} onPress={onPress} />
        </CodeBlockActions>
        <CodeBlockContent>{output}</CodeBlockContent>
      </CodeBlock>,
    );
  }

  it('copies its value, says Copied, and announces it on iOS and through a live region', async () => {
    setStringAsync.mockResolvedValue(true);
    const onPress = jest.fn();
    await renderCopy(onPress);

    await fireEvent.press(screen.getByRole('button', { name: 'Copy' }));

    expect(onPress).toHaveBeenCalled();
    expect(setStringAsync).toHaveBeenCalledWith(output);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();
    expect(Platform.OS).toBe('ios');
    expect(announce).toHaveBeenCalledWith('Copied');
    expect(liveRegionAround(screen.getByText('Copied'))).toHaveProp('aria-live', 'polite');
  });

  it('goes back to Copy two seconds later', async () => {
    setStringAsync.mockResolvedValue(true);
    await renderCopy();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy' }));

    await act(async () => {
      jest.advanceTimersByTime(1999);
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
    expect(screen.queryByText('Copied')).toBeNull();
  });

  it('stays Copy and announces nothing when the copy fails', async () => {
    setStringAsync.mockRejectedValue(new Error('denied'));
    await renderCopy();

    await fireEvent.press(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
    expect(announce).not.toHaveBeenCalled();
  });
});
