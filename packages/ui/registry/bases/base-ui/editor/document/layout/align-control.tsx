'use client';

import type { ReactNode } from 'react';
import { TextAlignCenterIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-center-icon';
import { TextAlignEndIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-end-icon';
import { TextAlignStartIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-start-icon';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { ALIGNS, type LayoutAlign } from '@zeroxsolutions/editor-core/template/layout/index';
import { ChromeControl } from '../ui/chrome-icon';
import type { LayoutWords } from './layout-words';

const ALIGN_ICONS = {
  start: TextAlignStartIcon,
  center: TextAlignCenterIcon,
  end: TextAlignEndIcon,
} as const satisfies Record<LayoutAlign, unknown>;

export interface AlignControlProps {
  /** The block's alignment; a block that sets none reads as `start`. */
  value: LayoutAlign | null | undefined;
  /** Called with the place picked; pressing the one already picked keeps it. */
  onChange(align: LayoutAlign): void;
  words: LayoutWords;
  disabled?: boolean;
}

/**
 * Where a block sits across its line: a toggle group of start, centre and end, each named and shown in a tooltip
 * from words. Drawn inside a `TooltipProvider`, as `BlockToolbar` draws its controls.
 */
export function AlignControl({ value, onChange, words, disabled = false }: AlignControlProps): ReactNode {
  return (
    <ToggleGroup
      aria-label={words.align}
      size="sm"
      value={[value ?? 'start']}
      disabled={disabled}
      // At the group's edge the arrow keys go on to the toolbar's next control.
      loopFocus={false}
      onValueChange={(values) => {
        const [picked] = values as LayoutAlign[];
        if (picked !== undefined) onChange(picked);
      }}
    >
      {ALIGNS.map((align) => (
        <ChromeControl
          key={align}
          icon={ALIGN_ICONS[align]}
          iconSized
          render={(control) => (
            <Tooltip>
              <TooltipTrigger
                render={<ToggleGroupItem value={align} aria-label={words.aligns[align]} {...control} />}
              />
              <TooltipContent>{words.aligns[align]}</TooltipContent>
            </Tooltip>
          )}
        />
      ))}
    </ToggleGroup>
  );
}
