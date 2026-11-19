// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ListOrderedIcon} through. */
type ListOrderedIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's list ordered icon, whose lines slide right and whose numbers lift, one after another, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ListOrderedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // Each line slides 2, less than the web twin's 2.5, which takes its end past the canvas, which react-native-svg
  // clips.
  const firstLine = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 2 * p }) };
  });
  const secondLine = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { ...transformProps({ x: 2 * p }) };
  });
  const thirdLine = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.16) / 0.84);
    return { ...transformProps({ x: 2 * p }) };
  });
  const firstNumber = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: -1.5 * p }) };
  });
  const secondNumber = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { ...transformProps({ y: -1.5 * p }) };
  });
  const thirdNumber = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.16) / 0.84);
    return { ...transformProps({ y: -1.5 * p }) };
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
      <AnimatedPath d="M11 5h10" animatedProps={firstLine} />
      <AnimatedPath d="M11 12h10" animatedProps={secondLine} />
      <AnimatedPath d="M11 19h10" animatedProps={thirdLine} />
      <AnimatedPath d="M4 4h1v5" animatedProps={firstNumber} />
      <AnimatedPath d="M4 9h2" animatedProps={secondNumber} />
      <AnimatedPath d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" animatedProps={thirdNumber} />
    </Svg>
  );
}

export { ListOrderedIcon };
export type { ListOrderedIconHandle };
