import { ArrowDown } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../lib/motion';
import { textOf } from '../lib/text-children';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icon } from './icon';

// A `cn-<slot>` token stands for that slot's view classes; the registry build replaces each with the classes
// translated for the target engine.

/** Where a transcript opens: its first row, its last, or the start of its last anchored turn. */
type MessageScrollerDefaultScrollPosition = 'start' | 'end' | 'last-anchor';
/** The edge a MessageScrollerButton scrolls to. */
type MessageScrollerButtonDirection = 'start' | 'end';
/** Where a row lands in the viewport when scrolled to. */
type MessageScrollerScrollAlign = 'start' | 'center' | 'end' | 'nearest';
/** `smooth` animates a scroll; `auto` and `instant` jump. */
type MessageScrollerScrollBehavior = 'auto' | 'instant' | 'smooth';

/** How a scroll command moves the viewport. */
type MessageScrollerScrollOptions = {
  /** Where the row lands; `start` by default. */
  align?: MessageScrollerScrollAlign;
  /** `auto` by default. */
  behavior?: MessageScrollerScrollBehavior;
  /** Room in px left between the row and the viewport's edge; the provider's `scrollMargin` by default. */
  scrollMargin?: number;
};

/** The edges the viewport can still scroll toward. At the end is `!end`; scrollable at all is `start || end`. */
type MessageScrollerScrollable = {
  start: boolean;
  end: boolean;
};

/** Where the reader is in the transcript. */
type MessageScrollerVisibilityState = {
  /** The `messageId` of the last anchored row at or above the top of the viewport; it stays set once scrolled past. */
  currentAnchorId: string | null;
  /** The `messageId` of each row on screen, in transcript order. */
  visibleMessageIds: string[];
};

/** Upstream's defaults: an edge within 8px counts as reached, and an anchored turn keeps 64px of the one before. */
const SCROLL_EDGE_THRESHOLD = 8;
const SCROLL_PREVIOUS_ITEM_PEEK = 64;
/** A difference in px below which two scroll positions are the same. */
const SAME_POSITION = 0.5;
/** How long a scroll to the end counts as the scroller's own, so the scroll events it raises do not read as the reader's. */
const AUTOSCROLL_WINDOW = 180;

/** The keys that scroll a focused viewport on the web, which the reader presses to move away from the live edge. */
const SCROLL_KEYS: ReadonlySet<string> = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' ']);

const NO_EDGES: MessageScrollerScrollable = { start: false, end: false };
const NO_VISIBILITY: MessageScrollerVisibilityState = { currentAnchorId: null, visibleMessageIds: [] };

/** A value components read with `useSyncExternalStore`, so a scroll re-renders only the parts that read it. */
interface Store<T> {
  getSnapshot: () => T;
  setSnapshot: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  hasListeners: () => boolean;
}

function createStore<T>(initial: T, same: (a: T, b: T) => boolean): Store<T> {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    setSnapshot: (next) => {
      if (same(snapshot, next)) return;
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hasListeners: () => listeners.size > 0,
  };
}

const sameEdges = (a: MessageScrollerScrollable, b: MessageScrollerScrollable): boolean =>
  a.start === b.start && a.end === b.end;

const sameVisibility = (a: MessageScrollerVisibilityState, b: MessageScrollerVisibilityState): boolean =>
  a.currentAnchorId === b.currentAnchorId &&
  a.visibleMessageIds.length === b.visibleMessageIds.length &&
  a.visibleMessageIds.every((id, index) => id === b.visibleMessageIds[index]);

/**
 * How the viewport moves as the transcript changes: it follows the end while the reader is there with
 * `autoScroll`, holds an anchored turn at the top while its reply streams in below, settles after a jump to a
 * row, or stays wherever the reader left it.
 */
type ScrollMode = 'following-bottom' | 'free-scrolling' | 'anchored-to-message' | 'settling-jump';

/** One MessageScrollerItem as the provider knows it. */
interface ItemRecord {
  key: string;
  /** The order it mounted in, which breaks a tie between rows laid out at one offset. */
  order: number;
  messageId: string | undefined;
  anchor: boolean;
  /** Its offset from the top of the content and its height, once it has been laid out. */
  y: number;
  height: number;
  laidOut: boolean;
  /** The text a screen reader is told when the row is added. */
  text: string;
}

/** What the provider is configured with, read afresh on every render. */
interface ScrollerConfig {
  autoScroll: boolean;
  defaultScrollPosition: MessageScrollerDefaultScrollPosition;
  scrollEdgeThreshold: number;
  scrollPreviousItemPeek: number;
  scrollMargin: number;
}

