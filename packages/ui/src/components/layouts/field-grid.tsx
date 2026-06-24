import type { ReactNode } from 'react';

interface FieldGridProps {
  /** Number of columns. Defaults to 2 (most common in property panels). */
  cols?: 1 | 2 | 3 | 4;
  children: ReactNode;
}

const COLS_CLASS: Record<NonNullable<FieldGridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

/**
 * Standard tight grid wrapper for paired/triplet inputs (X+Y, W+H,
 * opacity+blend, count+gutter+margin, …). Keeps spacing consistent across every
 * section.
 */
export function FieldGrid({ cols = 2, children }: FieldGridProps) {
  return (
    <div className={`grid ${COLS_CLASS[cols]} gap-x-2 gap-y-1`}>{children}</div>
  );
}
