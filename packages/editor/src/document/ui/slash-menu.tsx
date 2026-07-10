'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@zeroxsolutions/ui/components/ui/command';
import type { IEditor, SlashItem } from '../core/index.js';
import { groupByHeading } from './collect-ui-contributions.js';
import { selectionRect, type Point } from './selection-rect.js';

/**
 * The slash (`/`) insert menu (task 8.1): a house-design-system `Command` (cmdk)
 * palette of the features' slash items, opened by typing `/` at an empty caret
 * and positioned at the browser caret rect. Selecting an item dispatches its
 * command through the `IEditor` façade. The `/` keystroke is intercepted (never
 * inserted), so no document mutation is needed to "remove" it.
 */
export interface SlashMenuProps {
  editor: IEditor;
  items: SlashItem[];
}

export function SlashMenu({ editor, items }: SlashMenuProps) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<Point | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        setOpen(false);
        editor.focus();
        return;
      }
      if (
        event.key === '/' &&
        editor.isEditable() &&
        editor.isFocused() &&
        editor.getSelection().empty
      ) {
        event.preventDefault();
        setPoint(selectionRect());
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editor, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const select = (item: SlashItem) => {
    setOpen(false);
    editor.run(item.command, item.args);
    editor.focus();
  };

  return (
    <div
      data-slash-menu
      style={{
        position: 'fixed',
        top: point ? point.bottom : 0,
        left: point ? point.left : 0,
        zIndex: 50,
        width: 280,
      }}
    >
      <Command>
        <CommandInput ref={inputRef} placeholder="Filter blocks…" />
        <CommandList>
          <CommandEmpty>No matching blocks</CommandEmpty>
          {groupByHeading(items).map(([heading, groupItems]) => (
            <CommandGroup key={heading} heading={heading}>
              {groupItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${(item.keywords ?? []).join(' ')}`}
                  onSelect={() => select(item)}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                  {item.description && (
                    <span style={{ opacity: 0.6 }}>{item.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}