/**
 * The scroll state of one transcript, kept outside React state so that scrolling and streaming re-render no
 * row: only the parts that read a store re-render when it changes. It learns the viewport and every row from
 * their layout and scroll events, and moves the viewport with ScrollView's `scrollTo`.
 */
class MessageScrollerEngine {
  config: ScrollerConfig;
  readonly scrollable = createStore<MessageScrollerScrollable>(NO_EDGES, sameEdges);
  readonly visibility = createStore<MessageScrollerVisibilityState>(NO_VISIBILITY, sameVisibility);
  readonly pendingDefaultScroll: Store<boolean>;
  /** The px added under the content so an anchored row can reach the top of the viewport. */
  readonly spacer = createStore<number>(0, Object.is);

  scrollView: ScrollViewInstance | null = null;
  preserveScrollOnPrepend = true;
  /** Whether the content says its rows are still streaming, when additions wait to be announced. */
  busy = false;

  private viewportHeight = 0;
  private scrollY = 0;
  private lastScrollY = 0;
  private contentHeight = 0;
  private readonly items = new Map<string, ItemRecord>();
  private nextOrder = 0;
  private itemCount = 0;
  private firstKey: string | null = null;
  private mode: ScrollMode;
  private anchoredKey: string | null = null;
  private readonly handledAnchors = new Set<string>();
  private defaultApplied = false;
  private pendingMessage: { messageId: string; options?: MessageScrollerScrollOptions } | null = null;
  private prependRestore: { key: string; viewportTop: number } | null = null;
  /** A scroll that waits for the spacer it needs to be laid out, since a device stops a scroll at the content's end. */
  private pendingScroll: { y: number; animated: boolean } | null = null;
  private spacerLaidOut = 0;
  private autoscrolling = false;
  private autoscrollTimer: ReturnType<typeof setTimeout> | null = null;
  private frame: number | null = null;
  private contentChanged = false;
  private visibilityFrame: number | null = null;
  private unannounced: string[] = [];

  constructor(config: ScrollerConfig) {
    this.config = config;
    this.mode = config.autoScroll ? 'following-bottom' : 'free-scrolling';
    this.pendingDefaultScroll = createStore<boolean>(
      config.defaultScrollPosition === 'end' || config.defaultScrollPosition === 'last-anchor',
      Object.is,
    );
  }

  configure(config: ScrollerConfig): void {
    if (config.defaultScrollPosition !== this.config.defaultScrollPosition) this.defaultApplied = false;
    this.config = config;
  }

  dispose(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    if (this.visibilityFrame !== null) cancelAnimationFrame(this.visibilityFrame);
    if (this.autoscrollTimer !== null) clearTimeout(this.autoscrollTimer);
  }

  // Rows

  registerItem(key: string, messageId: string | undefined, anchor: boolean, text: string): void {
    const known = this.items.get(key);
    if (known) {
      const changed = known.anchor !== anchor || known.messageId !== messageId;
      const filled = known.text === '' && text !== '';
      Object.assign(known, { messageId, anchor, text });
      if (changed) this.schedule('content');
      if (filled && !this.busy && this.unannounced.includes(key)) this.announceAdditions();
      return;
    }
    this.items.set(key, { key, order: this.nextOrder++, messageId, anchor, y: 0, height: 0, laidOut: false, text });
    if (messageId !== undefined && this.pendingMessage?.messageId === messageId) this.schedule('content');
  }

  unregisterItem(key: string): void {
    if (!this.items.delete(key)) return;
    this.handledAnchors.delete(key);
    this.schedule('content');
  }

  layoutItem(key: string, y: number, height: number): void {
    const item = this.items.get(key);
    if (!item) return;
    const first = !item.laidOut;
    item.y = y;
    item.height = height;
    item.laidOut = true;
    this.schedule(first ? 'content' : 'resize');
  }

  hasItems(): boolean {
    return this.items.size > 0;
  }

  // Layout and scroll events

  layoutViewport(height: number): void {
    if (height === this.viewportHeight) return;
    this.viewportHeight = height;
    this.schedule('resize');
  }

  layoutContent(height: number): void {
    if (height === this.contentHeight) return;
    this.contentHeight = height;
    this.schedule('resize');
  }

  layoutSpacer(height: number): void {
    this.spacerLaidOut = height;
    const pending = this.pendingScroll;
    if (pending && height >= this.spacer.getSnapshot()) {
      this.pendingScroll = null;
      this.scrollView?.scrollTo({ y: pending.y, animated: pending.animated });
    }
  }

  scrolled(y: number): void {
    this.scrollY = y;
    this.commitScrollState();
    this.scheduleVisibility();
    this.rememberTopItem();
  }

  /** The reader moved the viewport themselves, by a drag, the wheel or a key, so it stops following and anchoring. */
  userScrollIntent(): void {
    if (this.mode === 'free-scrolling') return;
    this.anchoredKey = null;
    this.mode = 'free-scrolling';
  }

