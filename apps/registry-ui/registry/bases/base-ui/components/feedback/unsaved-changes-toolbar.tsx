'use client';

import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Spinner } from '@/registry/bases/base-ui/ui/spinner';

/** Which edge of the viewport the toolbar floats at. */
type UnsavedChangesToolbarSide = 'top' | 'bottom';

/**
 * Where saving stands: `default` while there are changes to save, `saving` while a save runs, `error`
 * after one failed, `attention` when the person tries to leave with changes unsaved.
 */
type UnsavedChangesToolbarState = 'default' | 'saving' | 'error' | 'attention';

interface UnsavedChangesToolbarContextValue {
  state: UnsavedChangesToolbarState;
  messageId: string;
}

const UnsavedChangesToolbarContext = React.createContext<UnsavedChangesToolbarContextValue | null>(null);

function useUnsavedChangesToolbar(): UnsavedChangesToolbarContextValue {
  const context = React.useContext(UnsavedChangesToolbarContext);
  if (!context) throw new Error('UnsavedChangesToolbar parts must be used within <UnsavedChangesToolbar>');
  return context;
}

interface UnsavedChangesToolbarProps extends React.ComponentProps<'div'> {
  /** The viewport edge it floats at, 16px in; `bottom` when omitted. Carried as `data-side`. */
  side?: UnsavedChangesToolbarSide;
  /** Where saving stands; `default` when omitted. Carried as `data-state`. */
  state?: UnsavedChangesToolbarState;
}

/**
 * A toolbar floating at the top or bottom of the viewport while a form differs from its saved values,
 * on a toast's surface, up to 512px wide. It is a group named by its message. The caller renders it only
 * while there are changes, and writes every word:
 *
 *   <UnsavedChangesToolbar state={state}>
 *     <UnsavedChangesToolbarMessage>You have unsaved changes.</UnsavedChangesToolbarMessage>
 *     <UnsavedChangesToolbarActions>
 *       <UnsavedChangesToolbarReset onClick={reset}>Reset</UnsavedChangesToolbarReset>
 *       <UnsavedChangesToolbarSave onClick={save}>Save changes</UnsavedChangesToolbarSave>
 *     </UnsavedChangesToolbarActions>
 *   </UnsavedChangesToolbar>
 *
 * `error` and `attention` turn the message destructive, and `attention` the ring too.
 */
function UnsavedChangesToolbar({
  side = 'bottom',
  state = 'default',
  className,
  ...props
}: UnsavedChangesToolbarProps): React.ReactNode {
  const messageId = React.useId();
  const context = React.useMemo(() => ({ state, messageId }), [state, messageId]);
  return (
    <UnsavedChangesToolbarContext.Provider value={context}>
      <div
        data-slot="unsaved-changes-toolbar"
        data-side={side}
        data-state={state}
        role="group"
        aria-labelledby={messageId}
        className={cn(
          'group/unsaved-changes-toolbar fixed inset-x-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-popover py-2 pr-2 pl-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 data-[side=bottom]:bottom-4 data-[side=top]:top-4 data-[state=attention]:ring-destructive',
          className,
        )}
        {...props}
      />
    </UnsavedChangesToolbarContext.Provider>
  );
}

/**
 * What the toolbar says, which also names it. A polite live region, so a screen reader reads each new
 * message, such as a failed save, without leaving what the person is doing.
 */
function UnsavedChangesToolbarMessage({ className, ...props }: React.ComponentProps<'p'>): React.ReactNode {
  const { messageId } = useUnsavedChangesToolbar();
  return (
    <p
      data-slot="unsaved-changes-toolbar-message"
      id={messageId}
      role="status"
      aria-live="polite"
      className={cn(
        'min-w-0 flex-1 text-sm leading-none font-medium group-data-[state=attention]/unsaved-changes-toolbar:text-destructive group-data-[state=error]/unsaved-changes-toolbar:text-destructive',
        className,
      )}
      {...props}
    />
  );
}

/** The row holding `UnsavedChangesToolbarReset` and `UnsavedChangesToolbarSave`. */
function UnsavedChangesToolbarActions({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="unsaved-changes-toolbar-actions"
      className={cn('flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  );
}

type UnsavedChangesToolbarActionProps = Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'>;

/**
 * Upstream's small ghost `Button`, which puts the saved values back. Disabled while saving, and kept
 * focusable then, so focus stays where it was.
 */
function UnsavedChangesToolbarReset({
  disabled,
  className,
  ...props
}: UnsavedChangesToolbarActionProps): React.ReactNode {
  const { state } = useUnsavedChangesToolbar();
  return (
    <Button
      data-slot="unsaved-changes-toolbar-reset"
      variant="ghost"
      size="sm"
      disabled={state === 'saving' || disabled}
      focusableWhenDisabled
      className={cn('data-disabled:pointer-events-none data-disabled:opacity-50', className)}
      {...props}
    />
  );
}

/**
 * Upstream's small `Button`, which saves. While saving it is disabled, kept focusable so focus stays on
 * it, and shows a spinner before its children, which the caller changes to say so (`Saving...`). The
 * spinner is hidden from a screen reader, which hears the message instead.
 */
function UnsavedChangesToolbarSave({
  disabled,
  className,
  children,
  ...props
}: UnsavedChangesToolbarActionProps): React.ReactNode {
  const { state } = useUnsavedChangesToolbar();
  const saving = state === 'saving';
  return (
    <Button
      data-slot="unsaved-changes-toolbar-save"
      size="sm"
      disabled={saving || disabled}
      focusableWhenDisabled
      className={cn('data-disabled:pointer-events-none data-disabled:opacity-50', className)}
      {...props}
    >
      {saving && <Spinner data-icon="inline-start" aria-hidden />}
      {children}
    </Button>
  );
}

export {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
};
export type { UnsavedChangesToolbarSide, UnsavedChangesToolbarState };
