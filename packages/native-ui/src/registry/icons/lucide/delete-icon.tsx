// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link DeleteIcon} through. */
type DeleteIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the key slides left, in the 24-unit viewBox: less than the web twin's 1.5, which takes its tip past the
 * canvas, which react-native-svg clips.
 */
const SLIDE = -1;

/**
 * Lucide's delete icon, which slides left as a backspace does while its cross turns a quarter turn, and back when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function DeleteIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const key = useAnimatedProps(() => transformProps({ x: SLIDE * progress.value }));
  const cross = useAnimatedProps(() =>
    transformProps({ x: SLIDE * progress.value, rotate: 90 * progress.value, originX: 15, originY: 12 }),
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
      <AnimatedPath
        d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
        animatedProps={key}
      />
      <AnimatedG animatedProps={cross}>
        <Path d="m12 9 6 6" />
        <Path d="m18 9-6 6" />
      </AnimatedG>
    </Svg>
  );
}

export { DeleteIcon };
export type { DeleteIconHandle };
