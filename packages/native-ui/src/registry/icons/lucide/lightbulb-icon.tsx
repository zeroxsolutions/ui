// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LightbulbIcon} through. */
type LightbulbIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's lightbulb icon, whose glass swells from its base and settles, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LightbulbIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // A swell of 1.06, less than the web twin's 1.12, which takes the top of the glass past the canvas, which react-
  // native-svg clips.
  const glass = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 + 0.06 * p, scaleY: 1 + 0.06 * p, originY: 14 }) };
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
        d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
        animatedProps={glass}
      />
      <Path d="M9 18h6" />
      <Path d="M10 22h4" />
    </Svg>
  );
}

export { LightbulbIcon };
export type { LightbulbIconHandle };
