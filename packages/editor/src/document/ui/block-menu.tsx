'use client';

import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@zeroxsolutions/ui/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@zeroxsolutions/ui/components/ui/tooltip';
import type { BlockMenuItem, IEditor } from '../core/index.js';

/**
 * The block drag-handle menu (task 8.3): a handle that tracks the hovered block
 * and opens a house-design-system `DropdownMenu` of block actions (turn-into,
 * duplicate, delete, …) dispatched through the `IEditor` façade. The handle is the
 * menu's trigger, tooltip-labeled; the handle position is read from the block's DOM
 * rect — engine-free. (Full drag-to-reorder rides the MIT drag-handle engine
 * extension via the `advanced` escape; this ships the menu + handle.)
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
    <div data-slot="block-menu" className="fixed z-40" style={{ top: pos.top, left: pos.left }}>
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger
              render={
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Block actions"
                      className="flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground opacity-60 transition hover:bg-accent hover:opacity-100"
                    >
                      ⋮⋮
                    </button>
                  }
                />
              }
            />
            <TooltipContent side="left">Block actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" side="left" className="w-52">
            {items.map((item) => (
              <span key={item.id} className="contents">
                {item.separatorBefore && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  variant={item.id === 'delete' ? 'destructive' : 'default'}
                  onClick={() => editor.run(item.command, item.args)}
                >
                  {item.icon ?? item.title}
                </DropdownMenuItem>
              </span>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
