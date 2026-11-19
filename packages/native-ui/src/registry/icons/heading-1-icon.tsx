// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link Heading1Icon} through. */
type Heading1IconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's heading 1 icon, whose crossbar narrows and whose digit lifts, then both return, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function Heading1Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const bar = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 - 0.5 * p, originX: 8 }) };
  });
  const digit = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: -2.5 * p }) };
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
      <AnimatedPath d="M4 12h8" animatedProps={bar} />
      <Path d="M4 18V6" />
      <Path d="M12 18V6" />
      <AnimatedPath d="m17 12 3-2v8" animatedProps={digit} />
    </Svg>
  );
}

export { Heading1Icon };
export type { Heading1IconHandle };
