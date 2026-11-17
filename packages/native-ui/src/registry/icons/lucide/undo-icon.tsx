// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link UndoIcon} through. */
type UndoIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Where the arrowhead goes at the far end of the way out, turning about its own middle (6, 10): the web twin's
 * keyframe peak.
 */
const HEAD_X = 2.1;
const HEAD_Y = -1.4;
const HEAD_TURN = 12;

/** The length of the arc, in the 24-unit viewBox, and how much of it is left drawn at the far end of the way out. */
const ARC = 24.75;
const ARC_LEFT = 0.8;

/**
 * Lucide's undo icon, whose arrowhead pulls back and up as its arc shortens, and springs out again when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function UndoIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const head = useAnimatedProps(() =>
    transformProps({
      x: HEAD_X * progress.value,
      y: HEAD_Y * progress.value,
      rotate: HEAD_TURN * progress.value,
      originX: 6,
      originY: 10,
    }),
  );
  const arc = useAnimatedProps(() => dash(ARC, 1 - (1 - ARC_LEFT) * progress.value));

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
      <AnimatedPath d="M3 7v6h6" animatedProps={head} />
      <AnimatedPath d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" animatedProps={arc} />
    </Svg>
  );
}

export { UndoIcon };
export type { UndoIconHandle };
