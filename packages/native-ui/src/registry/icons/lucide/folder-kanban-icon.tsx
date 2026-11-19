// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderKanbanIcon} through. */
type FolderKanbanIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of a column that dims over its own stretch of the motion, beginning at `start`. */
function column(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, start + 0.6], [1, 0.2], Extrapolation.CLAMP) };
}

/**
 * Lucide's folder-kanban icon, whose columns dim one after another and brighten again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function FolderKanbanIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const column0 = useAnimatedProps(() => column(progress.value, 0));
  const column1 = useAnimatedProps(() => column(progress.value, 0.2));
  const column2 = useAnimatedProps(() => column(progress.value, 0.4));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <AnimatedPath d="M8 10v4" animatedProps={column0} />
      <AnimatedPath d="M12 10v2" animatedProps={column1} />
      <AnimatedPath d="M16 10v6" animatedProps={column2} />
    </Svg>
  );
}

export { FolderKanbanIcon };
export type { FolderKanbanIconHandle };
