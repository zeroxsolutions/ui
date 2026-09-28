import * as React from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** A frontmatter document — arbitrary keys; values are usually strings. */
export type FrontmatterFormValue = Record<string, unknown>;

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
 * The current field's binding — `value`, `setValue`, `error`, and the `id`s for
 * label/error wiring. Use it to bind a control the built-in
 * `FrontmatterFormFieldControl` doesn't cover (a `Switch`, a tag input, …).
 */
export function useFrontmatterFormField(): FrontmatterFormFieldContextValue {
  const ctx = React.useContext(FrontmatterFormFieldContext);
  if (!ctx) {
    throw new Error('useFrontmatterFormField / FrontmatterFormField parts must be used within <FrontmatterFormField>');
  }
  return ctx;
}

export interface FrontmatterFormProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  /** The frontmatter object (controlled). */
  value: FrontmatterFormValue;
  /** Receives the next object whenever a field changes. */
  onValueChange: (value: FrontmatterFormValue) => void;
  /**
   * Validation messages keyed by field name. The consumer computes these (the
   * SDK ships no validation rules); a field with an entry renders it and marks
   * the control invalid.
   */
  errors?: Record<string, string>;
}

/**
 * A **frontmatter (YAML metadata) editor** — a compound recipe, not a configured
 * form. The Root holds the document and field setters in context; the consumer
 * composes one `FrontmatterFormField` per key and owns every label, hint, control,
 * and validation rule. Controlled: pass `value` + `onValueChange`, and `errors`
 * computed by your own validator.
 */
export function FrontmatterForm({
  value,
  onValueChange,
  errors = {},
  className,
  children,
  ...props
}: FrontmatterFormProps) {
  const ctx: FrontmatterFormContextValue = {
    value,
    setField: (name, fieldValue) => onValueChange({ ...value, [name]: fieldValue }),
    errors,
  };
  return (
    <FrontmatterFormContext.Provider value={ctx}>
      <div data-slot="frontmatter-form" className={cn('flex flex-col gap-5', className)} {...props}>
        {children}
      </div>
    </FrontmatterFormContext.Provider>
  );
}

export interface FrontmatterFormFieldProps extends React.ComponentProps<typeof Field> {
  /** Frontmatter key this field binds to. */
  name: string;
}

/**
 * One field of a `FrontmatterForm`, bound to `name`. Renders a `Field` group
 * and provides the field binding to its parts; compose
 * `FrontmatterFormFieldLabel` + `FrontmatterFormFieldControl` + `FrontmatterFormFieldError`
 * (and optionally `FrontmatterFormFieldDescription`) as children.
 */
export function FrontmatterFormField({ name, children, ...props }: FrontmatterFormFieldProps) {
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
      <Field data-invalid={error ? true : undefined} {...props}>
        {children}
      </Field>
    </FrontmatterFormFieldContext.Provider>
  );
}

/** Label for the current field; wires `htmlFor` to its control. Copy is `children`. */
export function FrontmatterFormFieldLabel(props: React.ComponentProps<typeof FieldLabel>) {
  const field = useFrontmatterFormField();
  return <FieldLabel htmlFor={field.controlId} {...props} />;
}

/** Supplementary hint under a field. Copy is `children`. */
export function FrontmatterFormFieldDescription(props: React.ComponentProps<typeof FieldDescription>) {
  return <FieldDescription {...props} />;
}

export interface FrontmatterFormFieldControlProps {
  /**
   * The control element to bind — e.g. `<Input placeholder="my-skill" />` or
   * `<Textarea />`. It receives `id`, `value`, `onChange`, and invalid-state
   * a11y props; for string fields. Any `value`/`onChange` on the element are
   * overridden. For non-text controls, use `useFrontmatterFormField()` instead.
   */
  render: React.ReactElement;
}

/** Binds a text control (`Input` / `Textarea`) to the current field's string value. */
export function FrontmatterFormFieldControl({ render }: FrontmatterFormFieldControlProps) {
  const field = useFrontmatterFormField();
  return React.cloneElement(render as React.ReactElement<Record<string, unknown>>, {
    id: field.controlId,
    value: (field.value ?? '') as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.setValue(event.target.value),
    'aria-invalid': field.error ? true : undefined,
    'aria-describedby': field.error ? field.errorId : undefined,
  });
}

/** Renders the current field's validation message (from the Root `errors`), if any. */
export function FrontmatterFormFieldError(props: React.ComponentProps<typeof FieldError>) {
  const field = useFrontmatterFormField();
  if (!field.error) return null;
  return (
    <FieldError id={field.errorId} {...props}>
      {field.error}
    </FieldError>
  );
}
