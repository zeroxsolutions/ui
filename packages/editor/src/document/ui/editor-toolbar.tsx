'use client';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import { Separator } from '@zeroxsolutions/ui/components/ui/separator';
import type { IEditor, ToolbarItem } from '../core/index.js';
import { useEditorChanges } from './use-editor-changes.js';

/**
 * The fixed/inline formatting toolbar (task 8.4), composed from the house
 * design-system `Button`. Each button dispatches its feature's command through
 * the `IEditor` façade and reflects `isActive(activeWhen)` as a pressed state —
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
    <div role="toolbar" data-editor-toolbar className={className} style={{ display: 'flex', gap: 2 }}>
      {items.map((item, index) => {
        const active = item.activeWhen ? editor.isActive(item.activeWhen) : false;
        const separator = index > 0 && item.id.startsWith('sep');
        return (
          <span key={item.id} style={{ display: 'contents' }}>
            {separator && <Separator orientation="vertical" />}
            <Button
              type="button"
              size="sm"
              variant={active ? 'secondary' : 'ghost'}
              aria-pressed={active}
              aria-label={item.title}
              title={item.title}
              onClick={() => editor.run(item.command, item.args)}
            >
              {item.icon ?? item.title}
            </Button>
          </span>
        );
      })}
    </div>
  );
}
