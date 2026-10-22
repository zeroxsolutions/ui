import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  type SelectContentProps,
  type SelectTriggerProps,
} from './select';

/**
 * The value an option with an empty `value` is chosen under. HTML's `<option value="">` is how a native
 * select asks for a choice, and the Select it is drawn with takes no empty value.
 */
const EMPTY_VALUE = '__native-select-empty__';

function toSelectValue(value: string): string {
  return value === '' ? EMPTY_VALUE : value;
}

function fromSelectValue(value: string): string {
  return value === EMPTY_VALUE ? '' : value;
}

/** Whether the options inside a NativeSelectOptGroup are disabled with it. */
const GroupDisabledContext = createContext(false);

/** An option as NativeSelect reads it from its children, before the list has been opened. */
interface Option {
  value: string;
  label: string;
  disabled: boolean;
}

/** The text an option shows: its `label`, else its text children. */
function labelOf(props: NativeSelectOptionProps): string | undefined {
  if (props.label !== undefined) return props.label;
  const texts = Children.toArray(props.children).filter(
    (child): child is string | number => typeof child === 'string' || typeof child === 'number',
  );
  return texts.length > 0 ? texts.join('') : undefined;
}

/** The value an option is chosen under: its `value`, else its text, as HTML's option takes it. */
function valueOf(props: NativeSelectOptionProps): string {
  return props.value ?? labelOf(props) ?? '';
}

/** The options among `children`, in order, inside groups and fragments too. */
function optionsIn(children: ReactNode, groupDisabled = false): Option[] {
  return Children.toArray(children).flatMap((child): Option[] => {
    if (!isValidElement(child)) return [];
    const element = child as ReactElement<Record<string, unknown>>;
    if (element.type === NativeSelectOption) {
      const props = element.props as NativeSelectOptionProps;
      const value = valueOf(props);
      return [{ value, label: labelOf(props) ?? value, disabled: groupDisabled || props.disabled === true }];
    }
    if (element.type === NativeSelectOptGroup) {
      const props = element.props as NativeSelectOptGroupProps;
      return optionsIn(props.children, groupDisabled || props.disabled === true);
    }
    if (element.type === Fragment) return optionsIn(element.props.children as ReactNode, groupDisabled);
    return [];
  });
}

type NativeSelectProps = Omit<SelectTriggerProps, 'children' | 'size'> & {
  /** NativeSelectOptions, and NativeSelectOptGroups of them. */
  children?: ReactNode;
  /** `sm` draws the field 32px tall rather than 36px. */
  size?: 'sm' | 'default';
  /** The chosen option's value, when the owner holds it; follow `onValueChange` to change it. */
  value?: string;
  /** The value chosen at the start; the first option that is not disabled when left out, as HTML's select. */
  defaultValue?: string;
  /** Called with the value of the option a press chooses, `''` for an option whose value is empty. */
  onValueChange?: (value: string) => void;
  /** The `name` of the PortalHost the list draws in, when it is not the app's own. */
  portalHost?: SelectContentProps['portalHost'];
};

/**
 * A field that picks one of its options, with a chevron at its end, drawn with Select: a press opens the
 * list of NativeSelectOptions, and choosing one closes it and shows its label. Until another is chosen it
 * shows the first option that is not disabled, as HTML's select does, so an option with an empty value and
 * a label such as "Select a fruit" asks for a choice. It is announced as a combobox; name it with
 * `aria-label`. `className` goes to the box around the field, the rest of the props to the field itself.
 */
function NativeSelect({
  className,
  size = 'default',
  value,
  defaultValue,
  onValueChange,
  portalHost,
  children,
  ...props
}: NativeSelectProps): ReactNode {
  const options = optionsIn(children);
  const first = options.find((option) => !option.disabled)?.value;
  const startsWith = defaultValue ?? first;
  return (
    <View className={cn('relative self-start', className)}>
      <Select
        value={value === undefined ? undefined : toSelectValue(value)}
        defaultValue={startsWith === undefined ? undefined : toSelectValue(startsWith)}
        onValueChange={(chosen) => onValueChange?.(fromSelectValue(chosen))}
        items={options.map((option) => ({ label: option.label, value: toSelectValue(option.value) }))}
      >
        <SelectTrigger size={size} {...props}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent portalHost={portalHost}>{children}</SelectContent>
      </Select>
    </View>
  );
}

interface NativeSelectOptionProps {
  /** The value the option is chosen under; its text when left out. */
  value?: string;
  /** The option's text, as HTML's option takes it. */
  children?: ReactNode;
  /** The text the option and the field show; the text children when left out. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * One option of a NativeSelect, announced with its selected state, with a check mark while chosen. A
 * disabled option, or one in a disabled group, is dimmed, announced as disabled and ignores presses.
 */
function NativeSelectOption({ value, label, children, disabled, className }: NativeSelectOptionProps): ReactNode {
  const groupDisabled = useContext(GroupDisabledContext);
  const props = { value, label, children };
  return (
    <SelectItem
      value={toSelectValue(valueOf(props))}
      label={labelOf(props)}
      disabled={groupDisabled || disabled === true}
      className={className}
    >
      {children}
    </SelectItem>
  );
}

interface NativeSelectOptGroupProps {
  /** The group's name, drawn as a muted heading over its options. */
  label?: string;
  /** NativeSelectOptions. */
  children?: ReactNode;
  /** Disables every option in the group. */
  disabled?: boolean;
  className?: string;
}

/** Options that belong together under a heading, announced as a group. */
function NativeSelectOptGroup({ label, children, disabled = false, className }: NativeSelectOptGroupProps): ReactNode {
  return (
    <GroupDisabledContext.Provider value={disabled}>
      <SelectGroup className={className}>
        {label !== undefined && <SelectLabel>{label}</SelectLabel>}
        {children}
      </SelectGroup>
    </GroupDisabledContext.Provider>
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
export type { NativeSelectOptGroupProps, NativeSelectOptionProps, NativeSelectProps };
