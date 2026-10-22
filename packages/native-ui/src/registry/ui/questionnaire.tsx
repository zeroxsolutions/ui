import { Check } from 'lucide-react-native';
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { AccessibilityInfo, Platform, Pressable, View, type ViewStyle } from 'react-native';
import { useFocusVisible } from '../lib/focus-visible';
import { asText, textOf } from '../lib/text-children';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icon, IconClassContext } from './icon';
import { Input } from './input';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state, such as `@checked` on a chosen choice; the
// registry build replaces each with the classes translated for the target engine.

/** Where a question stands: no answer yet, an answer given, or skipped. */
type QuestionnaireItemStatus = 'unanswered' | 'answered' | 'skipped';
/** The keys that pick a choice on the web, A to Z or 1 to 9. */
type QuestionnaireShortcutMode = 'letters' | 'numbers';
type QuestionnaireChoiceDefinition = { disabled?: boolean; value: string };
/** A question as the Questionnaire's `items` lists it, which sets the order of the steps and of the shortcuts. */
type QuestionnaireItemDefinition = {
  choices?: readonly QuestionnaireChoiceDefinition[];
  disabled?: boolean;
  name: string;
  required?: boolean;
};
/** Each answered question's answer by its `name`: a string, or the list of strings of a `multiple` one. */
type QuestionnaireValues = Record<string, string | string[]>;

/** Every way a Questionnaire can get from one question to another, or finish. */
interface QuestionnaireRootContextValue {
  current: number;
  first: boolean;
  last: boolean;
  total: number;
  activeItemName: string | null;
  activeItemRequired: boolean | null;
  activeItemStatus: QuestionnaireItemStatus | null;
  shortcuts: QuestionnaireShortcutMode | null;
  definitionOf: (name: string) => QuestionnaireItemDefinition | undefined;
  registerItem: (name: string, handle: RefObject<ItemHandle>) => () => void;
  updateItem: (summary: ItemSummary) => void;
  goNext: () => void;
  goPrevious: () => void;
  /** Goes on, or submits from the last question, once the question shown can be left. */
  advance: () => void;
  skipCurrent: () => void;
  submit: () => void;
  /**
   * Answers a web key the Questionnaire handles: Ctrl or Cmd with Enter, the side arrows and the shortcuts.
   * @param typing - whether the key went down in a text field, which keeps its arrows and letters
   */
  handleKey: (event: WebKeyEvent, typing: boolean) => void;
}

/** What the Questionnaire knows of a rendered QuestionnaireItem, which it re-renders on. */
interface ItemSummary {
  name: string;
  disabled: boolean;
  required: boolean;
  status: QuestionnaireItemStatus;
  /** The rendered choices in order, each disabled by its own prop, which the development warnings compare. */
  choices: QuestionnaireChoiceDefinition[];
}

/** What the Questionnaire asks of a rendered QuestionnaireItem. */
interface ItemHandle {
  /** Shows the item's error if it cannot be left yet, and says whether it can. */
  validate: () => boolean;
  /** Clears the answer and marks the item skipped. */
  skip: () => void;
  /** The item's answer, or undefined when it has none. */
  value: () => string | string[] | undefined;
  /** Focuses the choice a shortcut key names, and picks it unless the key repeats; false when no choice has it. */
  chooseByShortcut: (key: string, repeat: boolean) => boolean;
  /** Moves focus to the item, the keyboard's on the web and the screen reader's on a device. */
  focus: () => void;
}

/** One answer control in an item: a choice, or the free-text input. */
interface AnswerRecord {
  id: string;
  type: 'choice' | 'input';
  value: string;
  /** Disabled by its own prop or by its item's. */
  disabled: boolean;
  /** Disabled by its own prop. */
  ownDisabled: boolean;
}

/** What an item does to one of its answers from the keyboard. */
interface AnswerControl {
  focus: () => void;
  /** What a press does: picks a choice, or toggles it in a `multiple` question. Nothing for the input. */
  press: () => void;
}

/** Which way an arrow key moves through a question's answers. */
type AnswerDirection = 'next' | 'previous';

interface QuestionnaireItemContextValue {
  name: string;
  multiple: boolean;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
  status: QuestionnaireItemStatus;
  selected: readonly string[];
  shortcutOf: (id: string, value: string) => string | null;
  /** Adds the answer, or updates it, picking it if it is picked at first. */
  registerAnswer: (answer: AnswerRecord, selectedAtFirst: boolean) => void;
  unregisterAnswer: (id: string) => void;
  /** Lets the item focus and press the answer from the keyboard. */
  registerControl: (id: string, control: AnswerControl) => () => void;
  /**
   * Moves focus to the answer before or after the one with `from`, wrapping, and picks it when it is a radio; from
   * the question itself (`null`), to its picked answer, or else its first or last. From a radio it moves among the
   * radios alone, as a browser's radio group does. False when there is nowhere to move.
   */
  moveFocus: (from: string | null, direction: AnswerDirection) => boolean;
  select: (id: string, on: boolean) => void;
  setHasDescription: (has: boolean) => void;
  hasDescription: boolean;
  setTitle: (title: string, ref: RefObject<ViewRef | null>) => void;
}

const QuestionnaireRootContext = createContext<QuestionnaireRootContextValue | null>(null);
const QuestionnaireItemContext = createContext<QuestionnaireItemContextValue | null>(null);
/** Whether a QuestionnaireChoice holds a QuestionnaireChoiceDescription, which sets its indicator lower. */
const QuestionnaireChoiceContext = createContext<((has: boolean) => void) | null>(null);

function useRoot(part: string): QuestionnaireRootContextValue {
  const root = useContext(QuestionnaireRootContext);
  if (!root) throw new Error(`${part} must be used within a Questionnaire.`);
  return root;
}

function useItem(part: string): QuestionnaireItemContextValue {
  const item = useContext(QuestionnaireItemContext);
  if (!item) throw new Error(`${part} must be used within a QuestionnaireItem.`);
  return item;
}

