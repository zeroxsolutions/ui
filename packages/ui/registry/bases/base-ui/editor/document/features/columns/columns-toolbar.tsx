'use client';

import type { ReactNode } from 'react';
import { ArrowDownIcon } from '@/registry/bases/base-ui/icons/lucide/arrow-down-icon';
import { ArrowUpIcon } from '@/registry/bases/base-ui/icons/lucide/arrow-up-icon';
import { ChevronsDownUpIcon } from '@/registry/bases/base-ui/icons/lucide/chevrons-down-up-icon';
import { MinusIcon } from '@/registry/bases/base-ui/icons/lucide/minus-icon';
import { PlusIcon } from '@/registry/bases/base-ui/icons/lucide/plus-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { VALIGNS, type VAlign } from '@zeroxsolutions/editor-core/template/layout/index';
import { BlockToolbar } from '../../layout/block-toolbar';
import type { LayoutWords } from '../../layout/layout-words';
import { ChromeControl } from '../../ui/chrome-icon';

/** The fewest lanes a columns block holds. */
const LANES_MIN = 2;

const VALIGN_ICONS = {
  top: ArrowUpIcon,
  center: ChevronsDownUpIcon,
  bottom: ArrowDownIcon,
} as const satisfies Record<VAlign, unknown>;

export interface ColumnsToolbarProps {
  editor: IEditor;
  /** Where the columns block starts, as its view's `getPos()` reads it. */
  pos: number | undefined;
  /** The columns block's element, which the toolbar sits above. */
  anchor: HTMLElement | null;
  /** How many lanes the block holds. */
  lanes: number;
  /** The most lanes the editor lets the block hold. */
  maxLanes: number;
  /** Where the lanes' blocks sit; a block that sets none reads as `top`. */
  valign: VAlign | null | undefined;
  words: LayoutWords;
  /** Called with the lane count picked: one more or one fewer than `lanes`. */
  onLanes(lanes: number): void;
  onValign(valign: VAlign): void;
}

/** A button of the toolbar, named and shown in a tooltip from words. */
function ColumnsToolbarButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: unknown;
  label: string;
  disabled: boolean;
  onClick(): void;
}): ReactNode {
  return (
    <ChromeControl
      icon={icon}
      iconSized="toolbar"
      render={(control) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                disabled={disabled}
                onClick={onClick}
                {...control}
              />
            }
          />
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}

/**
 * A columns block's floating toolbar: add a lane at the end and remove the last one, between two lanes and
 * `maxLanes`, and where the lanes' blocks sit against the tallest.
 */
export function ColumnsToolbar({
  editor,
  pos,
  anchor,
  lanes,
  maxLanes,
  valign,
  words,
  onLanes,
  onValign,
}: ColumnsToolbarProps): ReactNode {
  return (
    <BlockToolbar editor={editor} pos={pos} anchor={anchor} label={words.toolbar}>
      <ColumnsToolbarButton
        icon={PlusIcon}
        label={words.addColumn}
        disabled={lanes >= maxLanes}
        onClick={() => onLanes(lanes + 1)}
      />
      <ColumnsToolbarButton
        icon={MinusIcon}
        label={words.removeColumn}
        disabled={lanes <= LANES_MIN}
        onClick={() => onLanes(lanes - 1)}
      />
      <Separator orientation="vertical" className="cn-editor-toolbar-separator data-vertical:self-center" />
      <ToggleGroup
        aria-label={words.verticalAlign}
        size="sm"
        value={[valign ?? 'top']}
        // At the group's edge the arrow keys go on to the toolbar's next control.
        loopFocus={false}
        onValueChange={(values) => {
          const [picked] = values as VAlign[];
          if (picked !== undefined) onValign(picked);
        }}
      >
        {VALIGNS.map((value) => (
          <ChromeControl
            key={value}
            icon={VALIGN_ICONS[value]}
            iconSized="toolbar"
            render={(control) => (
              <Tooltip>
                <TooltipTrigger
                  render={<ToggleGroupItem value={value} aria-label={words.valigns[value]} {...control} />}
                />
                <TooltipContent>{words.valigns[value]}</TooltipContent>
              </Tooltip>
            )}
          />
        ))}
      </ToggleGroup>
    </BlockToolbar>
  );
}
