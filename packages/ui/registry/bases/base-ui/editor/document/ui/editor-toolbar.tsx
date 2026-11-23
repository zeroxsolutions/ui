'use client';

import type { ReactNode } from 'react';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { IEditor, ToolbarItem } from '@zeroxsolutions/editor-core/document/core/index';
import { CHROME_ICON_CLASS, ChromeControl } from './chrome-icon';
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
   * the items' style, `toggleVariants({ size: 'sm' })` with its icon and a `Tooltip`, inside this provider.
   */
  end?: ReactNode;
  className?: string;
}

export function EditorToolbar({ editor, items, end, className }: EditorToolbarProps) {
  // Subscribe so pressed states track the selection.
  useEditorChanges(editor);
  return (
    <div
      role="toolbar"
      data-slot="editor-toolbar"
      className={cn('cn-editor-toolbar flex flex-wrap items-center gap-0.5 bg-popover', className)}
    >
      <TooltipProvider>
        {items.map((item, index) => {
          const active = item.activeWhen ? editor.isActive(item.activeWhen) : false;
          const separator = index > 0 && item.id.startsWith('sep');
          return (
            <span key={item.id} className="contents">
              {separator && <Separator orientation="vertical" className="mx-0.5 h-5" />}
              <ChromeControl
                icon={item.icon}
                fallback={item.title}
                iconClassName={CHROME_ICON_CLASS}
                render={(control) => (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Toggle
                          size="sm"
                          pressed={active}
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
        {end && items.length > 0 && <Separator orientation="vertical" className="mx-0.5 h-5" />}
        {end}
      </TooltipProvider>
    </div>
  );
}