function shortcutKeys(mode: QuestionnaireShortcutMode | null): string[] {
  if (mode === 'letters') return Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
  if (mode === 'numbers') return Array.from({ length: 9 }, (_, index) => String(index + 1));
  return [];
}

/**
 * A question is focused from script as a step lands on it, which the browser would otherwise outline. Its outline
 * style is `auto`, which ignores a width, and React Native's style type has no `none`, which React Native Web passes on.
 */
const NO_FOCUS_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined) as ViewStyle | undefined;

/** A drawn view, which focus can be moved to. */
type ViewRef = ComponentRef<typeof View>;

/** A key event as React Native Web hands it to a View, a Pressable or a TextInput. */
type WebKeyEvent = {
  nativeEvent: object;
  target?: unknown;
  currentTarget?: unknown;
  preventDefault: () => void;
  stopPropagation?: () => void;
};

/** The parts of a browser's key event the Questionnaire reads. */
type KeyPress = {
  key?: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  isComposing?: boolean;
  keyCode?: number;
  target?: { tagName?: string };
};

/** The key pressed, or undefined while an input method is composing text, which owns its keys. */
function readKey(event: WebKeyEvent): KeyPress | undefined {
  const press = event.nativeEvent as KeyPress;
  if (press.key === undefined || press.isComposing || press.keyCode === 229) return undefined;
  return press;
}

/** Whether a handler called earlier asked that the part's own handling be skipped, as upstream reads it. */
function defaultPrevented(event: unknown): boolean {
  const synthetic = event as { isDefaultPrevented?: () => boolean; defaultPrevented?: boolean };
  return synthetic.isDefaultPrevented?.() ?? synthetic.defaultPrevented ?? false;
}

const modified = (press: KeyPress): boolean => Boolean(press.metaKey || press.ctrlKey || press.altKey);

/** `aria-keyshortcuts` on the web, which React Native's own prop types do not list; nothing on a device. */
function keyShortcuts(...keys: (string | false | null | undefined)[]): object {
  const value = keys.filter(Boolean).join(' ');
  return Platform.OS === 'web' && value ? { 'aria-keyshortcuts': value } : {};
}

/** What upstream warns of in development where `items` and the rendered questions disagree. */
function definitionWarnings(items: readonly QuestionnaireItemDefinition[], defaultItem: string | undefined): string[] {
  const warnings: string[] = [];
  const names = new Set<string>();
  for (const item of items) {
    if (names.has(item.name)) warnings.push(`Item name "${item.name}" is defined more than once.`);
    names.add(item.name);
    const values = new Set<string>();
    for (const choice of item.choices ?? []) {
      if (values.has(choice.value)) {
        warnings.push(`Choice value "${choice.value}" is defined more than once in item "${item.name}".`);
      }
      values.add(choice.value);
    }
  }
  if (defaultItem !== undefined) {
    const chosen = items.find((item) => item.name === defaultItem);
    if (!chosen || chosen.disabled) {
      warnings.push(
        `defaultItem "${defaultItem}" does not identify an enabled item. The first enabled item will be used instead.`,
      );
    }
  }
  return warnings;
}

function renderWarnings(
  items: readonly QuestionnaireItemDefinition[],
  rendered: readonly ItemSummary[],
  shortcuts: QuestionnaireShortcutMode | undefined,
): string[] {
  const warnings: string[] = [];
  const byName = new Map(rendered.map((summary) => [summary.name, summary]));
  for (const item of items) {
    const summary = byName.get(item.name);
    if (!summary) {
      if (!item.disabled) warnings.push(`Item "${item.name}" is defined but has no rendered QuestionnaireItem.`);
      continue;
    }
    if (summary.disabled !== Boolean(item.disabled)) {
      warnings.push(`Item "${item.name}" has different disabled values in items and QuestionnaireItem.`);
    }
    if (summary.required !== Boolean(item.required)) {
      warnings.push(`Item "${item.name}" has different required values in items and QuestionnaireItem.`);
    }
    const defined = item.choices ?? [];
    const definedValues = new Set(defined.map((choice) => choice.value));
    const drawn = new Map(summary.choices.map((choice) => [choice.value, choice]));
    for (const choice of defined) {
      const match = drawn.get(choice.value);
      if (!match) {
        warnings.push(
          `Choice "${choice.value}" is defined for item "${item.name}" but has no rendered QuestionnaireChoice.`,
        );
      } else if (Boolean(match.disabled) !== Boolean(choice.disabled)) {
        warnings.push(
          `Choice "${choice.value}" in item "${item.name}" has different disabled values in items and QuestionnaireChoice.`,
        );
      }
    }
    if (shortcuts === undefined) continue;
    for (const choice of summary.choices) {
      if (!definedValues.has(choice.value)) {
        warnings.push(
          `Rendered choice "${choice.value}" in item "${item.name}" is missing from items and will not receive a shortcut.`,
        );
      }
    }
    const definedOrder = defined.filter((choice) => !choice.disabled).map((choice) => choice.value);
    const drawnOrder = summary.choices.filter((choice) => !choice.disabled).map((choice) => choice.value);
    if (
      definedOrder.length > 0 &&
      definedOrder.length === drawnOrder.length &&
      definedOrder.every((value) => drawnOrder.includes(value)) &&
      definedOrder.some((value, at) => value !== drawnOrder[at])
    ) {
      warnings.push(
        `Choice order for item "${item.name}" differs between items and the rendered QuestionnaireChoice elements.`,
      );
    }
  }
  for (const summary of rendered) {
    if (!summary.disabled && !items.some((item) => item.name === summary.name)) {
      warnings.push(
        `Rendered item "${summary.name}" is missing from items and is excluded from the questionnaire collection.`,
      );
    }
  }
  return warnings;
}

