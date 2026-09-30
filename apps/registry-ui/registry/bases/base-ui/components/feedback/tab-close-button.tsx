'use client';

import * as React from 'react';

import { UnsavedIndicator } from '@/registry/bases/base-ui/components/feedback/unsaved-indicator';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { XIcon, type XIconHandle } from '@/registry/bases/base-ui/ui/x';

interface TabCloseButtonProps extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  /** Show the unsaved dot in place of the X until the tab reveals it. */
  dirty?: boolean;
}

/**
 * The trailing control on an editor tab. A dirty tab shows the unsaved dot, and
 * the X takes its place while the nearest `group/tab` ancestor is hovered or
 * carries `data-active`, or while the button has keyboard focus; give the tab
 * `className="group/tab"`. A click never reaches the tab, so closing a tab does
 * not also activate it. The X plays while the button is hovered or focused; a
 * caller's pointer and focus handlers still run.
 */
function TabCloseButton({
  dirty = false,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: TabCloseButtonProps): React.ReactNode {
  const iconRef = React.useRef<XIconHandle>(null);

  return (
    <Button
      data-slot="tab-close-button"
      data-dirty={dirty ? '' : undefined}
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Close"
      className={cn('group/tab-close-button', className)}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      {dirty && (
        <UnsavedIndicator className="group-hover/tab:hidden group-focus-visible/tab-close-button:hidden group-data-active/tab:hidden" />
      )}
      <XIcon
        ref={iconRef}
        data-slot="tab-close-button-icon"
        aria-hidden
        className="group-data-dirty/tab-close-button:hidden group-data-dirty/tab-close-button:group-hover/tab:block group-data-dirty/tab-close-button:group-focus-visible/tab-close-button:block group-data-dirty/tab-close-button:group-data-active/tab:block"
      />
    </Button>
  );
}

export { TabCloseButton };
export type { TabCloseButtonProps };
