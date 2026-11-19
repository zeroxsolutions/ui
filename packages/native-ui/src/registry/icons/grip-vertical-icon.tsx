// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTiming,
  type IconHandle,
} from '../lib/icon-motion';

/** The handle a control starts and stops {@link GripVerticalIcon} through. */
type GripVerticalIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Half the web twin's 0.4 s, which is how long each way runs here. */
const FAST_TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's grip vertical icon, whose six dots dim and shrink, one after another, then return, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function GripVerticalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, FAST_TIMING);
  const middleLeft = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.1) / 0.9);
    return { ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 9 }), opacity: 1 - 0.6 * p };
  });
  const topLeft = useAnimatedProps(() => {
    const p = progress.value;
    return {
      ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 9, originY: 5 }),
      opacity: 1 - 0.6 * p,
    };
  });
  const bottomLeft = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.2) / 0.8);
    return {
      ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 9, originY: 19 }),
      opacity: 1 - 0.6 * p,
    };
  });
  const middleRight = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.18) / 0.82);
    return { ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 15 }), opacity: 1 - 0.6 * p };
  });
  const topRight = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return {
      ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 15, originY: 5 }),
      opacity: 1 - 0.6 * p,
    };
  });
  const bottomRight = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.28) / 0.72);
    return {
      ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 15, originY: 19 }),
      opacity: 1 - 0.6 * p,
    };
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
      <AnimatedCircle cx="9" cy="12" r="1" animatedProps={middleLeft} />
      <AnimatedCircle cx="9" cy="5" r="1" animatedProps={topLeft} />
      <AnimatedCircle cx="9" cy="19" r="1" animatedProps={bottomLeft} />
      <AnimatedCircle cx="15" cy="12" r="1" animatedProps={middleRight} />
      <AnimatedCircle cx="15" cy="5" r="1" animatedProps={topRight} />
      <AnimatedCircle cx="15" cy="19" r="1" animatedProps={bottomRight} />
    </Svg>
  );
}

export { GripVerticalIcon };
export type { GripVerticalIconHandle };
