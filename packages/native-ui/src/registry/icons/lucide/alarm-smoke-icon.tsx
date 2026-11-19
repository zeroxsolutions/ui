// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AlarmSmokeIcon} through. */
type AlarmSmokeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the smoke sinks as it fades, in the 24-unit viewBox: less than the web twin's 6, which takes it past the
 * canvas, which react-native-svg clips.
 */
const RISE = 2;

/** The way out is quick, so the way back is what brings the smoke up. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's alarm-smoke icon, whose alarm swells while its smoke rises back into place, fading in, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function AlarmSmokeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const alarm = useAnimatedProps(() => {
    const scale = 1 + 0.05 * progress.value;
    return transformProps({ scaleX: scale, scaleY: scale, originY: 7.5 });
  });
  const smoke = useAnimatedProps(() => ({
    opacity: 1 - progress.value,
    ...transformProps({ y: RISE * progress.value }),
  }));

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
      <AnimatedG animatedProps={alarm}>
        <Path d="m19 8-.8 3a1.25 1.25 0 0 1-1.2 1H7a1.25 1.25 0 0 1-1.2-1L5 8" />
        <Path d="M21 3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z" />
      </AnimatedG>
      <AnimatedG animatedProps={smoke}>
        <Path d="M6 21c0-2.5 2-2.5 2-5" />
        <Path d="M11 21c0-2.5 2-2.5 2-5" />
        <Path d="M16 21c0-2.5 2-2.5 2-5" />
      </AnimatedG>
    </Svg>
  );
}

export { AlarmSmokeIcon };
export type { AlarmSmokeIconHandle };
