'use client';

import { useEffect, useState } from 'react';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@zeroxsolutions/ui/components/ui/popover';
import { Separator } from '@zeroxsolutions/ui/components/ui/separator';
import type { BlockMenuItem, IEditor } from '../core/index.js';

/**
 * The block drag-handle menu (task 8.3): a handle that tracks the hovered block
 * and opens a house-design-system `Popover` of block actions (turn-into,
 * duplicate, delete, …) dispatched through the `IEditor` façade. The handle
 * position is read from the block's DOM rect — engine-free. (Full drag-to-reorder
 * rides the MIT drag-handle engine extension via the `advanced` escape; this
 * ships the menu + handle.)
 */
export interface BlockMenuProps {
  editor: IEditor;
  items: BlockMenuItem[];
  /** The editor's DOM root; the handle tracks blocks inside it. */
  container?: HTMLElement | null;
}

function blockUnder(container: HTMLElement, clientY: number): HTMLElement | null {
  const surface = container.querySelector('.ProseMirror') ?? container;
  for (const child of Array.from(surface.children)) {
    const rect = child.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) return child as HTMLElement;
  }
  return null;
}

export function BlockMenu({ editor, items, container }: BlockMenuProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!container) return;
    const onMove = (event: MouseEvent) => {
      const block = blockUnder(container, event.clientY);
      if (!block) return;
      const rect = block.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left - 28 });
    };
    container.addEventListener('mousemove', onMove);
    return () => container.removeEventListener('mousemove', onMove);
  }, [container]);

  if (!pos) return null;
  return (
    <div
      data-block-menu
      className="fixed z-40"
      style={{ top: pos.top, left: pos.left }}
    >
      <Popover>
        <PopoverTrigger
          aria-label="Block actions"
          title="Block actions"
          className="flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground opacity-60 transition hover:bg-accent hover:opacity-100"
        >
          ⋮⋮
        </PopoverTrigger>
        <PopoverContent align="start" side="left" className="w-52 p-1">
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <span key={item.id} className="contents">
                {item.separatorBefore && <Separator className="my-1" />}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => editor.run(item.command, item.args)}
                >
                  {item.icon ?? item.title}
                </Button>
              </span>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
