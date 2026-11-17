// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BicepsFlexedIcon} through. */
type BicepsFlexedIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the arm turns, in degrees about the middle, and its size as it does: the web twin turns the whole icon 15
 * and each line another 15 as the arm swells to 1.3, which would take the arm past the canvas, which react-native-svg
 * clips, so the whole icon turns 10 and shrinks a little, each line turns another 10, and the arm swells 0.04.
 */
const TURN = 10;
const SIZE = 0.9;
const SWELL = 0.04;

/**
 * Lucide's biceps-flexed icon, whose arm turns and swells while the lines of its muscle turn with it, then relaxes,
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function BicepsFlexedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE) * progress.value;
    return transformProps({ rotate: TURN * progress.value, scaleX: size, scaleY: size });
  });
  const arm = useAnimatedProps(() => {
    const scale = 1 + SWELL * progress.value;
    return transformProps({ scaleX: scale, scaleY: scale });
  });
  const muscle = useAnimatedProps(() =>
    transformProps({ rotate: TURN * progress.value, originX: 11.21, originY: 14.5 }),
  );
  const crease = useAnimatedProps(() =>
    transformProps({ rotate: TURN * progress.value, originX: 8.98, originY: 10.91 }),
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
        <AnimatedPath
          d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"
          animatedProps={arm}
        />
        <AnimatedPath d="M15 14a5 5 0 0 0-7.584 2" animatedProps={muscle} />
        <AnimatedPath d="M9.964 6.825C8.019 7.977 9.5 13 8 15" animatedProps={crease} />
      </AnimatedG>
    </Svg>
  );
}

export { BicepsFlexedIcon };
export type { BicepsFlexedIconHandle };
