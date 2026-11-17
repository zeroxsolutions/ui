// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FilePenLineIcon} through. */
type FilePenLineIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's file-pen-line icon, whose pen wobbles while the line it writes grows longer, and back when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function FilePenLineIcon({
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
      rotate: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, -0.3, 0.2, -0.4]),
      x: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, -0.5, 1, 0]),
      y: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, 1, -0.5, 0]),
      originX: 17.5,
      originY: 13.5,
    }),
  );
  const line = useAnimatedProps(() => ({ d: `M8 18h${1 + 4 * progress.value}` }));

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
      <Path d="M14.487 7.858A1 1 0 0 1 14 7V2" />
      <Path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />
      <AnimatedPath
        d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z"
        animatedProps={pen}
      />
      <AnimatedPath d="M8 18h1" animatedProps={line} />
    </Svg>
  );
}

export { FilePenLineIcon };
export type { FilePenLineIconHandle };
