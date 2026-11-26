'use client';

import { useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { IEditor, ToolbarItem } from '@zeroxsolutions/editor-core/document/core/index';
import { ChromeControl } from './chrome-icon';
import { useEditorChanges } from './use-editor-changes';

/**
 * The fixed/inline formatting toolbar (task 8.4), composed from the house
 * design-system `Toggle` (native pressed state) wrapped in a `Tooltip`, with a
 * `Separator` between groups. Each button dispatches its feature's command through
 * the `IEditor` façade and reflects `isActive(activeWhen)` as its pressed state —
 * no engine reference. Re-renders on every editor change via `useEditorChanges`.
 */
export interface EditorToolbarProps {
  editor: IEditor;
  items: ToolbarItem[];
  /**
   * Controls a host draws after the items, past a separator, such as a picker that opens a list. Each is drawn in
   * the items' style, as `EditorToolbarComboboxTrigger` draws one, inside this provider. They join the arrow-key
   * order; a host disables them itself when it passes `disabled`.
   */
  end?: ReactNode;
  /** Disables every item, as while the editor is out of sight. */
  disabled?: boolean;
  className?: string;
}

/** The toolbar's enabled controls, the `end` slot's included, in document order. */
function editorToolbarControls(toolbar: HTMLElement | null): HTMLElement[] {
  return [...(toolbar?.querySelectorAll<HTMLElement>('button') ?? [])].filter(
    (control) => !control.matches(':disabled'),
  );
}

const EDITOR_TOOLBAR_STEPS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

export function EditorToolbar({ editor, items, end, disabled = false, className }: EditorToolbarProps) {
  // Subscribe so pressed states track the selection.
  useEditorChanges(editor);

  // One Tab stop, the control focused last; the arrow keys, Home and End move between the controls (WAI-ARIA APG,
  // Toolbar). The `end` slot's controls are the host's, so the tab order is set on the DOM after each render.
  const toolbar = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const rove = (index: number) => {
    const controls = editorToolbarControls(toolbar.current);
    current.current = Math.max(0, Math.min(index, controls.length - 1));
    controls.forEach((control, at) => {
      control.tabIndex = at === current.current ? 0 : -1;
    });
    return controls;
  };
  useLayoutEffect(() => {
    rove(current.current);
  });
  const focus = (event: FocusEvent<HTMLDivElement>) => {
    const index = editorToolbarControls(toolbar.current).indexOf(event.target as HTMLElement);
    if (index >= 0) rove(index);
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Shift, Ctrl, Alt and Meta with these keys are the platform's or the page's, not the toolbar's.
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    const step = EDITOR_TOOLBAR_STEPS[event.key];
    const controls = editorToolbarControls(toolbar.current);
    // A popup an `end` control opened is a React child, so its keys arrive here too; they are its own.
    const index = controls.indexOf(event.target as HTMLElement);
    if (!step || index < 0) return;
    event.preventDefault();
    rove(step(index, controls.length))[current.current]?.focus();
  };

  return (
    <div
      ref={toolbar}
      role="toolbar"
      data-slot="editor-toolbar"
      aria-disabled={disabled || undefined}
      className={cn('cn-editor-toolbar flex flex-wrap items-center bg-popover', className)}
      onFocus={focus}
      onKeyDown={keyDown}
    >
      <TooltipProvider>
        {items.map((item, index) => {
          const active = item.activeWhen ? editor.isActive(item.activeWhen) : false;
          const separator = index > 0 && item.id.startsWith('sep');
          return (
            <span key={item.id} className="contents">
              {separator && (
                <Separator orientation="vertical" className="cn-editor-toolbar-separator data-vertical:self-center" />
              )}
              <ChromeControl
                icon={item.icon}
                fallback={item.title}
                iconSized="toolbar"
                render={(control) => (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Toggle
                          size="sm"
                          pressed={active}
                          disabled={disabled}
                          aria-label={item.title}
                          onPressedChange={() => editor.run(item.command, item.args)}
                          {...control}
                        />
                      }
                    />
                    <TooltipContent>{item.title}</TooltipContent>
                  </Tooltip>
                )}
              />
            </span>
          );
        })}
        {end && items.length > 0 && (
          <Separator orientation="vertical" className="cn-editor-toolbar-separator data-vertical:self-center" />
        )}
        {end}
      </TooltipProvider>
    </div>
  );
}
