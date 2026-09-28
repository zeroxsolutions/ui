import * as React from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** A frontmatter document — arbitrary keys; values are usually strings. */
export type FrontmatterValue = Record<string, unknown>;

interface FrontmatterContextValue {
  value: FrontmatterValue;
  setField: (name: string, fieldValue: unknown) => void;
  errors: Record<string, string>;
}

const FrontmatterContext = React.createContext<FrontmatterContextValue | null>(null);

function useFrontmatterContext(): FrontmatterContextValue {
  const ctx = React.useContext(FrontmatterContext);
  if (!ctx) {
    throw new Error('FrontmatterEditor parts must be used within <FrontmatterEditor>');
  }
  return ctx;
}

interface FrontmatterFieldContextValue {
  name: string;
  value: unknown;
  setValue: (fieldValue: unknown) => void;
  error: string | undefined;
  controlId: string;
  errorId: string;
}

const FrontmatterFieldContext = React.createContext<FrontmatterFieldContextValue | null>(null);

/**
 * The current field's binding — `value`, `setValue`, `error`, and the `id`s for
 * label/error wiring. Use it to bind a control the built-in
 * `FrontmatterFieldControl` doesn't cover (a `Switch`, a tag input, …).
 */
export function useFrontmatterField(): FrontmatterFieldContextValue {
  const ctx = React.useContext(FrontmatterFieldContext);
  if (!ctx) {
    throw new Error('useFrontmatterField / FrontmatterField parts must be used within <FrontmatterField>');
  }
  return ctx;
}

export interface FrontmatterEditorProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  /** The frontmatter object (controlled). */
  value: FrontmatterValue;
  /** Receives the next object whenever a field changes. */
  onValueChange: (value: FrontmatterValue) => void;
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
 * composes one `FrontmatterField` per key and owns every label, hint, control,
 * and validation rule. Controlled: pass `value` + `onValueChange`, and `errors`
 * computed by your own validator.
 */
export function FrontmatterEditor({
  value,
  onValueChange,
  errors = {},
  className,
  children,
  ...props
}: FrontmatterEditorProps) {
  const ctx: FrontmatterContextValue = {
    value,
    setField: (name, fieldValue) => onValueChange({ ...value, [name]: fieldValue }),
    errors,
  };
  return (
    <FrontmatterContext.Provider value={ctx}>
      <div data-slot="frontmatter-editor" className={cn('flex flex-col gap-5', className)} {...props}>
        {children}
      </div>
    </FrontmatterContext.Provider>
  );
}

export interface FrontmatterFieldProps extends React.ComponentProps<typeof Field> {
  /** Frontmatter key this field binds to. */
  name: string;
}

/**
 * One field of a `FrontmatterEditor`, bound to `name`. Renders a `Field` group
 * and provides the field binding to its parts; compose
 * `FrontmatterFieldLabel` + `FrontmatterFieldControl` + `FrontmatterFieldError`
 * (and optionally `FrontmatterFieldDescription`) as children.
 */
export function FrontmatterField({ name, children, ...props }: FrontmatterFieldProps) {
  const ctx = useFrontmatterContext();
  const controlId = React.useId();
  const errorId = React.useId();
  const error = ctx.errors[name];

  const fieldCtx: FrontmatterFieldContextValue = {
    name,
    value: ctx.value[name],
    setValue: (fieldValue) => ctx.setField(name, fieldValue),
    error,
    controlId,
    errorId,
  };

  return (
    <FrontmatterFieldContext.Provider value={fieldCtx}>
      <Field data-invalid={error ? true : undefined} {...props}>
        {children}
      </Field>
    </FrontmatterFieldContext.Provider>
  );
}

/** Label for the current field; wires `htmlFor` to its control. Copy is `children`. */
export function FrontmatterFieldLabel(props: React.ComponentProps<typeof FieldLabel>) {
  const field = useFrontmatterField();
  return <FieldLabel htmlFor={field.controlId} {...props} />;
}

/** Supplementary hint under a field. Copy is `children`. */
export function FrontmatterFieldDescription(props: React.ComponentProps<typeof FieldDescription>) {
  return <FieldDescription {...props} />;
}

export interface FrontmatterFieldControlProps {
  /**
   * The control element to bind — e.g. `<Input placeholder="my-skill" />` or
   * `<Textarea />`. It receives `id`, `value`, `onChange`, and invalid-state
   * a11y props; for string fields. Any `value`/`onChange` on the element are
   * overridden. For non-text controls, use `useFrontmatterField()` instead.
   */
  render: React.ReactElement;
}

/** Binds a text control (`Input` / `Textarea`) to the current field's string value. */
export function FrontmatterFieldControl({ render }: FrontmatterFieldControlProps) {
  const field = useFrontmatterField();
  return React.cloneElement(render as React.ReactElement<Record<string, unknown>>, {
    id: field.controlId,
    value: (field.value ?? '') as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.setValue(event.target.value),
    'aria-invalid': field.error ? true : undefined,
    'aria-describedby': field.error ? field.errorId : undefined,
  });
}

/** Renders the current field's validation message (from the Root `errors`), if any. */
export function FrontmatterFieldError(props: React.ComponentProps<typeof FieldError>) {
  const field = useFrontmatterField();
  if (!field.error) return null;
  return (
    <FieldError id={field.errorId} {...props}>
      {field.error}
    </FieldError>
  );
}
