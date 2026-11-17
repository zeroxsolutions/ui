// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SendIcon} through. */
type SendIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the plane goes and how small it gets at the far end of the way out: the web twin's. */
const FLY = 3;
const SIZE = 0.8;

/**
 * The trail the plane leaves, hidden at rest: the web twin's, which runs past the canvas, which react-native-svg
 * clips, drawn at half its size about its end (9, 15.8) by the plane.
 */
const TRAIL =
  'M3 21.9C4.25 21.3 5.3 20.2 6.15 18.9C6.9 17.75 7.1 16.7 6.6 15.95C6.1 15.25 5.2 15.15 4.65 15.8C4.05 16.5 4.2 17.6 5.1 18.1C6.2 18.65 7.7 17.6 9 15.8';

/**
 * How far behind the trail starts as it fades in, once the first fifth of the way out has passed, sliding up to its
 * place: the web twin's 3 and its 0.1 s delay of 0.55. At half the trail's size, less than half of 3 keeps it inside
 * the canvas.
 */
const SLIDE = 1.25;
const DELAY = 0.2;

/**
 * Lucide's send icon, whose plane flies off up and to the right, leaving a dashed trail when started. The trail is
 * hidden at rest. Hidden from a screen reader: the control around it says what it does.
 */
function SendIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const plane = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE) * progress.value;
    return transformProps({ x: FLY * progress.value, y: -FLY * progress.value, scaleX: size, scaleY: size });
  });
  const trail = useAnimatedProps(() => {
    const behind = interpolate(progress.value, [0, DELAY, 1], [0, SLIDE, 0]);
    return {
      ...transformProps({ x: -behind, y: behind }),
      opacity: interpolate(progress.value, [DELAY, 1], [0, 1], Extrapolation.CLAMP),
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
      <AnimatedG animatedProps={plane}>
        <Path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
        <Path d="m21.854 2.147-10.94 10.939" />
      </AnimatedG>
      <AnimatedPath d={TRAIL} strokeWidth={1} strokeDasharray={[1, 1]} opacity={0} animatedProps={trail} />
    </Svg>
  );
}

export { SendIcon };
export type { SendIconHandle };
