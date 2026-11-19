// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link Heading3Icon} through. */
type Heading3IconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the digit's crossbar, in the 24-unit viewBox. */
const BAR = 8;

/**
 * Lucide's heading 3 icon, whose crossbar is drawn in again while the two curves of its digit part, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function Heading3Icon({
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
    const drawn = 1 - progress.value;
    return { ...dash(BAR, drawn) };
  });
  const upper = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: -1.5 * p }) };
  });
  const lower = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: 1.5 * p }) };
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
      <AnimatedPath d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" animatedProps={upper} />
      <AnimatedPath d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" animatedProps={lower} />
    </Svg>
  );
}

export { Heading3Icon };
export type { Heading3IconHandle };
