// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CodeIcon} through. */
type CodeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's code icon, whose two brackets move apart and back, when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function CodeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // Each bracket moves 1, less than the web twin's 2.5, which takes the closing one past the canvas, which react-
  // native-svg clips.
  const close = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 1 * p }) };
  });
  const open = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -1 * p }) };
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
      <AnimatedPath d="m16 18 6-6-6-6" animatedProps={close} />
      <AnimatedPath d="m8 6-6 6 6 6" animatedProps={open} />
    </Svg>
  );
}

export { CodeIcon };
export type { CodeIconHandle };
