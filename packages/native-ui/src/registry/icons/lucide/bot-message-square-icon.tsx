// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BotMessageSquareIcon} through. */
type BotMessageSquareIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The bob down, then up, in 24-unit viewBox units, and the bot's size as it bobs: the web twin's 1.5, growing to 1.03,
 * would take the antenna past the canvas, which react-native-svg clips, so it bobs less and shrinks a little instead.
 */
const BOB = [0, 1, -1];
const SIZE = 0.94;

/**
 * The opacity of the typing dot `index` from the left at `progress`, each pulsing a little after the last. Hidden
 * at rest.
 */
function typing(progress: number, index: number): { opacity: number } {
  'worklet';
  if (progress === 0) return { opacity: 0 };
  const start = 0.15 * index;
  return {
    opacity: interpolate(progress, [start, start + 0.3, start + 0.6], [0.3, 1, 0.3], Extrapolation.CLAMP),
  };
}

/**
 * Lucide's bot-message-square icon, which bobs and rocks while its bubble swells twice, its eyes blink one after the
 * other and typing dots pulse under them, when started. The typing dots are hidden at rest. Hidden from a screen
 * reader: the control around it says what it does.
 */
function BotMessageSquareIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const bot = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, SIZE]);
    return transformProps({
      y: interpolate(progress.value, [0, 0.5, 1], BOB),
      scaleX: size,
      scaleY: size,
      rotate: interpolate(progress.value, [0, 0.5, 1], [0, -3, 3]),
    });
  });
  const bubble = useAnimatedProps(() => {
    const scale = 1 + 0.04 * Math.sin(Math.PI * progress.value);
    return transformProps({ scaleX: scale, scaleY: scale, originY: 13.5 });
  });
  const leftEye = useAnimatedProps(() =>
    transformProps({ scaleY: interpolate(progress.value, [0.1, 0.6], [1, 0.1], Extrapolation.CLAMP), originX: 9 }),
  );
  const rightEye = useAnimatedProps(() =>
    transformProps({ scaleY: interpolate(progress.value, [0.2, 0.7], [1, 0.1], Extrapolation.CLAMP), originX: 15 }),
  );
  const firstDot = useAnimatedProps(() => typing(progress.value, 0));
  const secondDot = useAnimatedProps(() => typing(progress.value, 1));
  const thirdDot = useAnimatedProps(() => typing(progress.value, 2));

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
      <AnimatedG animatedProps={bot}>
        <Path d="M12 6V2H8" />
        <Path d="M2 12h2" />
        <Path d="M20 12h2" />
        <AnimatedPath
          d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"
          animatedProps={bubble}
        />
        <AnimatedPath d="M9 11v2" animatedProps={leftEye} />
        <AnimatedPath d="M15 11v2" animatedProps={rightEye} />
        <AnimatedCircle cx="10" cy="18" r="0.5" opacity={0} animatedProps={firstDot} />
        <AnimatedCircle cx="12" cy="18" r="0.5" opacity={0} animatedProps={secondDot} />
        <AnimatedCircle cx="14" cy="18" r="0.5" opacity={0} animatedProps={thirdDot} />
      </AnimatedG>
    </Svg>
  );
}

export { BotMessageSquareIcon };
export type { BotMessageSquareIconHandle };
