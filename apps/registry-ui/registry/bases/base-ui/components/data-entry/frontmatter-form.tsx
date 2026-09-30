import * as React from 'react';

import { Field, FieldError, FieldGroup, FieldLabel } from '@/registry/bases/base-ui/ui/field';

/** A frontmatter document: arbitrary keys, values usually strings. */
type FrontmatterFormValue = Record<string, unknown>;

interface FrontmatterFormContextValue {
  value: FrontmatterFormValue;
  setField: (name: string, fieldValue: unknown) => void;
  errors: Record<string, string>;
}

const FrontmatterFormContext = React.createContext<FrontmatterFormContextValue | null>(null);

function useFrontmatterFormContext(): FrontmatterFormContextValue {
  const ctx = React.useContext(FrontmatterFormContext);
  if (!ctx) {
    throw new Error('FrontmatterForm parts must be used within <FrontmatterForm>');
  }
  return ctx;
}

interface FrontmatterFormFieldContextValue {
  name: string;
  value: unknown;
  setValue: (fieldValue: unknown) => void;
  error: string | undefined;
  controlId: string;
  errorId: string;
}

const FrontmatterFormFieldContext = React.createContext<FrontmatterFormFieldContextValue | null>(null);

/**
 * The current field's binding: `value`, `setValue`, `error`, and the ids the
 * label and the error point at. Use it to bind a control that
 * `FrontmatterFormFieldControl` does not cover (a `Switch`, a tag input).
 * Throws outside a `FrontmatterFormField`.
 */
function useFrontmatterFormField(): FrontmatterFormFieldContextValue {
  const ctx = React.useContext(FrontmatterFormFieldContext);
  if (!ctx) {
    throw new Error('useFrontmatterFormField / FrontmatterFormField parts must be used within <FrontmatterFormField>');
  }
  return ctx;
}

interface FrontmatterFormProps extends Omit<React.ComponentProps<typeof FieldGroup>, 'onChange'> {
  /** The frontmatter object (controlled). */
  value: FrontmatterFormValue;
  /** Receives the next object whenever a field changes. */
  onValueChange: (value: FrontmatterFormValue) => void;
  /**
   * Validation messages keyed by field name, computed by the consumer (the
   * component ships no rules). A field with an entry renders it and marks its
   * control invalid.
   */
  errors?: Record<string, string>;
}

/**
 * A frontmatter (YAML metadata) editor, an upstream `FieldGroup` of fields. The
 * root holds the document and its field setters; the consumer composes one
 * `FrontmatterFormField` per key and owns every label, hint (upstream
 * `FieldDescription`), control and validation rule.
 */
function FrontmatterForm({ value, onValueChange, errors = {}, ...props }: FrontmatterFormProps): React.ReactNode {
  const ctx: FrontmatterFormContextValue = {
    value,
    setField: (name, fieldValue) => onValueChange({ ...value, [name]: fieldValue }),
    errors,
  };
  return (
    <FrontmatterFormContext.Provider value={ctx}>
      <FieldGroup data-slot="frontmatter-form" {...props} />
    </FrontmatterFormContext.Provider>
  );
}

interface FrontmatterFormFieldProps extends React.ComponentProps<typeof Field> {
  /** Frontmatter key this field binds to. */
  name: string;
}

/**
 * One field of a `FrontmatterForm`, bound to `name`: an upstream `Field`,
 * marked invalid when the root's `errors` hold `name`. It keeps upstream's
 * `data-slot="field"`, which `FieldLabel` selects on.
 */
function FrontmatterFormField({ name, ...props }: FrontmatterFormFieldProps): React.ReactNode {
  const ctx = useFrontmatterFormContext();
  const controlId = React.useId();
  const errorId = React.useId();
  const error = ctx.errors[name];

  const fieldCtx: FrontmatterFormFieldContextValue = {
    name,
    value: ctx.value[name],
    setValue: (fieldValue) => ctx.setField(name, fieldValue),
    error,
    controlId,
    errorId,
  };

  return (
    <FrontmatterFormFieldContext.Provider value={fieldCtx}>
      <Field data-invalid={error ? true : undefined} {...props} />
    </FrontmatterFormFieldContext.Provider>
  );
}

/** Label for the current field, pointed at its control. */
function FrontmatterFormFieldLabel(props: React.ComponentProps<typeof FieldLabel>): React.ReactNode {
  const field = useFrontmatterFormField();
  return <FieldLabel htmlFor={field.controlId} {...props} />;
}

type FrontmatterFormFieldControlElementProps = Pick<
  React.ComponentProps<'input'>,
  'id' | 'value' | 'onChange' | 'aria-invalid' | 'aria-describedby'
>;

interface FrontmatterFormFieldControlProps {
  /**
   * The text control to bind, such as `<Input placeholder="my-skill" />` or
   * `<Textarea />`. It receives the field's `id`, string `value` and the
   * invalid-state attributes, which replace its own; its own `onChange` still
   * runs, before the field's. For a non-text control use
   * `useFrontmatterFormField()` instead.
   */
  render: React.ReactElement<FrontmatterFormFieldControlElementProps>;
}

/** Binds a text control (`Input`, `Textarea`) to the current field's string value. */
function FrontmatterFormFieldControl({ render }: FrontmatterFormFieldControlProps): React.ReactNode {
  const field = useFrontmatterFormField();
  const ownOnChange = render.props.onChange;
  return React.cloneElement(render, {
    id: field.controlId,
    value: (field.value ?? '') as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      ownOnChange?.(event);
      field.setValue(event.target.value);
    },
    'aria-invalid': field.error ? true : undefined,
    'aria-describedby': field.error ? field.errorId : undefined,
  });
}

/** The current field's message from the root's `errors`; renders nothing while the field is valid. */
function FrontmatterFormFieldError(props: React.ComponentProps<typeof FieldError>): React.ReactNode {
  const field = useFrontmatterFormField();
  if (!field.error) return null;
  return (
    <FieldError id={field.errorId} {...props}>
      {field.error}
    </FieldError>
  );
}

export {
  useFrontmatterFormField,
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldLabel,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
};
export type { FrontmatterFormValue, FrontmatterFormProps, FrontmatterFormFieldProps, FrontmatterFormFieldControlProps };
