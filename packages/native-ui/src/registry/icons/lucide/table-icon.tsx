// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TableIcon} through. */
type TableIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's table icon, whose lines shorten, the rows one after the other, and return, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function TableIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const column = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleY: 1 - 0.4 * p }) };
  });
  const firstRow = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 - 0.4 * p, originY: 9 }) };
  });
  const secondRow = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { ...transformProps({ scaleX: 1 - 0.4 * p, originY: 15 }) };
  });

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
      <AnimatedPath d="M12 3v18" animatedProps={column} />
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <AnimatedPath d="M3 9h18" animatedProps={firstRow} />
      <AnimatedPath d="M3 15h18" animatedProps={secondRow} />
    </Svg>
  );
}

export { TableIcon };
export type { TableIconHandle };