  setBusy(busy: boolean): void {
    if (busy === this.busy) return;
    this.busy = busy;
    if (!busy) this.announceAdditions();
  }

  // Commands

  scrollToEnd = ({ behavior = 'auto' }: MessageScrollerScrollOptions = {}): boolean => {
    if (!this.scrollView) return false;
    this.setSpacer(0);
    this.anchoredKey = null;
    this.mode = this.config.autoScroll ? 'following-bottom' : 'free-scrolling';
    this.scrollTo(Math.max(0, this.contentHeight - this.viewportHeight), behavior, true);
    this.scheduleVisibility();
    return true;
  };

  scrollToStart = ({ behavior = 'auto' }: MessageScrollerScrollOptions = {}): boolean => {
    if (!this.scrollView) return false;
    this.setSpacer(0);
    this.anchoredKey = null;
    this.mode = 'free-scrolling';
    this.scrollTo(0, behavior, false);
    this.scheduleVisibility();
    return true;
  };

  scrollToMessage = (messageId: string, options?: MessageScrollerScrollOptions): boolean => {
    const item = [...this.items.values()].find((record) => record.messageId === messageId);
    if (item) {
      this.markDefaultApplied();
      if (this.scrollToItem(item, options)) this.pendingMessage = null;
      else this.pendingMessage = { messageId, options };
      return true;
    }
    if (this.itemCount === 0) {
      this.pendingMessage = { messageId, options };
      this.markDefaultApplied();
      return true;
    }
    return false;
  };

  /** Clears the pending default position when the transcript mounted with no rows, so the viewport shows. */
  settleEmpty(): void {
    if (this.items.size === 0) this.pendingDefaultScroll.setSnapshot(false);
  }

  // Internals

