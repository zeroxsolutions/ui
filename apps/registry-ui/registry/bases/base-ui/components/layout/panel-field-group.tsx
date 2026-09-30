import type { ComponentProps, CSSProperties, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface PanelFieldGroupProps extends ComponentProps<'div'> {
  /**
   * Column count, written to the `--cols` variable the grid template reads, so a
   * count known only at runtime (`cols={axes.length}`) works. Omit it for one
   * column, or pass a `grid-cols-*` class, which replaces the template.
   */
  cols?: number;
}

/**
 * The tight grid for paired and triplet inputs (X + Y, W + H, count + gutter +
 * margin) in a property panel: one gutter decision, any number of columns.
 */
function PanelFieldGroup({ cols, className, style, ...props }: PanelFieldGroupProps): ReactNode {
  return (
    <div
      data-slot="panel-field-group"
      className={cn(
        'grid grid-cols-(--panel-field-group-columns) gap-x-2 gap-y-1 [--panel-field-group-columns:repeat(var(--cols,1),minmax(0,1fr))]',
        className,
      )}
      style={cols === undefined ? style : ({ '--cols': cols, ...style } as CSSProperties)}
      {...props}
    />
  );
}

export { PanelFieldGroup };
export type { PanelFieldGroupProps };
