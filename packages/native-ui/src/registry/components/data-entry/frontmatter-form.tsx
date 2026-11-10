import {
  cloneElement,
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { TextInputProps } from 'react-native';
import { Field, FieldError, FieldGroup, FieldLabel, type FieldLabelProps } from '../../ui/field';

/** A frontmatter document: arbitrary keys, values usually strings. */
type FrontmatterFormValue = Record<string, unknown>;

interface FrontmatterFormContextValue {
  value: FrontmatterFormValue;
  setField: (name: string, fieldValue: unknown) => void;
  errors: Record<string, string>;
}

const FrontmatterFormContext = createContext<FrontmatterFormContextValue | null>(null);

function useFrontmatterFormContext(): FrontmatterFormContextValue {
  const context = useContext(FrontmatterFormContext);
  if (!context) throw new Error('FrontmatterForm parts must be used within <FrontmatterForm>');
  return context;
}

interface FrontmatterFormFieldContextValue {
  /** The frontmatter key the field binds to. */
  name: string;
  /** The key's value in the document, as the document holds it. */
  value: unknown;
  /** Reports the document with this key set to `fieldValue`. */
  setValue: (fieldValue: unknown) => void;
  /** The field's message from the root's `errors`, or `undefined` while it is valid. */
  error: string | undefined;
  /** The label's `nativeID`, which a control names in `aria-labelledby` to take the label's text as its name. */
  labelId: string;
}

const FrontmatterFormFieldContext = createContext<FrontmatterFormFieldContextValue | null>(null);

/**
 * The current field's binding: `value`, `setValue`, `error`, and the `labelId` its label carries. Use it to bind
 * a control that `FrontmatterFormFieldControl` does not cover (a Switch, a tag input). Throws outside a
 * `FrontmatterFormField`.
 */
function useFrontmatterFormField(): FrontmatterFormFieldContextValue {
  const context = useContext(FrontmatterFormFieldContext);
  if (!context) {
    throw new Error('useFrontmatterFormField / FrontmatterFormField parts must be used within <FrontmatterFormField>');
  }
  return context;
}

type FrontmatterFormProps = ComponentProps<typeof FieldGroup> & {
  /** The frontmatter object (controlled). */
  value: FrontmatterFormValue;
  /** Receives the next object whenever a field changes. */
  onValueChange: (value: FrontmatterFormValue) => void;
  /**
   * Validation messages keyed by field name, computed by the caller (the component ships no rules). A field
   * with an entry shows it and marks its control invalid.
   */
  errors?: Record<string, string>;
};

/**
 * A frontmatter (YAML metadata) editor, a FieldGroup of fields. The root holds the document and its field
 * setters; the caller composes one `FrontmatterFormField` per key and owns every label, hint
 * (`FieldDescription`), control and validation rule.
 */
function FrontmatterForm({ value, onValueChange, errors = {}, ...props }: FrontmatterFormProps): ReactNode {
  const context: FrontmatterFormContextValue = {
    value,
    setField: (name, fieldValue) => onValueChange({ ...value, [name]: fieldValue }),
    errors,
  };
  return (
    <FrontmatterFormContext.Provider value={context}>
      <FieldGroup {...props} />
    </FrontmatterFormContext.Provider>
  );
}

type FrontmatterFormFieldProps = ComponentProps<typeof Field> & {
  /** Frontmatter key this field binds to. */
  name: string;
};

/** One field of a `FrontmatterForm`, bound to `name`: a Field, invalid while the root's `errors` hold `name`. */
function FrontmatterFormField({ name, ...props }: FrontmatterFormFieldProps): ReactNode {
  const form = useFrontmatterFormContext();
  const labelId = useId();
  const error = form.errors[name];

  const field: FrontmatterFormFieldContextValue = {
    name,
    value: form.value[name],
    setValue: (fieldValue) => form.setField(name, fieldValue),
    error,
    labelId,
  };

  return (
    <FrontmatterFormFieldContext.Provider value={field}>
      <Field invalid={Boolean(error)} {...props} />
    </FrontmatterFormFieldContext.Provider>
  );
}

type FrontmatterFormFieldLabelProps = Omit<FieldLabelProps, 'nativeID'>;

/** Label for the current field, whose text the field's control is named by. */
function FrontmatterFormFieldLabel(props: FrontmatterFormFieldLabelProps): ReactNode {
  const field = useFrontmatterFormField();
  return <FieldLabel nativeID={field.labelId} {...props} />;
}

type FrontmatterFormFieldControlElementProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'aria-labelledby' | 'accessibilityHint'
> & {
  'aria-invalid'?: boolean;
};

interface FrontmatterFormFieldControlProps {
  /**
   * The text control to bind, such as `<Input placeholder="my-skill" />` or `<Textarea />`. It receives the
   * field's value as a string, `aria-labelledby` naming the label, and `aria-invalid`, which replace its own;
   * while the field is invalid the error replaces its `accessibilityHint`. Its own `onChangeText` still runs,
   * before the field's. For a non-text control use `useFrontmatterFormField()` instead.
   */
  render: ReactElement<FrontmatterFormFieldControlElementProps>;
}

/** Binds a text control (Input, Textarea) to the current field's value, shown as a string. */
function FrontmatterFormFieldControl({ render }: FrontmatterFormFieldControlProps): ReactNode {
  const field = useFrontmatterFormField();
  const { onChangeText: ownOnChangeText, accessibilityHint: ownHint } = render.props;
  return cloneElement(render, {
    value: field.value === undefined || field.value === null ? '' : String(field.value),
    onChangeText: (text: string) => {
      ownOnChangeText?.(text);
      field.setValue(text);
    },
    'aria-invalid': field.error ? true : undefined,
    // Android reads the label through it; iOS reads only the control's own `aria-label`.
    'aria-labelledby': field.labelId,
    // React Native announces no `aria-invalid`, so the error reaches a screen reader as the control's hint.
    accessibilityHint: field.error || ownHint,
  });
}

/** The current field's message from the root's `errors`; draws nothing while the field is valid. */
function FrontmatterFormFieldError(props: ComponentProps<typeof FieldError>): ReactNode {
  const field = useFrontmatterFormField();
  if (!field.error) return null;
  return <FieldError {...props}>{field.error}</FieldError>;
}

export {
  useFrontmatterFormField,
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldLabel,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
};
export type {
  FrontmatterFormValue,
  FrontmatterFormProps,
  FrontmatterFormFieldProps,
  FrontmatterFormFieldLabelProps,
  FrontmatterFormFieldControlProps,
};