  private schedule(kind: 'content' | 'resize'): void {
    if (kind === 'content') this.contentChanged = true;
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      // A row that has mounted but not been laid out yet is waited for; its layout schedules this again.
      if ([...this.items.values()].some((item) => !item.laidOut)) return;
      const contentChanged = this.contentChanged;
      this.contentChanged = false;
      if (contentChanged) this.handleContentChange();
      else this.handleResize();
    });
  }

  private orderedItems(): ItemRecord[] {
    return [...this.items.values()].sort((a, b) => a.y - b.y || a.order - b.order);
  }

  /** The content's padding, as far as its rows show it: the room above the first and below the last. */
  private padding(items: readonly ItemRecord[]): { start: number; end: number } {
    if (items.length === 0) return { start: 0, end: 0 };
    const last = items.reduce((bottom, item) => Math.max(bottom, item.y + item.height), 0);
    return { start: items[0].y, end: Math.max(0, this.contentHeight - last) };
  }

  private markDefaultApplied(): void {
    this.defaultApplied = true;
    this.pendingDefaultScroll.setSnapshot(false);
  }

  private setSpacer(height: number): void {
    this.spacer.setSnapshot(Math.max(0, Math.ceil(height)));
  }

  private setAutoscrolling(on: boolean): void {
    if (this.autoscrollTimer !== null) clearTimeout(this.autoscrollTimer);
    this.autoscrollTimer = null;
    this.autoscrolling = on;
    if (on) {
      this.autoscrollTimer = setTimeout(() => {
        this.autoscrollTimer = null;
        this.autoscrolling = false;
        this.commitScrollState();
      }, AUTOSCROLL_WINDOW);
    }
  }

  private scrollTo(y: number, behavior: MessageScrollerScrollBehavior, autoscrolling: boolean): void {
    const target = Math.max(0, y);
    if (Math.abs(this.scrollY - target) <= SAME_POSITION) {
      this.commitScrollState();
      return;
    }
    if (autoscrolling) this.setAutoscrolling(true);
    const animated = behavior === 'smooth';
    if (this.spacerLaidOut < this.spacer.getSnapshot()) {
      this.pendingScroll = { y: target, animated };
      return;
    }
    this.pendingScroll = null;
    this.scrollView?.scrollTo({ y: target, animated });
  }

  /** Where the viewport scrolls to put `item` at `align`, `margin` px from the edge, inside the content's padding. */
  private targetFor(item: ItemRecord, align: MessageScrollerScrollAlign, margin: number): number {
    const padding = this.padding(this.orderedItems());
    const height = this.viewportHeight;
    if (align === 'center') {
      const room = Math.max(0, height - padding.start - padding.end);
      return item.y - padding.start - (room - item.height) / 2 - margin;
    }
    if (align === 'end') return item.y - height + item.height + padding.end + margin;
    if (align === 'nearest') {
      const top = this.scrollY + padding.start;
      const bottom = this.scrollY + height - padding.end;
      if (item.y >= top && item.y + item.height <= bottom) return this.scrollY;
      return item.y < top ? item.y - padding.start - margin : item.y + item.height - height + padding.end + margin;
    }
    return item.y - padding.start - margin;
  }

  private scrollToItem(
    item: ItemRecord,
    { align = 'start', behavior = 'auto', scrollMargin = this.config.scrollMargin }: MessageScrollerScrollOptions = {},
    keepPreviousPeek = false,
  ): boolean {
    if (!this.scrollView || !this.items.has(item.key) || !item.laidOut) return false;
    const margin = keepPreviousPeek ? scrollMargin + this.config.scrollPreviousItemPeek : scrollMargin;
    const target = this.targetFor(item, align, margin);
    this.setSpacer(target + this.viewportHeight - this.contentHeight);
    this.prependRestore = { key: item.key, viewportTop: item.y - this.scrollY };
    this.mode = keepPreviousPeek ? 'anchored-to-message' : 'settling-jump';
    this.anchoredKey = keepPreviousPeek ? item.key : null;
    this.scrollTo(target, behavior, false);
    this.scheduleVisibility();
    return true;
  }

  private reanchor(): boolean {
    const key = this.anchoredKey;
    const item = key === null ? undefined : this.items.get(key);
    if (!item || this.mode !== 'anchored-to-message') return false;
    return this.scrollToItem(item, { align: 'start' }, true);
  }

  private flushPendingMessage(): boolean {
    const pending = this.pendingMessage;
    if (!pending) return false;
    const item = [...this.items.values()].find((record) => record.messageId === pending.messageId);
    if (!item || !this.scrollToItem(item, pending.options)) return false;
    this.pendingMessage = null;
    this.markDefaultApplied();
    return true;
  }

  private applyDefaultScrollPosition(): boolean {
    const position = this.config.defaultScrollPosition;
    if (this.defaultApplied || this.itemCount === 0 || this.viewportHeight === 0) return false;
    let applied: boolean;
    if (position === 'last-anchor') {
      const anchors = this.orderedItems().filter((item) => item.anchor);
      const last = anchors[anchors.length - 1];
      applied =
        !last || this.contentHeight - last.y <= this.viewportHeight
          ? this.scrollToEnd()
          : this.scrollToItem(last, { align: 'start' }, true);
    } else {
      applied = position === 'end' ? this.scrollToEnd() : this.scrollToStart();
    }
    if (applied) this.markDefaultApplied();
    return applied;
  }

  private handleContentChange(): void {
    const items = this.orderedItems();
    const previousCount = this.itemCount;
    const previousFirst = this.firstKey;
    this.itemCount = items.length;
    this.firstKey = items[0]?.key ?? null;
    const keys = items.map((item) => item.key);

    const moved = ((): boolean => {
      if (this.flushPendingMessage()) return true;
      if (previousCount === 0) {
        if (this.applyDefaultScrollPosition()) return true;
        if (items.length > 0 && this.config.autoScroll && this.scrollToEnd()) return true;
        if (items.length === 0) this.pendingDefaultScroll.setSnapshot(false);
        return false;
      }
      const firstIndex = previousFirst === null ? -1 : keys.indexOf(previousFirst);
      if (this.preserveScrollOnPrepend && firstIndex > 0) return this.restorePrepend();
      if (items.length > previousCount) {
        this.queueAnnouncements(items.slice(previousCount));
        const added = items.slice(previousCount).filter((item) => item.anchor);
        if (added.length > 0) {
          if (this.config.autoScroll && this.mode === 'following-bottom' && added.length > 1) {
            return this.scrollToEnd();
          }
          this.handledAnchors.add(added[0].key);
          return this.scrollToItem(added[0], { align: 'start' }, true);
        }
      }
      if (items.length === previousCount) {
        const unhandled = items.find((item) => item.anchor && !this.handledAnchors.has(item.key));
        if (unhandled) {
          this.handledAnchors.add(unhandled.key);
          return this.scrollToItem(unhandled, { align: 'start' }, true);
        }
      }
      if (this.mode === 'following-bottom' && this.config.autoScroll) return this.scrollToEnd();
      return false;
    })();

    if (!moved) {
      this.commitScrollState();
      this.scheduleVisibility();
    }
    this.rememberTopItem();
  }

  private handleResize(): void {
    if (!this.defaultApplied && this.itemCount > 0 && this.applyDefaultScrollPosition()) return;
    if (this.mode === 'following-bottom' && this.config.autoScroll) {
      this.scrollToEnd();
      return;
    }
    const spacerBefore = this.spacer.getSnapshot();
    if (this.reanchor()) {
      // The reply has grown past the room the spacer made, so the reader is at the live edge again.
      if (this.config.autoScroll && spacerBefore > 0 && this.spacer.getSnapshot() === 0) this.scrollToEnd();
      return;
    }
    this.commitScrollState();
    this.scheduleVisibility();
  }

  private restorePrepend(): boolean {
    const restore = this.prependRestore;
    const item = restore === null ? undefined : this.items.get(restore.key);
    if (!restore || !item) return false;
    const delta = item.y - this.scrollY - restore.viewportTop;
    if (Math.abs(delta) <= SAME_POSITION) return false;
    this.scrollY += delta;
    this.scrollView?.scrollTo({ y: this.scrollY, animated: false });
    restore.viewportTop = item.y - this.scrollY;
    this.commitScrollState();
    this.scheduleVisibility();
    return true;
  }

  /** Remembers the first row on screen and where it sits, which a prepend keeps in place. */
  private rememberTopItem(): void {
    const top = this.orderedItems().find(
      (item) =>
        item.messageId !== undefined &&
        item.y + item.height > this.scrollY &&
        item.y < this.scrollY + this.viewportHeight,
    );
    this.prependRestore = top ? { key: top.key, viewportTop: top.y - this.scrollY } : null;
  }

  private commitScrollState(): void {
    const threshold = this.config.scrollEdgeThreshold;
    const edges =
      this.viewportHeight === 0
        ? NO_EDGES
        : {
            start: this.scrollY > threshold,
            end: this.contentHeight - this.scrollY - this.viewportHeight > threshold,
          };
    const scrolledUp = this.scrollY < this.lastScrollY - SAME_POSITION;
    this.lastScrollY = this.scrollY;
    if (this.config.autoScroll && !edges.end && this.mode !== 'settling-jump' && this.mode !== 'anchored-to-message') {
      this.mode = 'following-bottom';
    } else if (this.mode === 'following-bottom' && edges.end && scrolledUp && !this.autoscrolling) {
      this.mode = 'free-scrolling';
    }
    this.scrollable.setSnapshot(this.mode === 'following-bottom' ? { ...edges, end: false } : edges);
  }

  private scheduleVisibility(): void {
    if (!this.visibility.hasListeners() || this.visibilityFrame !== null) return;
    this.visibilityFrame = requestAnimationFrame(() => {
      this.visibilityFrame = null;
      if (this.visibility.hasListeners()) this.visibility.setSnapshot(this.measureVisibility());
    });
  }

  private measureVisibility(): MessageScrollerVisibilityState {
    const edge = this.config.scrollMargin + this.config.scrollPreviousItemPeek;
    const visibleMessageIds: string[] = [];
    let currentAnchorId: string | null = null;
    for (const item of this.orderedItems()) {
      if (item.messageId === undefined) continue;
      const top = item.y - this.scrollY;
      if (top + item.height > edge && top < this.viewportHeight) visibleMessageIds.push(item.messageId);
      if (item.anchor && top <= edge + SAME_POSITION) currentAnchorId = item.messageId;
    }
    return visibleMessageIds.length === 0 && currentAnchorId === null
      ? NO_VISIBILITY
      : { currentAnchorId, visibleMessageIds };
  }

  /** Visibility is measured only while something reads it, as upstream's observer runs only then. */
  subscribeVisibility = (listener: () => void): (() => void) => {
    const unsubscribe = this.visibility.subscribe(listener);
    this.scheduleVisibility();
    return () => {
      unsubscribe();
      if (!this.visibility.hasListeners()) this.visibility.setSnapshot(NO_VISIBILITY);
    };
  };

  private queueAnnouncements(added: readonly ItemRecord[]): void {
    if (Platform.OS === 'web') return;
    this.unannounced.push(...added.map((item) => item.key));
    if (!this.busy) this.announceAdditions();
  }

  // The web reads the content as a log, which announces the rows added to it; a device has no log role, so
  // each added row is told to the screen reader instead. A row added with no text yet, such as a reply about to
  // stream, waits until it has some.
  private announceAdditions(): void {
    const texts: string[] = [];
    this.unannounced = this.unannounced.filter((key) => {
      const item = this.items.get(key);
      if (item?.text) texts.push(item.text);
      return item !== undefined && item.text === '';
    });
    if (texts.length > 0) AccessibilityInfo.announceForAccessibility(texts.join('\n'));
  }
}

