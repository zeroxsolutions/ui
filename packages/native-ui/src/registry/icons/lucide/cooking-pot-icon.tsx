// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CookingPotIcon} through. */
type CookingPotIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's cooking-pot icon, whose lid rattles from side to side while the pot swells when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CookingPotIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const pot = useAnimatedProps(() => {
    const scale = 1 + 0.08 * progress.value;
    return transformProps({ scaleX: scale, scaleY: scale, originY: 16 });
  });
  // 10 degrees, less than the web twin's 14, which takes the handle past the canvas, which react-native-svg clips.
  const lid = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], [0, -10, 10]), originX: 18, originY: 6 }),
  );

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
      <AnimatedG animatedProps={pot}>
        <Path d="M2 12h20" />
        <Path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
      </AnimatedG>
      <AnimatedG animatedProps={lid}>
        <Path d="m4 8 16-4" />
        <Path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" />
      </AnimatedG>
    </Svg>
  );
}

export { CookingPotIcon };
export type { CookingPotIconHandle };