type QuestionnaireProps = Omit<ComponentProps<typeof View>, 'onSubmit'> & {
  /** The questions in order; without it, the rendered QuestionnaireItems in the order they mount. */
  items?: readonly QuestionnaireItemDefinition[];
  /** The `name` of the question shown; give it with `onItemChange` to control the step. */
  item?: string;
  /** The `name` of the question shown first; the first enabled one by default. */
  defaultItem?: string;
  /** Called with the `name` of the question about to be shown. */
  onItemChange?: (item: string) => void;
  /** Gives each choice a key on the web, and shows it on the choice. */
  shortcuts?: QuestionnaireShortcutMode;
  /** Called with the answers once every question can be left: answered, or skipped where it may be. */
  onSubmit?: (values: QuestionnaireValues) => void;
};

/**
 * A form that asks one question at a time: a QuestionnaireProgress, a QuestionnaireItem per question, and
 * QuestionnaireActions to move between them. A required question cannot be left or skipped until answered. Submit
 * goes back to the first question that cannot be left yet and shows its error, or hands the answers to `onSubmit`.
 */
function Questionnaire({
  className,
  items,
  item,
  defaultItem,
  onItemChange,
  shortcuts,
  onSubmit,
  ...props
}: QuestionnaireProps): ReactNode {
  const definitions = useMemo(
    () => (items === undefined ? null : new Map(items.map((definition) => [definition.name, definition]))),
    [items],
  );
  const [summaries, setSummaries] = useState<ItemSummary[]>([]);
  const handles = useRef(new Map<string, RefObject<ItemHandle>>());
  const firstEnabled = items?.find((definition) => !definition.disabled)?.name ?? null;
  const [uncontrolledItem, setUncontrolledItem] = useState<string | null>(() => {
    const chosen = defaultItem === undefined ? undefined : definitions?.get(defaultItem);
    if (definitions && (!chosen || chosen.disabled)) return firstEnabled;
    return defaultItem ?? null;
  });
  const currentName = item !== undefined ? item : uncontrolledItem;
  const order = items
    ? items.filter((definition) => !definition.disabled).map((definition) => definition.name)
    : summaries.filter((summary) => !summary.disabled).map((summary) => summary.name);
  const index = currentName === null ? -1 : order.indexOf(currentName);
  const total = order.length;
  const summary = summaries.find((entry) => entry.name === currentName);
  const activeItemRequired =
    index < 0 ? null : (definitions?.get(currentName ?? '')?.required ?? summary?.required ?? false);
  const activeItemStatus = index < 0 ? null : (summary?.status ?? 'unanswered');
  // The question a step is moving to, which takes focus once it shows.
  const focusTarget = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const change = useCallback(
    (name: string) => {
      if (name === currentName) return;
      focusTarget.current = name;
      if (item === undefined) setUncontrolledItem(name);
      onItemChange?.(name);
    },
    [currentName, item, onItemChange],
  );

  useLayoutEffect(() => {
    if (total === 0 || index >= 0) return;
    if (item === undefined && currentName === null) setUncontrolledItem(order[0]);
    else change(order[0]);
  }, [total, index, item, currentName, order, change]);

  useEffect(() => {
    const target = focusTarget.current;
    if (target === null || target !== currentName) return;
    focusTarget.current = null;
    handles.current.get(target)?.current.focus();
  }, [currentName]);

  const handleOf = (name: string | null): ItemHandle | undefined =>
    name === null ? undefined : handles.current.get(name)?.current;

  const submit = (): void => {
    for (const name of order) {
      const handle = handleOf(name);
      if (handle && !handle.validate()) {
        if (name === currentName) handle.focus();
        else change(name);
        return;
      }
    }
    const values: QuestionnaireValues = {};
    for (const name of order) {
      const value = handleOf(name)?.value();
      if (value !== undefined) values[name] = value;
    }
    onSubmit?.(values);
  };

  // A skip of the last question finishes once the skip has rendered, so the answers read it.
  useEffect(() => {
    if (!submitting) return;
    setSubmitting(false);
    submit();
  });

  // Each warning once while it holds. The items render and report their choices in the commits after this one,
  // which cancel the check queued here before it runs.
  const warned = useRef(new Set<string>());
  useEffect(() => {
    if (!__DEV__) return;
    if (!items) {
      warned.current.clear();
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const now = new Set([...definitionWarnings(items, defaultItem), ...renderWarnings(items, summaries, shortcuts)]);
      for (const warning of now) {
        if (!warned.current.has(warning)) console.warn(`[Questionnaire] ${warning}`);
      }
      warned.current = now;
    });
    return () => {
      cancelled = true;
    };
  }, [items, defaultItem, summaries, shortcuts]);

  const goPrevious = (): void => {
    if (index > 0) change(order[index - 1]);
  };
  const goNext = (): void => {
    const handle = handleOf(currentName);
    if (!handle || index >= total - 1) return;
    if (!handle.validate()) {
      handle.focus();
      return;
    }
    change(order[index + 1]);
  };
  const advance = (): void => {
    const handle = handleOf(currentName);
    if (!handle) return;
    if (!handle.validate()) {
      handle.focus();
      return;
    }
    if (index === total - 1) submit();
    else change(order[index + 1]);
  };
  const skipCurrent = (): void => {
    const handle = handleOf(currentName);
    if (!handle || activeItemRequired !== false) return;
    handle.skip();
    if (index < total - 1) change(order[index + 1]);
    else setSubmitting(true);
  };

  const registerItem = useCallback((name: string, handle: RefObject<ItemHandle>) => {
    handles.current.set(name, handle);
    return () => {
      if (handles.current.get(name) === handle) handles.current.delete(name);
      setSummaries((current) => current.filter((entry) => entry.name !== name));
    };
  }, []);
  const updateItem = useCallback((next: ItemSummary) => {
    setSummaries((current) => {
      const at = current.findIndex((entry) => entry.name === next.name);
      if (at < 0) return [...current, next];
      const known = current[at];
      if (
        known.disabled === next.disabled &&
        known.required === next.required &&
        known.status === next.status &&
        known.choices.length === next.choices.length &&
        known.choices.every(
          (choice, position) =>
            choice.value === next.choices[position].value && choice.disabled === next.choices[position].disabled,
        )
      ) {
        return current;
      }
      return current.map((entry, position) => (position === at ? next : entry));
    });
  }, []);

  // The keys the web answers here: Enter with Ctrl or Cmd to go on, the side arrows to step, and a choice's
  // shortcut. Enter on an answer and the arrows between answers are the answers' own.
  const handleKey = (event: WebKeyEvent, typing: boolean): void => {
    const press = readKey(event);
    if (!press?.key) return;
    const { key, repeat } = press;
    if (key === 'Enter' && (press.metaKey || press.ctrlKey) && !press.altKey && !press.shiftKey) {
      event.preventDefault();
      if (!repeat) advance();
      return;
    }
    if (modified(press)) return;
    if ((key === 'ArrowLeft' || key === 'ArrowRight') && !typing) {
      event.preventDefault();
      if (repeat) return;
      if (key === 'ArrowLeft') goPrevious();
      else if (activeItemStatus !== 'unanswered') goNext();
      return;
    }
    if (typing || shortcuts === undefined) return;
    const shortcut = shortcuts === 'letters' ? key.toUpperCase() : key;
    if (!shortcutKeys(shortcuts).includes(shortcut)) return;
    if (handleOf(currentName)?.chooseByShortcut(shortcut, Boolean(repeat))) event.preventDefault();
  };
  const webKeys =
    Platform.OS === 'web'
      ? ({
          onKeyDown: (event: WebKeyEvent) => {
            const tag = (event.nativeEvent as KeyPress).target?.tagName;
            handleKey(event, tag === 'INPUT' || tag === 'TEXTAREA');
          },
        } as object)
      : {};

  const context: QuestionnaireRootContextValue = {
    current: index < 0 ? 0 : index + 1,
    first: total > 0 && index === 0,
    last: total > 0 && index === total - 1,
    total,
    activeItemName: currentName,
    activeItemRequired,
    activeItemStatus,
    shortcuts: shortcuts ?? null,
    definitionOf: (name) => definitions?.get(name),
    registerItem,
    updateItem,
    goNext,
    goPrevious,
    advance,
    skipCurrent,
    submit,
    handleKey,
  };

  return (
    <QuestionnaireRootContext.Provider value={context}>
      <View role="form" className={cn('w-full min-w-0 flex-col cn-questionnaire', className)} {...webKeys} {...props} />
    </QuestionnaireRootContext.Provider>
  );
}