const MessageScrollerContext = createContext<MessageScrollerEngine | null>(null);

function useEngine(part: string): MessageScrollerEngine {
  const engine = useContext(MessageScrollerContext);
  if (!engine) throw new Error(`${part} must be used within a MessageScrollerProvider.`);
  return engine;
}

/**
 * The commands that move the transcript, for a control anywhere inside the MessageScrollerProvider:
 * `scrollToEnd` and `scrollToStart`, and `scrollToMessage`, which scrolls to the MessageScrollerItem with that
 * `messageId`. `scrollToMessage` queues a target asked for before any row has mounted, and returns false when
 * rows have mounted and none has the id. Scrolling to the end takes up following again under `autoScroll`.
 */
function useMessageScroller(): {
  scrollToEnd: (options?: MessageScrollerScrollOptions) => boolean;
  scrollToMessage: (messageId: string, options?: MessageScrollerScrollOptions) => boolean;
  scrollToStart: (options?: MessageScrollerScrollOptions) => boolean;
} {
  const { scrollToEnd, scrollToMessage, scrollToStart } = useEngine('useMessageScroller');
  return useMemo(
    () => ({ scrollToEnd, scrollToMessage, scrollToStart }),
    [scrollToEnd, scrollToMessage, scrollToStart],
  );
}

