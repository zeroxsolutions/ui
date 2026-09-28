import { useState, type ComponentProps, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/registry/bases/base-ui/ui/alert-dialog';
import { Button } from '@/registry/bases/base-ui/ui/button';

interface ConfirmButtonProps {
  title: string;
  description?: ReactNode;
  /** Label of the confirming action button inside the dialog. */
  actionLabel: string;
  /** Label of the dismissing button inside the dialog. */
  cancelLabel?: ReactNode;
  /** Render the confirm action in the destructive (red) variant. */
  destructive?: boolean;
  /** Runs only after the user confirms. */
  onConfirm: () => void | Promise<void>;
  /** Trigger button contents (icon + label). */
  children: ReactNode;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  disabled?: boolean;
  className?: string;
}

/**
 * A button that gates its action behind an `AlertDialog` confirm. Owns its own
 * open-state, so a list of destructive rows each get an independent confirm
 * without the parent juggling one dialog per row. For callers that already own
 * the trigger elsewhere, drive `AlertDialog` directly instead.
 */
function ConfirmButton({
  title,
  description,
  actionLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  children,
  variant = 'outline',
  size = 'sm',
  disabled,
  className,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction variant={destructive ? 'destructive' : 'default'} onClick={() => void onConfirm()}>
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { ConfirmButton };
