// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link Heading2Icon} through. */
type Heading2IconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's heading 2 icon, whose stems lean apart and whose digit swells, then all return, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function Heading2Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -1.5 * p }) };
  });
  const right = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 1.5 * p }) };
  });
  const digit = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 + 0.3 * p, scaleY: 1 + 0.3 * p, originX: 19, originY: 14.129 }) };
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
      <Path d="M4 12h8" />
      <AnimatedPath d="M4 18V6" animatedProps={left} />
      <AnimatedPath d="M12 18V6" animatedProps={right} />
      <AnimatedPath d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" animatedProps={digit} />
    </Svg>
  );
}

export { Heading2Icon };
export type { Heading2IconHandle };
