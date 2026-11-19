// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CreditCardIcon} through. */
type CreditCardIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Where the card is at the far end of each stretch, in the 24-unit viewBox: less than the web twin's 4 and 1.5, which would take it past the canvas. */
const SLIDE = [0, -1, 0.5];

/**
 * Lucide's credit-card icon, which slides left, then past its place to the right, and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CreditCardIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const card = useAnimatedProps(() => transformProps({ x: interpolate(progress.value, [0, 0.5, 1], SLIDE) }));

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
      <AnimatedG animatedProps={card}>
        <Rect width="20" height="14" x="2" y="5" rx="2" />
        <Line x1="2" x2="22" y1="10" y2="10" />
        <Path d="M6 14h2" />
      </AnimatedG>
    </Svg>
  );
}

export { CreditCardIcon };
export type { CreditCardIconHandle };
