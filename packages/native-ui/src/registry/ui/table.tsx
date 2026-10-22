import * as TablePrimitive from '@rn-primitives/table';
import { Children, createContext, isValidElement, useContext, type ComponentProps, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { cn } from '../lib/utils';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes behind that state, such as `@state=selected` on a selected row;
// the registry build replaces each with the classes translated for the target engine.

/** Whether a TableRow is the last of its TableBody or TableFooter, which draws no border under it. */
const LastRowContext = createContext(false);

/** Hands each child of a row group whether it is the group's last. */
function markLastRow(children: ReactNode): ReactNode {
  const items = Children.toArray(children);
  return items.map((child, index) => (
    <LastRowContext.Provider key={isValidElement(child) ? child.key : index} value={index === items.length - 1}>
      {child}
    </LastRowContext.Provider>
  ));
}

/**
 * A table of rows announced as a table, inside a box that scrolls sideways when the table is wider than
 * it. Compose it from a TableHeader, a TableBody, an optional TableFooter and an optional TableCaption,
 * which is drawn below. The cells of a row share its width; give a wide table a minimum width, such as
 * `min-w-[640px]`, to scroll it.
 */
function Table({ className, children, ...props }: TablePrimitive.RootProps): ReactNode {
  const items = Children.toArray(children);
  const isCaption = (child: ReactNode): boolean => isValidElement(child) && child.type === TableCaption;
  return (
    <ScrollView horizontal className="cn-table-container" contentContainerClassName="min-w-full">
      <TextClassContext.Provider value="cn-table/text">
        <TablePrimitive.Root className={cn('cn-table', className)} {...props}>
          {items.filter((child) => !isCaption(child))}
          {items.filter(isCaption)}
        </TablePrimitive.Root>
      </TextClassContext.Provider>
    </ScrollView>
  );
}

/** The row group of column headers at the top of a Table. */
function TableHeader({ className, ...props }: TablePrimitive.HeaderProps): ReactNode {
  return <TablePrimitive.Header className={cn('cn-table-header', className)} {...props} />;
}

/** The row group of a Table's data, with no border under its last row. */
function TableBody({ className, children, ...props }: TablePrimitive.BodyProps): ReactNode {
  return (
    <TablePrimitive.Body className={cn('cn-table-body', className)} {...props}>
      {markLastRow(children)}
    </TablePrimitive.Body>
  );
}

/** The row group at the bottom of a Table, such as a total, on a muted band in the medium weight. */
function TableFooter({ className, children, ...props }: TablePrimitive.FooterProps): ReactNode {
  const outer = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(outer, 'cn-table-footer/text')}>
      <TablePrimitive.Footer className={cn('cn-table-footer', className)} {...props}>
        {markLastRow(children)}
      </TablePrimitive.Footer>
    </TextClassContext.Provider>
  );
}

/**
 * A row of TableHeads or TableCells, a Pressable announced as a row; `onPress` makes it take a press.
 * With no `onPress` a screen reader reaches each cell, and a control in one, on its own; with one, the
 * row is a single element, unless `accessible` says otherwise. `aria-selected` draws it on the muted
 * background and announces it as selected.
 */
function TableRow({ className, 'aria-selected': selected, accessible, ...props }: TablePrimitive.RowProps): ReactNode {
  const last = useContext(LastRowContext);
  return (
    <TablePrimitive.Row
      // A Pressable is one accessible element by default, which on iOS hides the controls in its cells.
      accessible={accessible ?? props.onPress != null}
      aria-selected={selected}
      className={cn(
        'flex-row cn-table-row',
        selected === true && 'cn-table-row@state=selected',
        // Upstream removes the last row's border with a child selector, the same class in both styles.
        last && 'border-b-0',
        className,
      )}
      {...props}
    />
  );
}

/** A column header, announced as one, its Text in the foreground colour and medium weight. */
function TableHead({ className, ...props }: TablePrimitive.HeadProps): ReactNode {
  const outer = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(outer, 'cn-table-head/text')}>
      <TablePrimitive.Head className={cn('flex-1 justify-center cn-table-head', className)} {...props} />
    </TextClassContext.Provider>
  );
}

/** A cell of data, its content centred vertically in the row. */
function TableCell({ className, ...props }: TablePrimitive.CellProps): ReactNode {
  return <TablePrimitive.Cell className={cn('flex-1 justify-center cn-table-cell', className)} {...props} />;
}

/** The muted line that describes a Table, drawn below it wherever it is placed. */
function TableCaption({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('cn-table-caption cn-table-caption/text', className)} {...props} />;
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
