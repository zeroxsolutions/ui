// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link HighlighterIcon} through. */
type HighlighterIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's highlighter icon, whose pen tilts about its tip and returns, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function HighlighterIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const pen = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ rotate: -14 * p, originX: 3, originY: 20 }) };
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
      <AnimatedG animatedProps={pen}>
        <Path d="m9 11-6 6v3h9l3-3" />
        <Path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
      </AnimatedG>
    </Svg>
  );
}

export { HighlighterIcon };
export type { HighlighterIconHandle };
