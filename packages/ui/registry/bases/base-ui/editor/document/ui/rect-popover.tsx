'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { rectAnchor, type RectLike } from './selection-rect';

/**
 * A popover popup anchored to a viewport rect (a caret or a selection) rather
 * than to a trigger. The vendored `PopoverContent` forwards no `anchor` to its
 * positioner, so this composes Base UI's parts directly, with that popup's slots.
 */
function RectPopover({
  rect,
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'> & {
    rect: RectLike | null;
  }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        anchor={rectAnchor(rect)}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'cn-popover-content cn-popover-content-logical z-50 w-72 origin-(--transform-origin) outline-hidden',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { RectPopover };
