// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link Settings2Icon} through. */
type Settings2IconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Lucide's settings 2 icon, whose two knobs slide toward each other and back, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function Settings2Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const lower = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -4 * p }) };
  });
  const upper = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 4 * p }) };
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
      <Path d="M14 17H5" />
      <Path d="M19 7h-9" />
      <AnimatedCircle cx="17" cy="17" r="3" animatedProps={lower} />
      <AnimatedCircle cx="7" cy="7" r="3" animatedProps={upper} />
    </Svg>
  );
}

export { Settings2Icon };
export type { Settings2IconHandle };