/** The edges the viewport can still scroll toward; `end` reads false while it follows the end under `autoScroll`. */
function useMessageScrollerScrollable(): MessageScrollerScrollable {
  const { scrollable } = useEngine('useMessageScrollerScrollable');
  return useSyncExternalStore(scrollable.subscribe, scrollable.getSnapshot, scrollable.getSnapshot);
}

/**
 * The anchored turn the reader is in and the rows on screen, by `messageId`. Rows are measured only while a
 * component reads this.
 */
function useMessageScrollerVisibility(): MessageScrollerVisibilityState {
  const engine = useEngine('useMessageScrollerVisibility');
  return useSyncExternalStore(engine.subscribeVisibility, engine.visibility.getSnapshot, engine.visibility.getSnapshot);
}

type MessageScrollerProviderProps = {
  children?: ReactNode;
  /** Follows the end as rows are added and grow while the reader is there. Off by default. */
  autoScroll?: boolean;
  /** Where the transcript opens: `end` by default. */
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition;
  /** How near an edge, in px, counts as at it; 8 by default. */
  scrollEdgeThreshold?: number;
  /** How much of the row before an anchored turn stays in view above it, in px; 64 by default. */
  scrollPreviousItemPeek?: number;
  /** Room left between a row scrolled to and the viewport's edge, in px; 0 by default. */
  scrollMargin?: number;
};

/**
 * Holds the scroll state of one transcript. The MessageScroller inside it draws the transcript, and the hooks
 * read it and move it from any component inside, such as a jump menu beside the scroller.
 */
function MessageScrollerProvider({
  children,
  autoScroll = false,
  defaultScrollPosition = 'end',
  scrollEdgeThreshold = SCROLL_EDGE_THRESHOLD,
  scrollPreviousItemPeek = SCROLL_PREVIOUS_ITEM_PEEK,
  scrollMargin = 0,
}: MessageScrollerProviderProps): ReactNode {
  const config = { autoScroll, defaultScrollPosition, scrollEdgeThreshold, scrollPreviousItemPeek, scrollMargin };
  const [engine] = useState(() => new MessageScrollerEngine(config));
  engine.configure(config);

  useEffect(() => () => engine.dispose(), [engine]);

  return <MessageScrollerContext.Provider value={engine}>{children}</MessageScrollerContext.Provider>;
}

/**
 * The frame of a transcript: a MessageScrollerViewport and a MessageScrollerButton over it. It fills the room
 * its parent gives it, so put it in a parent of a fixed height or one that grows.
 */
