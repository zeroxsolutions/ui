// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PenToolIcon} through. */
type PenToolIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The dip in the 24-unit viewBox, the tilt in degrees about the middle, and the pen's size, at each half of the way
 * out: the web twin's 2 would take the nib past the foot of the canvas, which react-native-svg clips, so it dips
 * 1.5 and shrinks a little as it does.
 */
const DIP = [0, 1.5, 0];
const SIZE = [1, 0.94, 1];
const TILT = [0, 0, 8];

/** The length of the guide line, in the 24-unit viewBox. */
const GUIDE = 9.31;

/**
 * Lucide's pen-tool icon, which dips and tilts while its guide line slides out and is drawn in again when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function PenToolIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const pen = useAnimatedProps(() =>
    transformProps({
      y: interpolate(progress.value, [0, 0.5, 1], DIP),
      rotate: interpolate(progress.value, [0, 0.5, 1], TILT),
      scaleX: interpolate(progress.value, [0, 0.5, 1], SIZE),
      scaleY: interpolate(progress.value, [0, 0.5, 1], SIZE),
    }),
  );
  // It slides out towards the nib and is drawn in again from there, as the web twin's pathOffset runs.
  const guide = useAnimatedProps(() => dash(GUIDE, 1 - progress.value, progress.value));

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
      <AnimatedG animatedProps={pen}>
        <Path d="m18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18" />
        <Path d="M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z" />
        <AnimatedPath d="m3 3 6.586 6.586" animatedProps={guide} />
        <Circle cx="11" cy="11" r="2" />
      </AnimatedG>
    </Svg>
  );
}

export { PenToolIcon };
export type { PenToolIconHandle };
