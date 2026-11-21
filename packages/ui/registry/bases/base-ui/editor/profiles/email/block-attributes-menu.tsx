'use client';

import { useEffect, useState } from 'react';
import { EllipsisVerticalIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { EMAIL_BLOCK_ATTRIBUTES, emailBlockAt, type EmailBlockState } from './email-kit';

const ATTRIBUTE_TITLES: Record<string, string> = {
  align: 'Align',
  spaceAfter: 'Space after',
  tone: 'Tone',
  width: 'Width',
};

const VALUE_TITLES: Record<string, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  default: 'Default',
  muted: 'Muted',
  inline: 'Fit the label',
  full: 'Full width',
};

/** What an attribute reads as while the block does not set it: the house renderer's own default. */
const DEFAULTS: Record<string, string> = {
  align: 'left',
  spaceAfter: 'medium',
  tone: 'default',
  width: 'inline',
};

/** The lane shares offered for each lane count, the block's own included when it is none of them. */
function ratioChoices(current: readonly number[], maxLanes: number): number[][] {
  const choices: number[][] = [];
  for (let lanes = 2; lanes <= maxLanes; lanes += 1) {
    choices.push(Array.from({ length: lanes }, () => 1));
    if (lanes === 2) choices.push([2, 1], [1, 2]);
    if (lanes === 3) choices.push([1, 2, 1]);
  }
  const key = current.join(':');
  return choices.some((choice) => choice.join(':') === key) ? choices : [...choices, [...current]];
}

function deleteReason(block: EmailBlockState): string | null {
  if (block.locked) return 'The structure is locked: only text and variables change';
  if (block.required) return 'This block is required';
  return null;
}

export interface BlockAttributesMenuProps {
  editor: IEditor;
}

/**
 * The email block menu: beside the block the selection is in, the attributes its kind takes, the lanes of
 * the columns it sits in, and Delete, which is disabled, with its reason, on a required block or in locked
 * structure.
 */
export function BlockAttributesMenu({ editor }: BlockAttributesMenuProps) {
  const [block, setBlock] = useState(() => emailBlockAt(editor));

  useEffect(() => {
    const update = () => setBlock(emailBlockAt(editor));
    update();
    const offSelection = editor.onSelectionUpdate(update);
    const offChange = editor.onChange(update);
    return () => {
      offSelection();
      offChange();
    };
  }, [editor]);

  const rect = block?.element?.getBoundingClientRect();
  if (!block || !rect) return null;

  const attributes = Object.entries(EMAIL_BLOCK_ATTRIBUTES[block.type] ?? {});
  const reason = deleteReason(block);
  const run = (command: string, args?: unknown) => {
    editor.run(command, args);
    editor.focus();
  };

  return (
    <div data-slot="email-block-menu" className="fixed z-40" style={{ top: rect.top, left: rect.left - 28 }}>
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger
              render={
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Block actions"
                      className="text-muted-foreground size-6 opacity-60 hover:opacity-100"
                    >
                      <EllipsisVerticalIcon aria-hidden />
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="left">Block actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" side="left" className="w-56">
            {attributes.map(([name, values]) => (
              <DropdownMenuGroup key={name}>
                <DropdownMenuLabel>{ATTRIBUTE_TITLES[name] ?? name}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={(block.attrs[name] as string | null) ?? DEFAULTS[name]}
                  onValueChange={(value: string) => run('setBlockAttributes', { attrs: { [name]: value } })}
                >
                  {values.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value} disabled={block.locked} closeOnClick>
                      {VALUE_TITLES[value] ?? value}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            ))}
            {block.columns && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={block.columns.ratio.join(':')}
                  onValueChange={(value: string) => run('setColumnsRatio', { ratio: value.split(':').map(Number) })}
                >
                  {ratioChoices(block.columns.ratio, block.maxLanes).map((ratio) => (
                    <DropdownMenuRadioItem
                      key={ratio.join(':')}
                      value={ratio.join(':')}
                      disabled={block.locked}
                      closeOnClick
                    >
                      {ratio.join(' : ')}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            )}
            {(attributes.length > 0 || block.columns) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant="destructive"
              disabled={reason !== null}
              onClick={() => run('deleteBlock')}
              className="items-start"
            >
              <Trash2Icon aria-hidden className="mt-0.5" />
              <span className="flex flex-col gap-0.5">
                <span>Delete</span>
                {reason && <span className="text-muted-foreground text-xs">{reason}</span>}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
