import { Check } from 'lucide-react-native';
import {
  Children,
  createContext,
  isValidElement,
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
  skipCurrent: () => void;
  submit: () => void;
}

/** What the Questionnaire knows of a rendered QuestionnaireItem, which it re-renders on. */
interface ItemSummary {
  name: string;
  disabled: boolean;
  required: boolean;
  status: QuestionnaireItemStatus;
}

/** What the Questionnaire asks of a rendered QuestionnaireItem. */
interface ItemHandle {
  /** Shows the item's error if it cannot be left yet, and says whether it can. */
  validate: () => boolean;
  /** Clears the answer and marks the item skipped. */
  skip: () => void;
  /** The item's answer, or undefined when it has none. */
  value: () => string | string[] | undefined;
  /** Picks the choice a shortcut key names; false when no choice has it. */
  chooseByShortcut: (key: string) => boolean;
  /** Moves focus to the item, the keyboard's on the web and the screen reader's on a device. */
  focus: () => void;
}

/** One answer control in an item: a choice, or the free-text input. */
interface AnswerRecord {
  id: string;
  type: 'choice' | 'input';
  value: string;
  disabled: boolean;
}

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

/** The text `node` reads as, the text of nested elements included. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
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

/** The web keys the Questionnaire answers, read off the event React Native Web hands a View. */
type WebKeyEvent = {
  nativeEvent: object;
  preventDefault: () => void;
};

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
      if (known.disabled === next.disabled && known.required === next.required && known.status === next.status) {
        return current;
      }
      return current.map((entry, position) => (position === at ? next : entry));
    });
  }, []);

  // The keys the web answers: a choice's shortcut, Enter with Ctrl or Cmd to go on, and the side arrows to step.
  const onKeyDown = (event: WebKeyEvent): void => {
    const { key, metaKey, ctrlKey, altKey, shiftKey, target, repeat } = event.nativeEvent as {
      key?: string;
      metaKey?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      repeat?: boolean;
      target?: { tagName?: string };
    };
    if (key === undefined) return;
    const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
    if (key === 'Enter' && (metaKey || ctrlKey) && !altKey && !shiftKey) {
      event.preventDefault();
      if (!repeat) advance();
      return;
    }
    if (metaKey || ctrlKey || altKey || typing) return;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      if (repeat) return;
      if (key === 'ArrowLeft') goPrevious();
      else if (activeItemStatus !== 'unanswered') goNext();
      return;
    }
    if (shortcuts === undefined) return;
    const shortcut = shortcuts === 'letters' ? key.toUpperCase() : key;
    if (!shortcutKeys(shortcuts).includes(shortcut)) return;
    if (handleOf(currentName)?.chooseByShortcut(shortcut)) event.preventDefault();
  };
  const webKeys = Platform.OS === 'web' ? ({ onKeyDown } as object) : {};

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
    skipCurrent,
    submit,
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
      if (skipped || disabled) return multiple ? [] : undefined;
      const values = enabledAnswers.filter((answer) => selected.includes(answer.id)).map((answer) => answer.value);
      return multiple ? values : values[0];
    },
    chooseByShortcut: (key) => {
      const choice = enabledAnswers.find(
        (answer) => answer.type === 'choice' && shortcutOf(answer.id, answer.value) === key,
      );
      if (!choice) return false;
      select(choice.id, multiple ? !selected.includes(choice.id) : true);
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
    updateItem({ name, disabled, required, status });
  }, [updateItem, name, disabled, required, status]);

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
    select,
    setHasDescription,
    hasDescription,
    setTitle,
  };

  return (
    <QuestionnaireItemContext.Provider value={context}>
      <View
        ref={viewRef}
        role={multiple ? 'group' : 'radiogroup'}
        aria-label={title || undefined}
        aria-hidden={!active || undefined}
        tabIndex={Platform.OS === 'web' ? -1 : undefined}
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
 * and on the web shows the key that picks it when the Questionnaire has `shortcuts`.
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
  children,
  ...props
}: QuestionnaireChoiceProps): ReactNode {
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
  const { registerAnswer, unregisterAnswer, select } = item;

  useLayoutEffect(() => {
    registerAnswer({ id, type: 'choice', value, disabled }, firstChecked.current === true);
  }, [registerAnswer, id, value, disabled]);
  useLayoutEffect(() => () => unregisterAnswer(id), [unregisterAnswer, id]);

  useLayoutEffect(() => {
    if (checkedProp === undefined) return;
    if (checkedProp) select(id, true);
    else select(id, false);
  }, [checkedProp, id, select]);

  return (
    <QuestionnaireChoiceContext.Provider value={setHasDescription}>
      <Pressable
        role={radio ? 'radio' : 'checkbox'}
        // Named by its label and description alone, not by the shortcut key drawn beside them.
        aria-label={Children.toArray(children).map(textOf).filter(Boolean).join(' ') || undefined}
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
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
        onPress={() => {
          const next = radio ? true : !checked;
          if (next === checked) return;
          onChange?.(next);
          if (!controlled) select(id, next);
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
          <View className="cn-questionnaire-choice-content min-w-0 flex-1 flex-col">{children}</View>
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
 * with one answer, typing in it unpicks the choices, and picking a choice leaves its text unsent. Name it with
 * `aria-label`.
 */
function QuestionnaireInput({
  className,
  value: valueProp,
  defaultValue,
  onChangeText,
  editable,
  onFocus,
  onBlur,
  ...props
}: QuestionnaireInputProps): ReactNode {
  const item = useItem('QuestionnaireInput');
  const [focused, setFocused] = useState(false);
  const id = useId();
  const [uncontrolledText, setText] = useState(defaultValue ?? '');
  const text = valueProp ?? uncontrolledText;
  const filled = text.trim().length > 0;
  const disabled = item.disabled || editable === false;
  const firstFilled = useRef(filled);
  const { registerAnswer, unregisterAnswer, select } = item;

  useLayoutEffect(() => {
    registerAnswer({ id, type: 'input', value: text, disabled }, firstFilled.current);
  }, [registerAnswer, id, text, disabled]);
  useLayoutEffect(() => () => unregisterAnswer(id), [unregisterAnswer, id]);

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
        {...props}
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
      {children === undefined || typeof children === 'string' ? <Text>{children ?? label}</Text> : children}
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