/**
 * Which question is shown, as "Question 2 of 3" unless given its own children, announced as a progress bar and
 * read out as it changes.
 */
function QuestionnaireProgress({ className, children, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { current, total } = useRoot('QuestionnaireProgress');
  const text = total ? `Question ${current} of ${total}` : undefined;
  const announced = useRef(text);

  // A live region is Android's alone; iOS announces only what it is told to.
  useEffect(() => {
    if (text === announced.current) return;
    announced.current = text;
    if (text && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  return (
    <Text
      role="progressbar"
      aria-label="Questionnaire progress"
      aria-live="polite"
      aria-valuemin={total ? 1 : undefined}
      aria-valuemax={total || undefined}
      aria-valuenow={total ? current : undefined}
      aria-valuetext={text}
      className={cn(
        'self-start text-muted-foreground font-sans-medium tabular-nums cn-questionnaire-progress/text',
        className,
      )}
      {...props}
    >
      {children ?? text}
    </Text>
  );
}

type QuestionnaireItemProps = ComponentProps<typeof View> & {
  /** The question's name, which its answer is handed to `onSubmit` under and `item` names it by. */
  name: string;
  /** Lets several choices be picked, each a checkbox; otherwise one, each a radio. */
  multiple?: boolean;
  /** Keeps the question from being left or skipped until it is answered. */
  required?: boolean;
  /** Shows the question's error whatever its answer. */
  invalid?: boolean;
  /** Leaves the question out of the steps. */
  disabled?: boolean;
  /** Called as the question becomes answered, skipped or unanswered. */
  onStatusChange?: (status: QuestionnaireItemStatus) => void;
};

/**
 * One question: a QuestionnaireTitle, a QuestionnaireDescription, QuestionnaireChoices and a QuestionnaireError.
 * Only the question shown is drawn; the others keep their answers while hidden.
 */
function QuestionnaireItem({
  className,
  name,
  multiple = false,
  required = false,
  invalid = false,
  disabled = false,
  onStatusChange,
  children,
  style,
  ...props
}: QuestionnaireItemProps): ReactNode {
  const root = useRoot('QuestionnaireItem');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [title, setTitleText] = useState('');
  const titleRef = useRef<RefObject<ViewRef | null> | null>(null);
  const viewRef = useRef<ViewRef>(null);
  const controls = useRef(new Map<string, AnswerControl>());

  const enabledAnswers = answers.filter((answer) => !answer.disabled && !disabled);
  const answered = enabledAnswers.some((answer) => selected.includes(answer.id));
  const status: QuestionnaireItemStatus = skipped ? 'skipped' : answered ? 'answered' : 'unanswered';
  const skippedOptional = status === 'skipped' && !required;
  const valid = disabled || skippedOptional || (!invalid && status === 'answered');
  const shownInvalid = !disabled && !skippedOptional && (invalid || (attempted && !valid));
  const active = !disabled && root.activeItemName === name;

  const reported = useRef(status);
  useLayoutEffect(() => {
    if (reported.current === status) return;
    reported.current = status;
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const select = useCallback(
    (id: string, on: boolean) => {
      setSkipped(false);
      setSelected((current) => {
        if (!on) return current.filter((entry) => entry !== id);
        if (!multiple) return [id];
        return current.includes(id) ? current : [...current, id];
      });
    },
    [multiple],
  );

  const registerAnswer = useCallback(
    (answer: AnswerRecord, selectedAtFirst: boolean) => {
      let added = false;
      setAnswers((current) => {
        const at = current.findIndex((entry) => entry.id === answer.id);
        added = at < 0;
        return added ? [...current, answer] : current.map((entry, position) => (position === at ? answer : entry));
      });
      if (selectedAtFirst) {
        setSelected((current) => {
          if (!added || current.includes(answer.id)) return current;
          if (multiple) return [...current, answer.id];
          return current.length ? current : [answer.id];
        });
      }
    },
    [multiple],
  );

  const unregisterAnswer = useCallback((id: string) => {
    setAnswers((current) => current.filter((entry) => entry.id !== id));
    setSelected((current) => current.filter((entry) => entry !== id));
  }, []);

  const registerControl = useCallback((id: string, control: AnswerControl) => {
    controls.current.set(id, control);
    return () => {
      if (controls.current.get(id) === control) controls.current.delete(id);
    };
  }, []);

  const moveFocus = (from: string | null, direction: AnswerDirection): boolean => {
    if (enabledAnswers.length === 0) return false;
    const radios = !multiple;
    let target: AnswerRecord | undefined;
    if (from === null) {
      target =
        enabledAnswers.find((answer) => selected.includes(answer.id)) ??
        (direction === 'next' ? enabledAnswers[0] : enabledAnswers[enabledAnswers.length - 1]);
    } else {
      const origin = enabledAnswers.find((answer) => answer.id === from);
      if (!origin) return false;
      const pool =
        radios && origin.type === 'choice'
          ? enabledAnswers.filter((answer) => answer.type === 'choice')
          : enabledAnswers;
      const at = pool.indexOf(origin);
      target = pool[(at + (direction === 'next' ? 1 : -1) + pool.length) % pool.length];
    }
    if (!target || target.id === from) return false;
    const control = controls.current.get(target.id);
    control?.focus();
    if (radios && target.type === 'choice') control?.press();
    return true;
  };

  // A question turned from several answers to one keeps only the first.
  useLayoutEffect(() => {
    if (!multiple) setSelected((current) => (current.length > 1 ? current.slice(0, 1) : current));
  }, [multiple]);

  const definition = root.definitionOf(name);
  const keys = shortcutKeys(root.shortcuts);
  const shortcutOf = (id: string, value: string): string | null => {
    if (keys.length === 0) return null;
    const choices = definition?.choices
      ? definition.choices.filter((choice) => !choice.disabled).map((choice) => choice.value)
      : enabledAnswers.filter((answer) => answer.type === 'choice').map((answer) => answer.id);
    const at = choices.indexOf(definition?.choices ? value : id);
    return at < 0 ? null : (keys[at] ?? null);
  };

  const handle = useRef<ItemHandle>(null as unknown as ItemHandle);
  handle.current = {
    validate: () => {
      setAttempted(true);
      return valid;
    },
    skip: () => {
      if (required) return;
      setSelected([]);
      setSkipped(true);
    },
    value: () => {
      if (skipped || disabled) return undefined;
      const values = enabledAnswers.filter((answer) => selected.includes(answer.id)).map((answer) => answer.value);
      return multiple ? values : values[0];
    },
    chooseByShortcut: (key, repeat) => {
      const choice = enabledAnswers.find(
        (answer) => answer.type === 'choice' && shortcutOf(answer.id, answer.value) === key,
      );
      if (!choice) return false;
      if (repeat) return true;
      const control = controls.current.get(choice.id);
      control?.focus();
      control?.press();
      return true;
    },
    focus: () => {
      if (Platform.OS === 'web') {
        (viewRef.current as unknown as { focus?: () => void } | null)?.focus?.();
        return;
      }
      const target = titleRef.current?.current ?? viewRef.current;
      if (target) AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
    },
  };

  const { registerItem, updateItem } = root;
  useLayoutEffect(() => registerItem(name, handle), [registerItem, name]);
  useLayoutEffect(() => {
    const choices = answers
      .filter((answer) => answer.type === 'choice')
      .map((answer) => ({ value: answer.value, disabled: answer.ownDisabled }));
    updateItem({ name, disabled, required, status, choices });
  }, [updateItem, name, disabled, required, status, answers]);

  const setTitle = useCallback((text: string, ref: RefObject<ViewRef | null>) => {
    setTitleText(text);
    titleRef.current = ref;
  }, []);

  const context: QuestionnaireItemContextValue = {
    name,
    multiple,
    required,
    disabled,
    invalid: shownInvalid,
    status,
    selected: skipped ? [] : selected,
    shortcutOf,
    registerAnswer,
    unregisterAnswer,
    registerControl,
    moveFocus,
    select,
    setHasDescription,
    hasDescription,
    setTitle,
  };

  // Focused itself as a step lands on it, the question moves focus into its answers with the up and down arrows.
  const webKeys =
    Platform.OS === 'web'
      ? ({
          onKeyDown: (event: WebKeyEvent) => {
            const press = readKey(event);
            if (event.target !== event.currentTarget || !press || modified(press)) return;
            if (press.key !== 'ArrowUp' && press.key !== 'ArrowDown') return;
            if (moveFocus(null, press.key === 'ArrowDown' ? 'next' : 'previous')) event.preventDefault();
          },
        } as object)
      : {};

  return (
    <QuestionnaireItemContext.Provider value={context}>
      <View
        ref={viewRef}
        role={multiple ? 'group' : 'radiogroup'}
        aria-label={title || undefined}
        aria-hidden={!active || undefined}
        tabIndex={Platform.OS === 'web' ? -1 : undefined}
        {...keyShortcuts(
          active && 'Meta+Enter Control+Enter',
          active && enabledAnswers.length > 0 && 'ArrowUp ArrowDown',
          active && !root.first && 'ArrowLeft',
          active && !root.last && status !== 'unanswered' && 'ArrowRight',
        )}
        {...webKeys}
        className={cn('min-w-0 flex-col cn-questionnaire-item', !active && 'hidden', className)}
        style={[NO_FOCUS_OUTLINE, style]}
        {...props}
      >
        {children}
      </View>
    </QuestionnaireItemContext.Provider>
  );
}

/** The question itself, which names the question for screen readers and takes their focus when it is shown. */
function QuestionnaireTitle({ className, children, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { setTitle, hasDescription } = useItem('QuestionnaireTitle');
  const ref = useRef<ViewRef>(null);
  const text = textOf(children);

  useLayoutEffect(() => {
    setTitle(text, ref);
  }, [setTitle, text]);

  return (
    <Text
      ref={ref as never}
      className={cn(
        'cn-questionnaire-title/text',
        !hasDescription && 'cn-questionnaire-title@description=none',
        className,
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

/** A line under the title that says how to answer, in muted text. */
function QuestionnaireDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { setHasDescription } = useItem('QuestionnaireDescription');

  useLayoutEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  return <Text className={cn('text-muted-foreground cn-questionnaire-description/text', className)} {...props} />;
}

/** The question's choices, one under another, and its QuestionnaireInput. */
function QuestionnaireChoices({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  useItem('QuestionnaireChoices');
  return <View className={cn('min-w-0 flex-col cn-questionnaire-choices', className)} {...props} />;
}

type QuestionnaireChoiceProps = Omit<ComponentProps<typeof Pressable>, 'children' | 'onChange'> & {
  /** The answer this choice gives. */
  value: string;
  /** Whether it is picked; give it with `onChange` to control it. */
  checked?: boolean;
  /** Whether it is picked at first. */
  defaultChecked?: boolean;
  disabled?: boolean;
  /** Called with whether the choice is now picked, as a press picks or unpicks it. */
  onChange?: (checked: boolean) => void;
  /** Its label, and a QuestionnaireChoiceDescription under it. */
  children?: ReactNode;
};

/**
 * One answer, announced as a radio, or as a checkbox in a `multiple` question, and named by its text. A press picks
 * it, and in a `multiple` question a second press unpicks it. It is ringed while it holds focus from a keyboard,
 * and on the web shows the key that picks it when the Questionnaire has `shortcuts`. On the web, Space picks it,
 * Enter goes on once it is picked, and the arrows move to the next or previous answer, picking a radio. An
 * `onPress` or `onKeyDown` given to it runs first, and its own handling is skipped when that prevents the default.
 */
function QuestionnaireChoice({
  className,
  value,
  checked: checkedProp,
  defaultChecked = false,
  disabled: disabledProp = false,
  onChange,
  onFocus,
  onBlur,
  onPress,
  children,
  ref,
  ...rest
}: QuestionnaireChoiceProps): ReactNode {
  // A web key handler, which React Native's Pressable props do not list.
  const { onKeyDown, ...props } = rest as typeof rest & { onKeyDown?: (event: WebKeyEvent) => void };
  const root = useRoot('QuestionnaireChoice');
  const item = useItem('QuestionnaireChoice');
  const id = useId();
  const [hasDescription, setHasDescription] = useState(false);
  const { focusVisible, onFocus: focusChanged, onBlur: blurred } = useFocusVisible();
  const disabled = item.disabled || disabledProp;
  const controlled = checkedProp !== undefined;
  const checked = controlled ? item.status !== 'skipped' && checkedProp : item.selected.includes(id);
  const radio = !item.multiple;
  const shortcut = Platform.OS === 'web' ? item.shortcutOf(id, value) : null;
  const firstChecked = useRef(controlled ? checkedProp : defaultChecked);
  const pressable = useRef<ComponentRef<typeof Pressable>>(null);
  const { registerAnswer, unregisterAnswer, registerControl, select } = item;

  useLayoutEffect(() => {
    registerAnswer({ id, type: 'choice', value, disabled, ownDisabled: disabledProp }, firstChecked.current === true);
  }, [registerAnswer, id, value, disabled, disabledProp]);
  useLayoutEffect(() => () => unregisterAnswer(id), [unregisterAnswer, id]);

  const press = (): void => {
    const next = radio ? true : !checked;
    if (next === checked) return;
    onChange?.(next);
    if (!controlled) select(id, next);
    // A controlled choice its question skipped is still checked in the caller's state, so the change above
    // re-renders nothing; the press un-skips the question here instead.
    else if (item.status === 'skipped' && next === checkedProp) select(id, next);
  };
  const latestPress = useRef(press);
  latestPress.current = press;
  useLayoutEffect(
    () =>
      registerControl(id, {
        focus: () => (pressable.current as unknown as { focus?: () => void } | null)?.focus?.(),
        press: () => latestPress.current(),
      }),
    [registerControl, id],
  );
  const attach = useCallback(
    (node: ComponentRef<typeof Pressable> | null) => {
      pressable.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // React Native Web's press handling stops Enter on a Pressable from reaching the Questionnaire, and does not
  // press a radio or a checkbox for Space, so both are answered here. It lets a disabled one's keys through.
  const webKeys =
    Platform.OS === 'web'
      ? ({
          onKeyDown: (event: WebKeyEvent) => {
            onKeyDown?.(event);
            if (disabled || defaultPrevented(event)) return;
            const keyPress = readKey(event);
            if (!keyPress) return;
            const { key, repeat } = keyPress;
            if (key === 'Enter') {
              if (keyPress.metaKey || keyPress.ctrlKey) {
                root.handleKey(event, false);
                return;
              }
              if (keyPress.altKey) return;
              event.preventDefault();
              if (!repeat && checked) root.advance();
              return;
            }
            if (modified(keyPress)) return;
            if (key === ' ') {
              event.preventDefault();
              if (!repeat) press();
              return;
            }
            const vertical = key === 'ArrowUp' || key === 'ArrowDown';
            const sideways = radio && (key === 'ArrowLeft' || key === 'ArrowRight');
            if (!vertical && !sideways) return;
            const moved = item.moveFocus(id, key === 'ArrowDown' || key === 'ArrowRight' ? 'next' : 'previous');
            // The side arrows move between radios, as a browser's radio group does, and do not step the question.
            if (moved || sideways) {
              event.preventDefault();
              event.stopPropagation?.();
            }
          },
        } as object)
      : { onKeyDown };

  useLayoutEffect(() => {
    if (checkedProp === undefined) return;
    if (checkedProp) select(id, true);
    else select(id, false);
  }, [checkedProp, id, select]);

  return (
    <QuestionnaireChoiceContext.Provider value={setHasDescription}>
      <Pressable
        ref={attach}
        role={radio ? 'radio' : 'checkbox'}
        // Named by its label and description alone, not by the shortcut key drawn beside them.
        aria-label={
          Children.toArray(children)
            .map((child) => textOf(child))
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        {...keyShortcuts(shortcut, checked && !disabled && 'Enter')}
        {...webKeys}
        className={cn(
          'relative min-h-11 flex-row items-start cn-questionnaire-choice',
          checked && 'cn-questionnaire-choice@checked',
          item.invalid && 'cn-questionnaire-choice@invalid',
          focusVisible && 'cn-questionnaire-choice@focused',
          disabled && 'opacity-50',
          className,
        )}
        onFocus={(event) => {
          focusChanged(event);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          blurred();
          onBlur?.(event);
        }}
        onPress={(event) => {
          onPress?.(event);
          // Enter goes on rather than picking, as on a browser's own radio and checkbox.
          if (defaultPrevented(event) || (event as unknown as { key?: string }).key === 'Enter') return;
          press();
        }}
        {...props}
      >
        <View
          aria-hidden
          className={cn(
            'relative shrink-0 items-center justify-center border cn-questionnaire-choice-indicator',
            radio && 'rounded-full',
            checked && 'cn-questionnaire-choice-indicator@checked',
            hasDescription && 'cn-questionnaire-choice-indicator@slot=questionnaire-choice-description',
          )}
        >
          {checked && radio ? <View className="cn-questionnaire-choice-indicator-dot rounded-full" /> : null}
          {checked && !radio ? (
            <TextClassContext.Provider value="cn-questionnaire-choice-indicator/text@checked">
              <IconClassContext.Provider value="cn-questionnaire-choice-indicator-check">
                <Icon as={Check} />
              </IconClassContext.Provider>
            </TextClassContext.Provider>
          ) : null}
        </View>
        <TextClassContext.Provider value="leading-snug cn-questionnaire-choice/text">
          <View className="cn-questionnaire-choice-content min-w-0 flex-1 flex-col">{asText(children)}</View>
        </TextClassContext.Provider>
        {shortcut === null ? null : (
          <View
            aria-hidden
            className={cn(
              'ms-auto shrink-0 cn-questionnaire-shortcut',
              hasDescription && 'cn-questionnaire-shortcut@slot=questionnaire-choice-description',
            )}
          >
            <Text className="cn-questionnaire-shortcut/text">{shortcut}</Text>
          </View>
        )}
      </Pressable>
    </QuestionnaireChoiceContext.Provider>
  );
}

/** A line under a choice's label that says more about it, in muted text. */
function QuestionnaireChoiceDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const setHasDescription = useContext(QuestionnaireChoiceContext);

  useLayoutEffect(() => {
    setHasDescription?.(true);
    return () => setHasDescription?.(false);
  }, [setHasDescription]);

  return <Text className={cn('cn-questionnaire-choice-description/text', className)} {...props} />;
}

type QuestionnaireInputProps = ComponentProps<typeof Input>;

/**
 * A free-text answer, such as "Something else", which answers the question while it holds text. In a question
 * with one answer, typing in it unpicks the choices, and picking a choice leaves its text unsent. Return goes on
 * while it holds the answer, and Shift with Return breaks the line of a `multiline` one; on the web, while it is
 * empty, the up and down arrows move to the other answers.
 * Name it with `aria-label`.
 */
function QuestionnaireInput({
  className,
  value: valueProp,
  defaultValue,
  onChangeText,
  editable,
  onFocus,
  onBlur,
  onKeyPress,
  onSubmitEditing,
  ref,
  ...props
}: QuestionnaireInputProps): ReactNode {
  const root = useRoot('QuestionnaireInput');
  const item = useItem('QuestionnaireInput');
  const [focused, setFocused] = useState(false);
  const id = useId();
  const [uncontrolledText, setText] = useState(defaultValue ?? '');
  const text = valueProp ?? uncontrolledText;
  const filled = text.trim().length > 0;
  const disabled = item.disabled || editable === false;
  const firstFilled = useRef(filled);
  const field = useRef<ComponentRef<typeof Input>>(null);
  const { registerAnswer, unregisterAnswer, registerControl, select } = item;
  const answering = filled && !disabled && item.selected.includes(id);

  useLayoutEffect(() => {
    registerAnswer({ id, type: 'input', value: text, disabled, ownDisabled: editable === false }, firstFilled.current);
  }, [registerAnswer, id, text, disabled, editable]);
  useLayoutEffect(() => () => unregisterAnswer(id), [unregisterAnswer, id]);
  useLayoutEffect(
    () => registerControl(id, { focus: () => field.current?.focus(), press: () => undefined }),
    [registerControl, id],
  );
  const attach = useCallback(
    (node: ComponentRef<typeof Input> | null) => {
      field.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useLayoutEffect(() => {
    if (valueProp !== undefined) select(id, valueProp.trim().length > 0);
  }, [valueProp, id, select]);

  return (
    <View className="cn-questionnaire-input-wrapper w-full min-w-0">
      <Input
        value={text}
        editable={!disabled}
        aria-invalid={item.invalid || undefined}
        // The slot's own colours are merged over the Input's, so its focused and invalid borders are applied here too.
        className={cn(
          'min-h-11 w-full min-w-0 cn-questionnaire-input cn-questionnaire-input/text',
          focused && 'cn-questionnaire-input@focused',
          item.invalid && 'cn-questionnaire-input@invalid',
          className,
        )}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onChangeText={(next) => {
          onChangeText?.(next);
          if (valueProp !== undefined) return;
          setText(next);
          select(id, next.trim().length > 0);
        }}
        // React Native Web's field stops its keys from reaching the Questionnaire, so it hands them on here.
        onKeyPress={(event) => {
          onKeyPress?.(event);
          if (Platform.OS !== 'web') return;
          const keyEvent = event as unknown as WebKeyEvent;
          const keyPress = readKey(keyEvent);
          if (!keyPress) return;
          if (keyPress.key === 'Enter' && !modified(keyPress) && !(keyPress.shiftKey && props.multiline)) {
            // Also keeps the field from submitting and blurring itself.
            keyEvent.preventDefault();
            if (!keyPress.repeat && answering) root.advance();
            return;
          }
          const vertical = keyPress.key === 'ArrowUp' || keyPress.key === 'ArrowDown';
          if (vertical && !modified(keyPress) && !filled) {
            if (item.moveFocus(id, keyPress.key === 'ArrowDown' ? 'next' : 'previous')) keyEvent.preventDefault();
            return;
          }
          root.handleKey(keyEvent, true);
        }}
        onSubmitEditing={(event) => {
          onSubmitEditing?.(event);
          if (Platform.OS !== 'web' && answering) root.advance();
        }}
        {...keyShortcuts(answering && 'Enter')}
        {...props}
        ref={attach}
      />
    </View>
  );
}

/**
 * The question's error, shown and announced once the question is left unanswered, or while it is `invalid`. It
 * says to choose an answer, or to choose one or skip, unless given its own text.
 */
function QuestionnaireError({ className, children, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { invalid, required } = useItem('QuestionnaireError');
  const text =
    textOf(children) || (required ? 'Choose an answer to continue.' : 'Choose an answer or skip this question.');

  // An alert is announced on Android as it appears; iOS announces only what it is told to.
  useEffect(() => {
    if (invalid && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(text);
  }, [invalid, text]);

  if (!invalid) return null;
  return (
    <Text
      role="alert"
      aria-live="assertive"
      className={cn('text-destructive cn-questionnaire-error cn-questionnaire-error/text', className)}
      {...props}
    >
      {children ?? text}
    </Text>
  );
}

/** The row of QuestionnairePrevious, QuestionnaireSkip, and QuestionnaireNext or QuestionnaireSubmit, at its end. */
function QuestionnaireActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View
      className={cn('min-h-11 w-full flex-row items-center justify-end cn-questionnaire-actions', className)}
      {...props}
    />
  );
}

type QuestionnaireButtonProps = ComponentProps<typeof Button> & {
  /** Its label; the step's own word by default. */
  children?: ReactNode;
};

/** A Button for one way to move, with its default label drawn as Text. */
function StepButton({ label, children, className, ...props }: QuestionnaireButtonProps & { label: string }): ReactNode {
  return (
    <Button className={cn('min-h-11', className)} {...props}>
      {asText(children ?? label)}
    </Button>
  );
}

/** Goes back a question; shown from the second question on. An outline Button unless given another `variant`. */
function QuestionnairePrevious({
  variant = 'outline',
  className,
  onPress,
  ...props
}: QuestionnaireButtonProps): ReactNode {
  const root = useRoot('QuestionnairePrevious');
  if (root.total <= 1 || root.first) return null;
  return (
    <StepButton
      label="Previous"
      variant={variant}
      className={cn('me-auto', className)}
      onPress={(event) => {
        onPress?.(event);
        root.goPrevious();
      }}
      {...props}
    />
  );
}

/**
 * Skips the question shown, and finishes when it is the last; shown only for a question that is not required.
 * An outline Button unless given another `variant`.
 */
function QuestionnaireSkip({ variant = 'outline', onPress, ...props }: QuestionnaireButtonProps): ReactNode {
  const root = useRoot('QuestionnaireSkip');
  if (root.activeItemRequired !== false) return null;
  return (
    <StepButton
      label="Skip"
      variant={variant}
      onPress={(event) => {
        onPress?.(event);
        root.skipCurrent();
      }}
      {...props}
    />
  );
}

/** Goes on to the next question once the one shown can be left; shown before the last question. */
function QuestionnaireNext({ onPress, ...props }: QuestionnaireButtonProps): ReactNode {
  const root = useRoot('QuestionnaireNext');
  if (root.total <= 1 || root.last) return null;
  return (
    <StepButton
      label="Next"
      onPress={(event) => {
        onPress?.(event);
        root.goNext();
      }}
      {...keyShortcuts(!props.disabled && 'Enter')}
      {...props}
    />
  );
}

/** Finishes the Questionnaire; shown on the last question. */
function QuestionnaireSubmit({ onPress, ...props }: QuestionnaireButtonProps): ReactNode {
  const root = useRoot('QuestionnaireSubmit');
  if (root.total === 0 || !root.last) return null;
  return (
    <StepButton
      label="Submit"
      onPress={(event) => {
        onPress?.(event);
        root.submit();
      }}
      {...keyShortcuts(!props.disabled && 'Enter')}
      {...props}
    />
  );
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
export type {
  QuestionnaireButtonProps,
  QuestionnaireChoiceDefinition,
  QuestionnaireChoiceProps,
  QuestionnaireInputProps,
  QuestionnaireItemDefinition,
  QuestionnaireItemProps,
  QuestionnaireItemStatus,
  QuestionnaireProps,
  QuestionnaireShortcutMode,
  QuestionnaireValues,
};