function MessageScroller({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  useEngine('MessageScroller');
  return <View className={cn('relative min-h-0 w-full flex-1 flex-col overflow-hidden', className)} {...props} />;
}

type MessageScrollerViewportProps = ComponentProps<typeof ScrollView> & {
  /** Keeps the rows on screen in place when earlier rows are added above them. On by default. */
  preserveScrollOnPrepend?: boolean;
};

/** The web-only props React Native Web's ScrollView takes, by which the reader scrolls it themselves. */
type WebScrollIntentProps = {
  onWheel?: () => void;
  onKeyDown?: (event: { nativeEvent: object }) => void;
  onTouchMove?: () => void;
};

/**
 * The scrolling region, named "Messages" unless given another `aria-label`, and focusable on the web so the
 * keyboard scrolls it. It stays hidden until the transcript has opened at its `defaultScrollPosition`, so the
 * reader does not see it jump there.
 */
function MessageScrollerViewport({
  className,
  style,
  preserveScrollOnPrepend = true,
  onScroll,
  onLayout,
  onScrollBeginDrag,
  'aria-label': ariaLabel = 'Messages',
  ...props
}: MessageScrollerViewportProps): ReactNode {
  const engine = useEngine('MessageScrollerViewport');
  engine.preserveScrollOnPrepend = preserveScrollOnPrepend;
  const pending = useSyncExternalStore(
    engine.pendingDefaultScroll.subscribe,
    engine.pendingDefaultScroll.getSnapshot,
    engine.pendingDefaultScroll.getSnapshot,
  );
  const setScrollView = useCallback(
    (scrollView: ScrollViewInstance | null) => {
      engine.scrollView = scrollView;
    },
    [engine],
  );
  const webIntent: WebScrollIntentProps =
    Platform.OS === 'web'
      ? {
          onWheel: () => engine.userScrollIntent(),
          onTouchMove: () => engine.userScrollIntent(),
          onKeyDown: ({ nativeEvent }) => {
            const { key } = nativeEvent as { key?: string };
            if (key !== undefined && SCROLL_KEYS.has(key)) engine.userScrollIntent();
          },
        }
      : {};

  return (
    <ScrollView
      ref={setScrollView}
      role="region"
      aria-label={ariaLabel}
      tabIndex={Platform.OS === 'web' ? 0 : undefined}
      scrollEventThrottle={16}
      className={cn('min-h-0 w-full min-w-0 flex-1', className)}
      style={[pending && { opacity: 0 }, style]}
      onLayout={(event: LayoutChangeEvent) => {
        engine.layoutViewport(event.nativeEvent.layout.height);
        onLayout?.(event);
      }}
      onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        engine.scrolled(event.nativeEvent.contentOffset.y);
        onScroll?.(event);
      }}
      onScrollBeginDrag={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        engine.userScrollIntent();
        onScrollBeginDrag?.(event);
      }}
      {...webIntent}
      {...props}
    />
  );
}

/** The room under the content an anchored row needs to reach the top of the viewport. */
function MessageScrollerSpacer(): ReactNode {
  const engine = useEngine('MessageScrollerContent');
  const height = useSyncExternalStore(engine.spacer.subscribe, engine.spacer.getSnapshot, engine.spacer.getSnapshot);
  useLayoutEffect(() => {
    if (height === 0) engine.layoutSpacer(0);
  }, [engine, height]);
  if (height === 0) return null;
  return (
    <View
      aria-hidden
      style={{ height }}
      onLayout={(event: LayoutChangeEvent) => engine.layoutSpacer(event.nativeEvent.layout.height)}
    />
  );
}

/**
 * The transcript, a column of MessageScrollerItem rows. On the web it is a log, whose added rows a screen reader
 * announces; on a device each added row's text is announced. Give it `aria-busy` while a reply streams, and the
 * rows added meanwhile are announced once it clears.
 */
function MessageScrollerContent({
  className,
  onLayout,
  'aria-busy': ariaBusy,
  ...props
}: ComponentProps<typeof View>): ReactNode {
  const engine = useEngine('MessageScrollerContent');

  useEffect(() => {
    engine.setBusy(ariaBusy === true);
  }, [engine, ariaBusy]);

  // Children lay out and mount before their parent, so a transcript with no rows is known by now.
  useEffect(() => {
    engine.settleEmpty();
  }, [engine]);

  return (
    <>
      <View
        role="log"
        aria-live={Platform.OS === 'web' ? 'polite' : undefined}
        aria-busy={ariaBusy}
        className={cn('flex-col cn-message-scroller-content', className)}
        onLayout={(event: LayoutChangeEvent) => {
          engine.layoutContent(event.nativeEvent.layout.height);
          onLayout?.(event);
        }}
        {...props}
      />
      <MessageScrollerSpacer />
    </>
  );
}

type MessageScrollerItemProps = ComponentProps<typeof View> & {
  /** A stable id for the row, which `scrollToMessage`, prepends and visibility need. */
  messageId?: string;
  /** Marks the row that starts a turn: when it is added, the viewport brings it near the top. */
  scrollAnchor?: boolean;
};

/**
 * One row of the transcript, such as a message, a marker or a typing indicator. Wrap every row of the content
 * in one, so the scroller can measure it, anchor it, keep it in place and scroll to it. A device announces an
 * added row by its `aria-label` or `accessibilityLabel`, else by the text written inline among its children; a
 * row drawn by a component of its own, such as `<ChatMessage message={m} />`, needs the label to be announced.
 */
function MessageScrollerItem({
  className,
  messageId,
  scrollAnchor = false,
  onLayout,
  children,
  ...props
}: MessageScrollerItemProps): ReactNode {
  const engine = useEngine('MessageScrollerItem');
  const key = useId();
  const text = props['aria-label'] ?? props.accessibilityLabel ?? textOf(children, ' ');

  useLayoutEffect(() => {
    engine.registerItem(key, messageId, scrollAnchor, text);
  }, [engine, key, messageId, scrollAnchor, text]);

  useLayoutEffect(() => () => engine.unregisterItem(key), [engine, key]);

  return (
    <View
      className={cn('min-w-0 shrink-0', className)}
      onLayout={(event: LayoutChangeEvent) => {
        engine.layoutItem(key, event.nativeEvent.layout.y, event.nativeEvent.layout.height);
        onLayout?.(event);
      }}
      {...props}
    >
      {children}
    </View>
  );
}

