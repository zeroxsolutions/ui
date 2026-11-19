// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ImageIcon} through. */
type ImageIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the hill outline, in the 24-unit viewBox. */
const HILL = 20.36;

/**
 * Lucide's image icon, whose sun swells and whose hill is drawn in short and back, when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function ImageIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const sun = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 + 0.6 * p, scaleY: 1 + 0.6 * p, originX: 9, originY: 9 }) };
  });
  const hill = useAnimatedProps(() => {
    const drawn = 1 - 0.6 * progress.value;
    return { ...dash(HILL, drawn) };
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
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <AnimatedCircle cx="9" cy="9" r="2" animatedProps={sun} />
      <AnimatedPath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" animatedProps={hill} />
    </Svg>
  );
}

export { ImageIcon };
export type { ImageIconHandle };
