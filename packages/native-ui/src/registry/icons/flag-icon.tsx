// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link FlagIcon} through. */
type FlagIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's flag icon, whose cloth sways about its pole and settles, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function FlagIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const flag = useAnimatedProps(() => {
    const p = progress.value;
    return {
      ...transformProps({
        rotate: (Math.sin(2 * Math.PI * p) > 0 ? -6 : -4) * Math.sin(2 * Math.PI * p),
        originX: 4,
        originY: 22,
      }),
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
      <AnimatedPath
        d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
        animatedProps={flag}
      />
    </Svg>
  );
}

export { FlagIcon };
export type { FlagIconHandle };
