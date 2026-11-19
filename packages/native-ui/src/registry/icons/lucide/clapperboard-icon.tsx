// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ClapperboardIcon} through. */
type ClapperboardIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the board tips back and the clapper opens, in degrees, the web twin's 10 each, and the board's size as it
 * tips: at full size they would lift the clapper's far end past the top of the canvas, which react-native-svg clips,
 * since it rests a unit from it, so the board shrinks towards its foot as it tips.
 */
const TIP = -10;
const OPEN = -10;
const SIZE = 0.8;

/** How far past shut the clapper snaps, in degrees. */
const SNAP = 16;

/**
 * Lucide's clapperboard icon, whose board tips back while its clapper opens and snaps shut, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function ClapperboardIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const board = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, SIZE]);
    return transformProps({ rotate: TIP * progress.value, scaleX: size, scaleY: size, originX: 4, originY: 20 });
  });
  const clapper = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], [0, OPEN, SNAP]), originX: 3, originY: 11 }),
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
      <AnimatedG animatedProps={board}>
        <AnimatedG animatedProps={clapper}>
          <Path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" />
          <Path d="m6.18 5.276 3.1 3.899" />
          <Path d="m12.296 3.464 3.02 3.956" />
        </AnimatedG>
        <Path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </AnimatedG>
    </Svg>
  );
}

export { ClapperboardIcon };
export type { ClapperboardIconHandle };
