'use client';

import * as React from 'react';

import { UnsavedIndicator } from '@/registry/bases/base-ui/components/feedback/unsaved-indicator';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Item, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import { XIcon, type XIconHandle } from '@/registry/bases/base-ui/ui/x';

interface EditorTabProps extends Omit<React.ComponentProps<typeof Item>, 'variant' | 'size'> {
  /** The tab of the document on show; carried as `data-active`. */
  active?: boolean;
  /** The document has unsaved changes; carried as `data-dirty`. */
  dirty?: boolean;
}

/**
 * One tab in an editor's tab strip, an outline `Item` that hugs its content. The
 * consumer composes the parts inside upstream `ItemContent` and `ItemActions`:
 *
 *   <EditorTab active dirty>
 *     <ItemContent><EditorTabTitle>page.tsx</EditorTabTitle></ItemContent>
 *     <ItemActions><EditorTabCloseButton aria-label="Close page.tsx" onClick={close} /></ItemActions>
 *   </EditorTab>
 */
function EditorTab({ active = false, dirty = false, className, ...props }: EditorTabProps): React.ReactNode {
  return (
    <Item
      data-slot="editor-tab"
      data-active={active ? '' : undefined}
      data-dirty={dirty ? '' : undefined}
      variant="outline"
      size="xs"
      className={cn('group/editor-tab w-fit', className)}
      {...props}
    />
  );
}

/** The document's name, muted until its tab is active. */
function EditorTabTitle({ className, ...props }: React.ComponentProps<typeof ItemTitle>): React.ReactNode {
  return (
    <ItemTitle
      data-slot="editor-tab-title"
      className={cn('text-muted-foreground group-data-active/editor-tab:text-foreground', className)}
      {...props}
    />
  );
}

/**
 * The tab's trailing close control, named "Close" unless an `aria-label` is
 * given. On a dirty tab it shows the unsaved dot, and the X takes its place
 * while the tab is hovered or active, or while the button has keyboard focus.
 * A click never reaches the tab, so closing a tab does not also activate it.
 * The X plays while the button is hovered or focused; a caller's pointer and
 * focus handlers still run. Both glyphs are always in the tree, and the
 * root's `data-dirty` / `group/editor-tab` decide which one shows.
 */
function EditorTabCloseButton({
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'>): React.ReactNode {
  const iconRef = React.useRef<XIconHandle>(null);

  return (
    <Button
      data-slot="editor-tab-close-button"
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Close"
      className={cn('group/editor-tab-close-button', className)}
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
      <UnsavedIndicator className="hidden group-data-dirty/editor-tab:block group-data-dirty/editor-tab:group-hover/editor-tab:hidden group-data-dirty/editor-tab:group-focus-visible/editor-tab-close-button:hidden group-data-dirty/editor-tab:group-data-active/editor-tab:hidden" />
      <XIcon
        ref={iconRef}
        aria-hidden
        className="group-data-dirty/editor-tab:hidden group-data-dirty/editor-tab:group-hover/editor-tab:block group-data-dirty/editor-tab:group-focus-visible/editor-tab-close-button:block group-data-dirty/editor-tab:group-data-active/editor-tab:block"
      />
    </Button>
  );
}

export { EditorTab, EditorTabTitle, EditorTabCloseButton };
export type { EditorTabProps };
