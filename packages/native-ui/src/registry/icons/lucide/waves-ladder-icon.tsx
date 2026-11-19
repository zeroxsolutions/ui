// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WavesLadderIcon} through. */
type WavesLadderIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The way out is quick, so the way back is what brings the ladder up. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far below its place the ladder starts, the web twin's, and how far into the way back it starts to fade in:
 * the web twin's fade starts half way, with the ladder 6.5 below, which would take the rails past the canvas, which
 * react-native-svg clips, so it starts once the ladder is 5 below.
 */
const CLIMB = 13;
const FADE_FROM = 0.62;

/**
 * Lucide's waves-ladder icon, whose ladder climbs up out of the water, fading in when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function WavesLadderIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const ladder = useAnimatedProps(() => ({
    opacity: interpolate(1 - progress.value, [FADE_FROM, 1], [0, 1], Extrapolation.CLAMP),
    ...transformProps({ y: CLIMB * progress.value }),
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
      <Path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <AnimatedG animatedProps={ladder}>
        <Path d="M19 5a2 2 0 0 0-2 2v11" />
        <Path d="M7 13h10" />
        <Path d="M7 9h10" />
        <Path d="M9 5a2 2 0 0 0-2 2v11" />
      </AnimatedG>
    </Svg>
  );
}

export { WavesLadderIcon };
export type { WavesLadderIconHandle };
