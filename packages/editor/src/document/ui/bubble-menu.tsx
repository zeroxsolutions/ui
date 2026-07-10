'use client';

import { useEffect, useState } from 'react';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import type { BubbleItem, IEditor } from '../core/index.js';
import { selectionRect, selectionWithin, type Point } from './selection-rect.js';

/**
 * The selection bubble menu (task 8.2): a floating formatting bar that appears
 * over a non-empty text selection. It reads the browser selection geometry (not
 * the engine) to position itself and dispatches its buttons' commands through the
 * `IEditor` façade. The floating "+" affordance for an empty line reuses the
 * slash menu's `/` trigger, so it is not duplicated here.
 */
export interface BubbleMenuProps {
  editor: IEditor;
  items: BubbleItem[];
  /** The editor's DOM root, to scope the selection to this editor. */
  container?: HTMLElement | null;
}

export function BubbleMenu({ editor, items, container }: BubbleMenuProps) {
  const [rect, setRect] = useState<Point | null>(null);

  useEffect(() => {
    const update = () => {
      const active =
        editor.isEditable() &&
        !editor.getSelection().empty &&
        selectionWithin(container ?? null);
      setRect(active ? selectionRect() : null);
    };
    update();
    document.addEventListener('selectionchange', update);
    const off = editor.onChange(update);
    return () => {
      document.removeEventListener('selectionchange', update);
      off();
    };
  }, [editor, container]);

  if (!rect) return null;
  return (
    <div
      role="toolbar"
      data-bubble-menu
      style={{
        position: 'fixed',
        top: Math.max(0, rect.top - 44),
        left: rect.left,
        zIndex: 50,
        display: 'flex',
        gap: 2,
      }}
    >
      {items.map((item) => (
        <Button
          key={item.id}
          type="button"
          size="sm"
          variant={item.activeWhen && editor.isActive(item.activeWhen) ? 'secondary' : 'ghost'}
          aria-pressed={item.activeWhen ? editor.isActive(item.activeWhen) : undefined}
          aria-label={item.title}
          title={item.title}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.run(item.command, item.args)}
        >
          {item.icon ?? item.title}
        </Button>
      ))}
    </div>
  );
}
