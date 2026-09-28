import * as React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface IconChipProps {
  /** The glyph node, sized by the caller (e.g. `<Eye className="size-3" />`). */
  icon: React.ReactNode;
  /** Tooltip text, and the chip's accessible name when it is a string. */
  label: React.ReactNode;
  /** Consumer className for the tinted container (background + text colour). The
   *  design system ships no colour of its own - the tint comes from here. */
  tint?: string;
  /** Extra classes merged onto the tinted container. */
  className?: string;
}

/**
 * A generic tinted-icon-plus-tooltip chip: a small square holding an `icon`,
 * coloured by a consumer-supplied `tint` class, with `label` shown on hover as a
 * tooltip (and used as the accessible name when it is a string). It carries no
 * capability taxonomy of its own - the caller decides what each chip means, so
 * one visual serves model abilities, generation types, or any icon/label/tint
 * triple.
 * @example <IconChip icon={<Eye className="size-3" />} label="Vision input" tint="bg-emerald-500/15 text-emerald-600" />
 */
function IconChip({ icon, label, tint, className }: IconChipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={typeof label === 'string' ? label : undefined}
            data-slot="icon-chip"
            className={cn('flex size-5 items-center justify-center rounded-[5px]', tint, className)}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export { IconChip };
