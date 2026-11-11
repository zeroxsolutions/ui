import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, type LucideIcon } from 'lucide-react-native';
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Icon } from '../../ui/icon';

interface DataTableColumnHeaderContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one context holds a column of any row and value type
  column: Column<any, any>;
}

const DataTableColumnHeaderContext = createContext<DataTableColumnHeaderContextValue | null>(null);

function useDataTableColumnHeader(): DataTableColumnHeaderContextValue {
  const context = useContext(DataTableColumnHeaderContext);
  if (!context) throw new Error('DataTableColumnHeader parts must be used within <DataTableColumnHeader>');
  return context;
}

type DataTableColumnHeaderProps<TData, TValue> = ComponentProps<typeof View> & {
  /** The `@tanstack/react-table` column this header sorts and hides. */
  column: Column<TData, TValue>;
};

/**
 * A column's header, rendered from the column's `header`. It takes the `column` directly, since column defs live
 * outside the render tree, and hands it to its parts, which compose a column menu:
 *
 *   <DataTableColumnHeader column={column}>
 *     <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
 *     <DataTableColumnHeaderContent>
 *       <DataTableColumnHeaderSortAscending />
 *       <DataTableColumnHeaderSortDescending />
 *       <DropdownMenuSeparator />
 *       <DataTableColumnHeaderHide />
 *     </DataTableColumnHeaderContent>
 *   </DataTableColumnHeader>
 *
 * A column that neither sorts nor hides takes its title as plain `children`, with no menu.
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  className,
  children,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>): ReactNode {
  const value = useMemo(() => ({ column }), [column]);
  return (
    <DataTableColumnHeaderContext.Provider value={value}>
      <DropdownMenu>
        <View className={cn('flex-row items-center gap-2', className)} {...props}>
          {asText(children)}
        </View>
      </DropdownMenu>
    </DataTableColumnHeaderContext.Provider>
  );
}

type DataTableColumnHeaderTriggerProps = Omit<ComponentProps<typeof DropdownMenuTrigger>, 'asChild' | 'children'> & {
  /** The column's title. */
  children?: ReactNode;
};

/**
 * The ghost Button that opens the column menu, named by its `children`, the column's title, and followed by an
 * icon for the column's sort direction: up for ascending, down for descending, both ways while unsorted.
 * @throws {Error} when rendered outside a DataTableColumnHeader
 */
function DataTableColumnHeaderTrigger({ children, ...props }: DataTableColumnHeaderTriggerProps): ReactNode {
  const { column } = useDataTableColumnHeader();
  const sorted = column.getIsSorted();
  const sortIcon = sorted === 'desc' ? ArrowDown : sorted === 'asc' ? ArrowUp : ChevronsUpDown;
  return (
    <DropdownMenuTrigger asChild {...props}>
      {/* The negative margin lines the button's label up with the column's cells. */}
      <Button variant="ghost" className="-ml-2.5">
        {asText(children)}
        <Icon as={sortIcon} />
      </Button>
    </DropdownMenuTrigger>
  );
}

/**
 * The column menu, opening from the trigger's start edge; `children` are its actions.
 * @throws {Error} when rendered outside a DataTableColumnHeader
 */
function DataTableColumnHeaderContent({
  align = 'start',
  children,
  ...props
}: ComponentProps<typeof DropdownMenuContent>): ReactNode {
  const context = useDataTableColumnHeader();
  return (
    <DropdownMenuContent align={align} {...props}>
      {/* The menu is drawn in the app's PortalHost, which a context provided around the header does not reach. */}
      <DataTableColumnHeaderContext.Provider value={context}>{children}</DataTableColumnHeaderContext.Provider>
    </DropdownMenuContent>
  );
}

/** A column menu item's props: a DropdownMenuItem's, its children drawn in a Text where they are only text. */
type DataTableColumnHeaderItemProps = Omit<ComponentProps<typeof DropdownMenuItem>, 'children'> & {
  /** Replaces the item's default copy. */
  children?: ReactNode;
};

type DataTableColumnHeaderActionProps = DataTableColumnHeaderItemProps & {
  /** The leading icon. */
  icon: LucideIcon;
  /** What a press does to the column, unless the caller's `onPress` prevents it. */
  act: () => void;
};

/** A column menu item with a leading icon, which runs the caller's `onPress` before its own action. */
function DataTableColumnHeaderAction({
  icon,
  act,
  children,
  onPress,
  ...props
}: DataTableColumnHeaderActionProps): ReactNode {
  return (
    <DropdownMenuItem
      onPress={(event) => {
        onPress?.(event);
        if (!event.isDefaultPrevented()) act();
      }}
      {...props}
    >
      <Icon as={icon} />
      {asText(children)}
    </DropdownMenuItem>
  );
}

/**
 * Sorts the header's column ascending; `children` replace the default "Asc". A caller's `onPress` runs first,
 * and calling `event.preventDefault()` in it skips the sort.
 * @throws {Error} when rendered outside a DataTableColumnHeader
 */
function DataTableColumnHeaderSortAscending({ children, ...props }: DataTableColumnHeaderItemProps): ReactNode {
  const { column } = useDataTableColumnHeader();
  return (
    <DataTableColumnHeaderAction icon={ArrowUp} act={() => column.toggleSorting(false)} {...props}>
      {children ?? 'Asc'}
    </DataTableColumnHeaderAction>
  );
}

/**
 * Sorts the header's column descending; `children` replace the default "Desc". A caller's `onPress` runs first,
 * and calling `event.preventDefault()` in it skips the sort.
 * @throws {Error} when rendered outside a DataTableColumnHeader
 */
function DataTableColumnHeaderSortDescending({ children, ...props }: DataTableColumnHeaderItemProps): ReactNode {
  const { column } = useDataTableColumnHeader();
  return (
    <DataTableColumnHeaderAction icon={ArrowDown} act={() => column.toggleSorting(true)} {...props}>
      {children ?? 'Desc'}
    </DataTableColumnHeaderAction>
  );
}

/**
 * Hides the header's column; `children` replace the default "Hide". A caller's `onPress` runs first, and
 * calling `event.preventDefault()` in it skips the hide.
 * @throws {Error} when rendered outside a DataTableColumnHeader
 */
function DataTableColumnHeaderHide({ children, ...props }: DataTableColumnHeaderItemProps): ReactNode {
  const { column } = useDataTableColumnHeader();
  return (
    <DataTableColumnHeaderAction icon={EyeOff} act={() => column.toggleVisibility(false)} {...props}>
      {children ?? 'Hide'}
    </DataTableColumnHeaderAction>
  );
}

export {
  DataTableColumnHeader,
  DataTableColumnHeaderTrigger,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
};
export type { DataTableColumnHeaderProps, DataTableColumnHeaderTriggerProps, DataTableColumnHeaderItemProps };
