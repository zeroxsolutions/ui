// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandFistIcon} through. */
type HandFistIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the fist rises, in the 24-unit viewBox, and its size as it rises, about its wrist: the web twin's 4,
 * growing to 1.1, would take its knuckles past the top of the canvas, which react-native-svg clips, so it rises less
 * and shrinks a little instead.
 */
const RISE = -1.5;
const SIZE = 0.95;

/**
 * Lucide's hand-fist icon, which punches up, shrinking a little towards its wrist, and back when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function HandFistIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      y: RISE * progress.value,
      scaleX: 1 - (1 - SIZE) * progress.value,
      scaleY: 1 - (1 - SIZE) * progress.value,
      originY: 22,
    }),
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
      <AnimatedG animatedProps={whole}>
        <Path d="M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0" />
        <Path d="M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5" />
        <Path d="M9 5A2 2 0 1 0 5 5V10" />
        <Path d="M9 7V4A2 2 0 1 1 13 4V7.268" />
      </AnimatedG>
    </Svg>
  );
}

export { HandFistIcon };
export type { HandFistIconHandle };
