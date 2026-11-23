'use client';

import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { CHROME_ICON_CLASS, ChromeControl } from '../ui/chrome-icon';
import type { BlockMenuItem, IEditor } from '@zeroxsolutions/editor-core/document/core/index';

export interface EditorBlockMenuProps {
  editor: IEditor;
  items: BlockMenuItem[];
  open: boolean;
  onOpenChange(open: boolean): void;
  /** Viewport rectangle of the grip the menu opens from; the menu stays there while the grip hides. */
  anchor: { top: number; left: number; width: number; height: number } | null;
}

/** An item that cannot run is dimmed and names why in a tooltip, which a disabled row cannot raise itself. */
function EditorBlockMenuReason({ reason, children }: { reason: string | null; children: ReactNode }) {
  if (reason === null) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="block" />}>{children}</TooltipTrigger>
      <TooltipContent side="left">{reason}</TooltipContent>
    </Tooltip>
  );
}

/** Items sharing a `group`, rendered as one labelled submenu whose checked radio is the item that is `active`. */
function EditorBlockMenuGroup({
  editor,
  label,
  items,
  run,
}: {
  editor: IEditor;
  label: string;
  items: BlockMenuItem[];
  run(item: BlockMenuItem): void;
}) {
  const current = items.find((item) => item.active?.(editor));
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent aria-label={label} className="w-44">
        <DropdownMenuRadioGroup
          value={current?.id ?? ''}
          onValueChange={(id: string) => {
            const item = items.find((candidate) => candidate.id === id);
            if (item) run(item);
          }}
        >
          {items.map((item) => {
            const reason = item.disabledReason?.(editor) ?? null;
            return (
              <EditorBlockMenuReason key={item.id} reason={reason}>
                <DropdownMenuRadioItem value={item.id} disabled={reason !== null} closeOnClick>
                  {item.title}
                </DropdownMenuRadioItem>
              </EditorBlockMenuReason>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * The block actions menu the document editor's grip opens: a feature's `blockMenu` items in the house
 * dropdown, run through the façade. The menu hangs off an invisible trigger at `anchor`, because the grip
 * is the drag extension's own node and cannot be a React trigger.
 */
export function EditorBlockMenu({ editor, items, open, onOpenChange, anchor }: EditorBlockMenuProps) {
  const run = (item: BlockMenuItem) => editor.run(item.command, item.args);
  const seen = new Set<string>();

  return (
    <TooltipProvider>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger
          nativeButton={false}
          tabIndex={-1}
          aria-hidden
          render={<span className="pointer-events-none fixed" />}
          style={anchor ?? { top: 0, left: 0, width: 0, height: 0 }}
        />
        <DropdownMenuContent aria-label="Block actions" align="start" side="bottom" className="w-52" finalFocus={false}>
          {items.map((item) => {
            if (item.group !== undefined) {
              if (seen.has(item.group)) return null;
              seen.add(item.group);
              return (
                <EditorBlockMenuGroup
                  key={`group:${item.group}`}
                  editor={editor}
                  label={item.group}
                  items={items.filter((candidate) => candidate.group === item.group)}
                  run={run}
                />
              );
            }
            const reason = item.disabledReason?.(editor) ?? null;
            return (
              <span key={item.id} className="contents">
                {item.separatorBefore && <DropdownMenuSeparator />}
                <EditorBlockMenuReason reason={reason}>
                  <ChromeControl
                    icon={item.icon}
                    fallback={item.title}
                    iconClassName={CHROME_ICON_CLASS}
                    render={(control) => (
                      <DropdownMenuItem
                        variant={item.id === 'delete' ? 'destructive' : 'default'}
                        disabled={reason !== null}
                        onClick={() => run(item)}
                        {...control}
                      >
                        {control.children}
                        {item.icon != null && item.title}
                      </DropdownMenuItem>
                    )}
                  />
                </EditorBlockMenuReason>
              </span>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
