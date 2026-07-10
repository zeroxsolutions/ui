'use client';

import { Separator } from '@zeroxsolutions/ui/components/ui/separator';
import { Toggle } from '@zeroxsolutions/ui/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@zeroxsolutions/ui/components/ui/tooltip';
import type { IEditor, ToolbarItem } from '../core/index.js';
import { useEditorChanges } from './use-editor-changes.js';

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
  className?: string;
}

export function EditorToolbar({ editor, items, className }: EditorToolbarProps) {
  // Subscribe so pressed states track the selection.
  useEditorChanges(editor);
  return (
    <div
      role="toolbar"
      data-editor-toolbar
      className={[
        'flex flex-wrap items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TooltipProvider>
        {items.map((item, index) => {
          const active = item.activeWhen ? editor.isActive(item.activeWhen) : false;
          const separator = index > 0 && item.id.startsWith('sep');
          return (
            <span key={item.id} className="contents">
              {separator && <Separator orientation="vertical" className="mx-0.5 h-5" />}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Toggle
                      size="sm"
                      pressed={active}
                      aria-label={item.title}
                      onPressedChange={() => editor.run(item.command, item.args)}
                    >
                      {item.icon ?? item.title}
                    </Toggle>
                  }
                />
                <TooltipContent>{item.title}</TooltipContent>
              </Tooltip>
            </span>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
