import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * The top strip of a side panel: one or more `PanelHeaderRow`s over a bottom border. It paints no
 * background, so it takes its panel's (usually `bg-card`).
 *
 *   <PanelHeader>
 *     <PanelHeaderRow>
 *       <PanelHeaderTitle>title + menu trigger</PanelHeaderTitle>
 *       <PanelHeaderActions>collapse button</PanelHeaderActions>
 *     </PanelHeaderRow>
 *   </PanelHeader>
 */
function PanelHeader({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('border-border shrink-0 flex-col border-b', className)} {...props} />;
}

/** One fixed-height row of the header, as high as the style's row. */
function PanelHeaderRow({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('cn-panel-header-row flex-row items-center gap-1 px-2', className)} {...props} />;
}

/** The row's growing leading part: the title and anything inline with it. */
function PanelHeaderTitle({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('min-w-0 flex-1 flex-row items-center gap-1', className)} {...props} />;
}

/** The row's trailing buttons; never shrinks. */
function PanelHeaderActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('shrink-0 flex-row items-center gap-0.5', className)} {...props} />;
}

export { PanelHeader, PanelHeaderRow, PanelHeaderTitle, PanelHeaderActions };
