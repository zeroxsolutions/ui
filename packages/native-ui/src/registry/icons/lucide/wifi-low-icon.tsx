// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Text } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WifiLowIcon} through. */
type WifiLowIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the signal in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** How much of the way back the arc takes to fade in, and when the question mark starts to show on the way out. */
const FADE = 0.6;
const ASK = 0.4;

/**
 * The theme's bold Geist face, which the question mark is set in: a device picks a custom font's weight by its family.
 */
const BOLD = 'Geist_700Bold';

/**
 * Lucide's wifi-low icon, whose signal fades out as a question mark pops up above it, and back when started. The
 * question mark is hidden at rest. Hidden from a screen reader: the control around it says what it does.
 */
function WifiLowIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const arc = useAnimatedProps(() => ({
    opacity: interpolate(1 - progress.value, [0, FADE], [0, 1], Extrapolation.CLAMP),
  }));
  const question = useAnimatedProps(() => {
    const shown = interpolate(progress.value, [ASK, 1], [0, 1], Extrapolation.CLAMP);
    // Untransformed while hidden, since react-native-svg drops a shape's matrix from its first render.
    if (shown === 0) return { opacity: 0, ...transformProps({}) };
    return { opacity: shown, ...transformProps({ scaleX: shown, scaleY: shown, originX: 12, originY: 8 }) };
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
      <Path d="M12 20h.01" />
      <AnimatedPath d="M8.5 16.429a5 5 0 0 1 7 0" animatedProps={arc} />
      <AnimatedG opacity={0} animatedProps={question}>
        <Text
          x="12"
          y="8"
          fill={color}
          stroke="none"
          fontSize="8"
          fontFamily={BOLD}
          textAnchor="middle"
          alignmentBaseline="central"
        >
          ?
        </Text>
      </AnimatedG>
    </Svg>
  );
}

export { WifiLowIcon };
export type { WifiLowIconHandle };
