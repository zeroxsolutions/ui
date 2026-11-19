// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FoldersIcon} through. */
type FoldersIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's folders icon, whose back folder slides forward while the front one shrinks away behind it, and back when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function FoldersIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const back = useAnimatedProps(() => transformProps({ x: -2 * progress.value, y: 2 * progress.value }));
  const front = useAnimatedProps(() => {
    const scale = 1 - 0.1 * progress.value;
    return {
      ...transformProps({
        x: 2 * progress.value,
        y: -2 * progress.value,
        scaleX: scale,
        scaleY: scale,
        originX: 9.366,
        originY: 14.634,
      }),
      opacity: 1 - progress.value,
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
      <AnimatedPath
        d="M20 5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 1.2.6l.6.8a1.5 1.5 0 0 0 1.2.6z"
        animatedProps={back}
      />
      <AnimatedPath d="M3 8.268a2 2 0 0 0-1 1.738V19a2 2 0 0 0 2 2h11a2 2 0 0 0 1.732-1" animatedProps={front} />
    </Svg>
  );
}

export { FoldersIcon };
export type { FoldersIconHandle };
