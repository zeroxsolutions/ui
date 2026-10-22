import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, type ScrollViewInstance } from 'react-native';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
  type MessageScrollerProviderProps,
} from './message-scroller';
import { Text } from './text';

/** A row of the transcript: its id, whether it starts a turn, and where it is laid out. */
interface Row {
  id: string;
  anchor?: boolean;
  /** What the row says; `Message <id>` by default. */
  text?: string;
  /** Draws the row's text through a component of its own, announced by this label. */
  said?: string;
  y: number;
  height: number;
}

const VIEWPORT = 400;

/** Ten rows of 100px, 16px apart, under 16px of padding: the content is 1176px high. */
const LONG: Row[] = Array.from({ length: 10 }, (_, index) => ({
  id: `m${index}`,
  anchor: index % 2 === 0,
  y: 16 + index * 116,
  height: 100,
}));
const contentHeightOf = (rows: readonly Row[]): number =>
  rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.y + row.height)) + 16;

/** A message drawn by a component of its own, as an app's chat message is. */
function Said({ text }: { text: string }) {
  return <Text>{text}</Text>;
}

function Transcript({
  rows,
  busy,
  children,
  ...provider
}: MessageScrollerProviderProps & { rows: readonly Row[]; busy?: boolean; children?: ReactNode }) {
  return (
    <MessageScrollerProvider {...provider}>
      <MessageScroller>
        <MessageScrollerViewport testID="viewport">
          <MessageScrollerContent testID="content" aria-busy={busy}>
            {rows.map((row) => (
              <MessageScrollerItem
                key={row.id}
                testID={row.id}
                messageId={row.id}
                scrollAnchor={row.anchor}
                aria-label={row.said}
              >
                {row.said === undefined ? <Text>{row.text ?? `Message ${row.id}`}</Text> : <Said text={row.said} />}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
      {children}
    </MessageScrollerProvider>
  );
}

/** Lets `ms` pass on Jest's clock, running the frames due in it. */
const elapse = (ms = 16) => act(() => jest.advanceTimersByTimeAsync(ms));

const viewport = () => screen.getByTestId('viewport');

/** The room made under the content, drawn after it, for a row to reach the top of the viewport. */
const spacer = () => {
  const after = screen.getByTestId('content').parent?.children[1];
  return typeof after === 'object' ? after : undefined;
};

const layout = (height: number, y = 0) => ({ nativeEvent: { layout: { x: 0, y, width: 320, height } } });

/** Lays the viewport, the content and each row out, as a device does once they are drawn. */
async function layOut(rows: readonly Row[], viewportHeight = VIEWPORT): Promise<void> {
  for (const row of rows) {
    await fireEvent(screen.getByTestId(row.id), 'layout', layout(row.height, row.y));
  }
  await fireEvent(screen.getByTestId('content'), 'layout', layout(contentHeightOf(rows)));
  await fireEvent(viewport(), 'layout', layout(viewportHeight));
  await elapse();
}

/** Scrolls the viewport to `y`, as the platform reports a scroll. */
async function scrollTo(y: number): Promise<void> {
  await fireEvent.scroll(viewport(), { nativeEvent: { contentOffset: { x: 0, y } } });
  await elapse();
}

let scrolls: jest.SpyInstance;
/** Where the scroller last asked the viewport to scroll, and whether it animated. */
const lastScroll = () => scrolls.mock.calls.at(-1)?.[0] as { y: number; animated: boolean } | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  // Both are mocks the React Native preset made already, which spyOn hands back with the calls of earlier tests.
  jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockClear()
    .mockImplementation(() => undefined);
  scrolls = jest
    .spyOn((ScrollView as unknown as { prototype: Pick<ScrollViewInstance, 'scrollTo'> }).prototype, 'scrollTo')
    .mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('MessageScroller', () => {
  it('is a region named Messages holding the transcript as a log', async () => {
    await render(<Transcript rows={LONG.slice(0, 2)} />);

    // A role query finds only accessible elements, and a scroll view made one would hide its rows from VoiceOver.
    expect(viewport().props).toMatchObject({ role: 'region', 'aria-label': 'Messages' });
    expect(screen.getByTestId('content').props.role).toBe('log');
  });

  describe('opening', () => {
    it('opens at the end, hidden until it is there', async () => {
      await render(<Transcript rows={LONG} />);

      expect(StyleSheet.flatten(viewport().props.style)).toEqual(expect.objectContaining({ opacity: 0 }));

      await layOut(LONG);

      expect(lastScroll()).toEqual({ y: contentHeightOf(LONG) - VIEWPORT, animated: false });
      expect(StyleSheet.flatten(viewport().props.style)?.opacity).toBeUndefined();
    });

    it('opens at the start with defaultScrollPosition start, without hiding', async () => {
      await render(<Transcript rows={LONG} defaultScrollPosition="start" />);

      expect(StyleSheet.flatten(viewport().props.style)?.opacity).toBeUndefined();

      await layOut(LONG);

      expect(scrolls).not.toHaveBeenCalled();
    });

    it('opens on the last anchored turn, a peek of the row before it above, with last-anchor', async () => {
      const rows = LONG.map((row) => ({ ...row, anchor: row.id === 'm6' }));
      await render(<Transcript rows={rows} defaultScrollPosition="last-anchor" />);
      await layOut(rows);

      // m6 starts at 712; less the 16px of padding and the 64px peek.
      expect(lastScroll()).toEqual({ y: 712 - 16 - 64, animated: false });
    });

    it('opens at the end with last-anchor when the last anchored turn fits in the viewport', async () => {
      await render(<Transcript rows={LONG} defaultScrollPosition="last-anchor" />);
      await layOut(LONG);

      expect(lastScroll()).toEqual({ y: contentHeightOf(LONG) - VIEWPORT, animated: false });
    });

    it('shows a transcript with no rows at once', async () => {
      await render(<Transcript rows={[]} />);
      await elapse();

      expect(StyleSheet.flatten(viewport().props.style)?.opacity).toBeUndefined();
    });
  });

  describe('a new turn', () => {
    it('brings an added anchored row near the top, keeping a peek of the row before it', async () => {
      const rows = LONG.slice(0, 3);
      await render(<Transcript rows={rows} defaultScrollPosition="start" />);
      await layOut(rows);

      const added = [...rows, { id: 'm3', anchor: true, y: 364, height: 100 }];
      await screen.rerender(<Transcript rows={added} defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m3'), 'layout', layout(100, 364));
      await fireEvent(screen.getByTestId('content'), 'layout', layout(contentHeightOf(added)));
      await elapse();

      // The content ends at 480, short of the 284 + 400 the row needs at the top, so room is made under it first.
      const room = spacer();
      expect(StyleSheet.flatten(room?.props.style)).toEqual({ height: 284 + VIEWPORT - 480 });
      expect(lastScroll()).toBeUndefined();

      await fireEvent(room!, 'layout', layout(284 + VIEWPORT - 480));

      expect(lastScroll()).toEqual({ y: 364 - 16 - 64, animated: false });
    });

    it('stays where the reader is when the added row starts no turn', async () => {
      const rows = LONG.slice(0, 3);
      await render(<Transcript rows={rows} defaultScrollPosition="start" />);
      await layOut(rows);

      const added = [...rows, { id: 'm3', anchor: false, y: 364, height: 100 }];
      await screen.rerender(<Transcript rows={added} defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m3'), 'layout', layout(100, 364));
      await elapse();

      expect(scrolls).not.toHaveBeenCalled();
    });

    it('keeps the rows on screen in place when earlier rows are added above them', async () => {
      await render(<Transcript rows={LONG.slice(2)} defaultScrollPosition="start" />);
      await layOut(LONG.slice(2).map((row) => ({ ...row, y: row.y - 232 })));
      await scrollTo(300);

      await screen.rerender(<Transcript rows={LONG} defaultScrollPosition="start" />);
      await layOut(LONG);

      expect(lastScroll()).toEqual({ y: 300 + 232, animated: false });
    });
  });

  describe('with autoScroll', () => {
    it('follows a reply that grows while the reader is at the end', async () => {
      await render(<Transcript rows={LONG} autoScroll />);
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);

      const grown = LONG.map((row, index) => (index === 9 ? { ...row, height: 300 } : row));
      await layOut(grown);

      expect(lastScroll()).toEqual({ y: contentHeightOf(grown) - VIEWPORT, animated: false });
    });

    it('lets go once the reader drags away from the end', async () => {
      await render(<Transcript rows={LONG} autoScroll />);
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);
      const calls = scrolls.mock.calls.length;

      await fireEvent(viewport(), 'scrollBeginDrag', { nativeEvent: { contentOffset: { x: 0, y: 700 } } });
      await scrollTo(500);
      await layOut(LONG.map((row, index) => (index === 9 ? { ...row, height: 300 } : row)));

      expect(scrolls.mock.calls).toHaveLength(calls);
    });
  });

  describe('the button', () => {
    it('is hidden from screen readers while the transcript is at its end', async () => {
      await render(<Transcript rows={LONG} />);
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);

      expect(screen.queryByRole('button', { name: 'Scroll to end' })).toBeNull();
    });

    it('shows while there is more below, and scrolls smoothly to the end when pressed', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await render(<Transcript rows={LONG} />);
      await layOut(LONG);
      await scrollTo(100);

      await user.press(screen.getByRole('button', { name: 'Scroll to end' }));

      expect(lastScroll()).toEqual({ y: contentHeightOf(LONG) - VIEWPORT, animated: true });
    });

    it('jumps to the end when pressed while the system asks for reduced motion', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await render(<Transcript rows={LONG} />);
      await act(async () => {});
      await layOut(LONG);
      await scrollTo(100);

      await user.press(screen.getByRole('button', { name: 'Scroll to end' }));

      expect(lastScroll()).toEqual({ y: contentHeightOf(LONG) - VIEWPORT, animated: false });
    });

    it('fades in over 200ms as there comes to be more below', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
      await render(<Transcript rows={LONG} />);
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);
      /** The view the button fades and rises in. */
      const layer = () => screen.getByRole('button', { name: 'Scroll to end', includeHiddenElements: true }).parent;

      await scrollTo(100);
      await elapse(100);
      expect(layer()).not.toHaveAnimatedStyle({ opacity: 1 });
      await elapse(150);
      expect(layer()).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('appears at once when the system asks for reduced motion', async () => {
      await render(<Transcript rows={LONG} />);
      await act(async () => {});
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);

      await scrollTo(100);

      expect(screen.getByRole('button', { name: 'Scroll to end' }).parent).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('scrolls to the start for direction start, shown once the reader has scrolled down', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await render(
        <MessageScrollerProvider defaultScrollPosition="start">
          <MessageScroller>
            <MessageScrollerViewport testID="viewport">
              <MessageScrollerContent testID="content">
                {LONG.map((row) => (
                  <MessageScrollerItem key={row.id} testID={row.id} messageId={row.id}>
                    <Text>{row.id}</Text>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="start" />
          </MessageScroller>
        </MessageScrollerProvider>,
      );
      await layOut(LONG);
      expect(screen.queryByRole('button', { name: 'Scroll to start' })).toBeNull();

      await scrollTo(300);
      await user.press(screen.getByRole('button', { name: 'Scroll to start' }));

      expect(lastScroll()).toEqual({ y: 0, animated: true });
    });
  });

  describe('the hooks', () => {
    it('useMessageScrollerScrollable reports the edges the viewport can still scroll toward', async () => {
      function Edges() {
        const { start, end } = useMessageScrollerScrollable();
        return <Text>{`start ${start} end ${end}`}</Text>;
      }
      await render(
        <Transcript rows={LONG} defaultScrollPosition="start">
          <Edges />
        </Transcript>,
      );
      await layOut(LONG);
      await scrollTo(0);
      expect(screen.getByText('start false end true')).toBeVisible();

      await scrollTo(300);
      expect(screen.getByText('start true end true')).toBeVisible();

      await scrollTo(contentHeightOf(LONG) - VIEWPORT);
      expect(screen.getByText('start true end false')).toBeVisible();
    });

    it('useMessageScroller scrolls to a row by its messageId, and says false for an id no row has', async () => {
      const results: boolean[] = [];
      function Jump() {
        const { scrollToMessage } = useMessageScroller();
        return (
          <>
            <Text onPress={() => results.push(scrollToMessage('m4'))}>Jump to m4</Text>
            <Text onPress={() => results.push(scrollToMessage('gone'))}>Jump to gone</Text>
          </>
        );
      }
      await render(
        <Transcript rows={LONG} defaultScrollPosition="start">
          <Jump />
        </Transcript>,
      );
      await layOut(LONG);

      await fireEvent.press(screen.getByText('Jump to m4'));
      expect(lastScroll()).toEqual({ y: LONG[4].y - 16, animated: false });

      await fireEvent.press(screen.getByText('Jump to gone'));
      expect(results).toEqual([true, false]);
    });

    it('useMessageScrollerVisibility reports the rows on screen and the anchored turn the reader is in', async () => {
      function Where() {
        const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
        return <Text>{`${currentAnchorId} | ${visibleMessageIds.join(',')}`}</Text>;
      }
      await render(
        <Transcript rows={LONG} defaultScrollPosition="start" scrollPreviousItemPeek={0}>
          <Where />
        </Transcript>,
      );
      await layOut(LONG);

      await scrollTo(250);
      // m2 starts at 248; m2 to m5 are on screen between 250 and 650.
      expect(screen.getByText('m2 | m2,m3,m4,m5')).toBeVisible();
    });
  });

  describe('on a device', () => {
    it('announces a row as it is added', async () => {
      const rows = LONG.slice(0, 2);
      await render(<Transcript rows={rows} defaultScrollPosition="start" />);
      await layOut(rows);

      const added = [...rows, { id: 'm2', y: 248, height: 100 }];
      await screen.rerender(<Transcript rows={added} defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m2'), 'layout', layout(100, 248));
      await elapse();

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Message m2');
    });

    it('announces a row drawn by a component of its own by its aria-label', async () => {
      const rows = LONG.slice(0, 2);
      await render(<Transcript rows={rows} defaultScrollPosition="start" />);
      await layOut(rows);

      const added = [...rows, { id: 'm2', y: 248, height: 100, said: 'Ada: Shipped it' }];
      await screen.rerender(<Transcript rows={added} defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m2'), 'layout', layout(100, 248));
      await elapse();

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Ada: Shipped it');
    });

    it('announces a row added with no text once text streams into it', async () => {
      const rows = LONG.slice(0, 2);
      await render(<Transcript rows={rows} defaultScrollPosition="start" />);
      await layOut(rows);

      const reply = { id: 'm2', y: 248, height: 100 };
      await screen.rerender(<Transcript rows={[...rows, { ...reply, text: '' }]} defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m2'), 'layout', layout(100, 248));
      await elapse();
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

      await screen.rerender(<Transcript rows={[...rows, { ...reply, text: 'Here' }]} defaultScrollPosition="start" />);
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Here');
    });

    it('holds the rows added while the content is busy until it is not', async () => {
      const rows = LONG.slice(0, 2);
      await render(<Transcript rows={rows} busy defaultScrollPosition="start" />);
      await layOut(rows);

      const added = [...rows, { id: 'm2', y: 248, height: 100 }];
      await screen.rerender(<Transcript rows={added} busy defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m2'), 'layout', layout(100, 248));
      await elapse();
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

      await screen.rerender(<Transcript rows={added} busy={false} defaultScrollPosition="start" />);
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Message m2');
    });
  });

  describe('on the web', () => {
    const os = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'web';
    });
    afterEach(() => {
      Platform.OS = os;
    });

    it('stops following the end once the reader turns the wheel', async () => {
      await render(<Transcript rows={LONG} autoScroll />);
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);
      const calls = scrolls.mock.calls.length;

      await fireEvent(viewport(), 'wheel', {});
      await layOut(LONG.map((row, index) => (index === 9 ? { ...row, height: 300 } : row)));

      expect(scrolls.mock.calls).toHaveLength(calls);
    });

    it('stops following the end once the reader presses a scroll key, and not for another key', async () => {
      await render(<Transcript rows={LONG} autoScroll />);
      await layOut(LONG);
      await scrollTo(contentHeightOf(LONG) - VIEWPORT);
      const grown = LONG.map((row, index) => (index === 9 ? { ...row, height: 300 } : row));

      await fireEvent(viewport(), 'keyDown', { nativeEvent: { key: 'a' } });
      await layOut(grown);
      expect(lastScroll()).toEqual({ y: contentHeightOf(grown) - VIEWPORT, animated: false });
      await scrollTo(contentHeightOf(grown) - VIEWPORT);
      const calls = scrolls.mock.calls.length;

      await fireEvent(viewport(), 'keyDown', { nativeEvent: { key: 'PageUp' } });
      await layOut(LONG.map((row, index) => (index === 9 ? { ...row, height: 500 } : row)));
      expect(scrolls.mock.calls).toHaveLength(calls);
    });

    it('moves focus to the viewport once the button is pressed, as the button hides', async () => {
      const focus = jest.fn();
      (ScrollView.prototype as unknown as { focus: () => void }).focus = focus;
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await render(<Transcript rows={LONG} />);
      await layOut(LONG);
      await scrollTo(100);

      await user.press(screen.getByRole('button', { name: 'Scroll to end' }));

      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      delete (ScrollView.prototype as unknown as { focus?: () => void }).focus;
    });

    it('leaves announcing to the log', async () => {
      const rows = LONG.slice(0, 2);
      await render(<Transcript rows={rows} defaultScrollPosition="start" />);
      await layOut(rows);

      const added = [...rows, { id: 'm2', y: 248, height: 100 }];
      await screen.rerender(<Transcript rows={added} defaultScrollPosition="start" />);
      await fireEvent(screen.getByTestId('m2'), 'layout', layout(100, 248));
      await elapse();

      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
      expect(screen.getByTestId('content').props['aria-live']).toBe('polite');
    });
  });
});