/** Upstream's 200ms way in, on its ease-out curve, and its 400ms way out, on its ease-in curve. */
const BUTTON_IN = { duration: 200, easing: Easing.bezier(0.23, 1, 0.32, 1) } as const;
const BUTTON_OUT = { duration: 400, easing: Easing.bezier(0.7, 0, 0.84, 0) } as const;

/** The viewport's element on the web, which focus can move to. */
type WebFocusable = { focus?: (options?: { preventScroll?: boolean }) => void };

type MessageScrollerButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  /** The edge it scrolls to, `end` by default. */
  direction?: MessageScrollerButtonDirection;
  /** `smooth` by default; a jump while the system asks for reduced motion. */
  behavior?: MessageScrollerScrollBehavior;
  /** Its content; an arrow named "Scroll to end" or "Scroll to start" by default. */
  children?: ReactNode;
};

/**
 * A button over the viewport's bottom edge, or its top for `direction="start"`, that scrolls to that edge. It
 * shows only while there is more transcript that way: it rises and fades in, and sinks and fades out when
 * there is not, when it takes no press and no focus and is hidden from screen readers. It appears, goes and
 * scrolls at once when the system asks for reduced motion.
 */
function MessageScrollerButton({
  direction = 'end',
  behavior = 'smooth',
  variant = 'secondary',
  size = 'icon-sm',
  className,
  children,
  onPress,
  'aria-label': ariaLabel,
  ...props
}: MessageScrollerButtonProps): ReactNode {
  const engine = useEngine('MessageScrollerButton');
  const scrollable = useSyncExternalStore(
    engine.scrollable.subscribe,
    engine.scrollable.getSnapshot,
    engine.scrollable.getSnapshot,
  );
  const active = direction === 'start' ? scrollable.start : scrollable.end;
  const reduced = useReducedMotion();
  const shown = useSharedValue(active ? 1 : 0);
  const height = useSharedValue(0);
  const away = direction === 'start' ? -1 : 1;
  const motion = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * height.value * away }, { scale: 0.95 + shown.value * 0.05 }],
  }));

  useEffect(() => {
    const target = active ? 1 : 0;
    shown.value = reduced ? target : withTiming(target, active ? BUTTON_IN : BUTTON_OUT);
  }, [active, reduced, shown]);

  return (
    <View
      pointerEvents="box-none"
      className={cn('absolute inset-x-0 items-center', direction === 'start' ? 'top-4' : 'bottom-4')}
    >
      <Animated.View
        style={[motion, { pointerEvents: active ? 'auto' : 'none' }]}
        onLayout={(event: LayoutChangeEvent) => {
          height.value = event.nativeEvent.layout.height;
        }}
      >
        <Button
          variant={variant}
          size={size}
          aria-label={ariaLabel ?? (children === undefined ? `Scroll to ${direction}` : undefined)}
          aria-hidden={!active}
          focusable={active}
          tabIndex={active ? 0 : -1}
          className={cn('border-border bg-background', className)}
          onPress={(event) => {
            if (!active) return;
            onPress?.(event);
            const scroll = { behavior: reduced ? ('auto' as const) : behavior };
            if (direction === 'start') engine.scrollToStart(scroll);
            else engine.scrollToEnd(scroll);
            // The button hides itself once the viewport is at the edge, so on the web focus moves to the viewport,
            // which stays, rather than staying on a button no key reaches. A browser cancels a smooth scroll of an
            // element focused without `preventScroll`.
            if (Platform.OS === 'web') {
              (engine.scrollView as unknown as WebFocusable | null)?.focus?.({ preventScroll: true });
            }
          }}
          {...props}
        >
          {children ?? <Icon as={ArrowDown} className={cn('text-foreground', direction === 'start' && 'rotate-180')} />}
        </Button>
      </Animated.View>
    </View>
  );
}

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
export type {
  MessageScrollerButtonDirection,
  MessageScrollerButtonProps,
  MessageScrollerDefaultScrollPosition,
  MessageScrollerItemProps,
  MessageScrollerProviderProps,
  MessageScrollerScrollable,
  MessageScrollerScrollAlign,
  MessageScrollerScrollBehavior,
  MessageScrollerScrollOptions,
  MessageScrollerViewportProps,
  MessageScrollerVisibilityState,
};
