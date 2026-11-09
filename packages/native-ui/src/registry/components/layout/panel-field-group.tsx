import { Children, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

type PanelFieldGroupProps = ComponentProps<typeof View> & {
  /** Column count, so a count known only at runtime (`cols={axes.length}`) works; one when omitted. */
  cols?: number;
};

/**
 * The tight grid for paired and triplet inputs (X + Y, W + H, count + gutter + margin) in a property panel:
 * one gutter decision, any number of columns. React Native has no grid, so it lays its children in rows of
 * `cols`, each child in an equal share of the row, and fills a short last row with empty cells so the
 * columns line up. `className` styles the group, whose `gap-y-1` parts the rows; the rows' `gap-x-2` is
 * fixed.
 */
function PanelFieldGroup({ cols = 1, className, children, ...props }: PanelFieldGroupProps): ReactNode {
  const columns = Math.max(1, Math.floor(cols));
  const cells = Children.toArray(children);
  const rows = Array.from({ length: Math.ceil(cells.length / columns) }, (_, row) =>
    cells.slice(row * columns, (row + 1) * columns),
  );

  return (
    <View className={cn('gap-y-1', className)} {...props}>
      {rows.map((row, index) => (
        // A row and a cell are their place in the grid, which moves with nothing, so the index keys them.
        <View key={index} className="flex-row gap-x-2">
          {Array.from({ length: columns }, (_, column) => (
            <View key={column} className="min-w-0 flex-1">
              {row[column]}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export { PanelFieldGroup };
export type { PanelFieldGroupProps };
