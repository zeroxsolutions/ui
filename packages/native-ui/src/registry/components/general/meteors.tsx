// Adapted from Magic UI (https://github.com/magicuidesign/magicui), MIT License, Copyright (c) 2023 Magic UI.

import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { forwardRef, useEffect, useId, useMemo, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useReducedMotion } from '../../lib/motion';
import { cn } from '../../lib/utils';
import { Icon } from '../../ui/icon';

/** The length of a meteor's tail, the web's `w-12.5`, in px. */
const TAIL = 50;

/** The width of a meteor's head, the web's `size-0.5`, in px. */
const HEAD = 2;

/** How far one fall carries a meteor along its path, as the web's keyframes do, in px. */
const TRAVEL = 500;

/** The share of a fall after which the meteor fades out, as the web's keyframes' 70% step. */
const FADE_FROM = 0.7;

/**
 * A meteor's drawing: its head, and its tail fading out behind it along the x axis, in `color`. It takes an
 * icon's props so that Icon draws it, which resolves a colour class to `color` on a phone; on the web the
 * class reaches the svg itself, which draws `currentColor`. Its `size` is ignored.
 */
const MeteorStreak: LucideIcon = forwardRef<Svg, LucideProps>(function MeteorStreak(
  { color = 'currentColor', size: _size, ...props },
  ref,
) {
  const id = `meteor-tail-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg ref={ref} width={HEAD + TAIL} height={HEAD} {...props}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={HEAD / 2} y={HEAD / 4} width={TAIL} height={HEAD / 2} fill={`url(#${id})`} />
      <Circle cx={HEAD / 2} cy={HEAD / 2} r={HEAD / 2} fill={color} />
    </Svg>
  );
});

/** Where one meteor starts, as a share of the width, and when and how fast it falls, in ms. */
interface MeteorTiming {
  left: number;
  delay: number;
  duration: number;
}

/** One meteor, falling from `left` along `angle` after `delay`, then again every `duration`. */
function Meteor({ left, delay, duration, angle }: MeteorTiming & { angle: number }): ReactNode {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1));
    return () => cancelAnimation(progress);
  }, [delay, duration, progress]);

  const fall = useAnimatedStyle(() => ({
    opacity: progress.value <= FADE_FROM ? 1 : (1 - progress.value) / (1 - FADE_FROM),
    transform: [{ rotate: `${angle}deg` }, { translateX: -TRAVEL * progress.value }],
  }));

  return (
    <Animated.View
      testID="meteor"
      // Turned about the head's centre, as the web turns its head-sized span.
      style={[{ position: 'absolute', top: '-5%', left: `${left}%`, transformOrigin: [HEAD / 2, HEAD / 2, 0] }, fall]}
    >
      <Icon as={MeteorStreak} className="text-muted-foreground" />
    </Animated.View>
  );
}

/** A number picked at random from `min` up to `max`. */
function between(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

type MeteorsProps = ComponentProps<typeof View> & {
  /** How many meteors fall at once. */
  number?: number;
  /** The shortest wait, in seconds, before a meteor first falls. */
  minDelay?: number;
  /** The longest wait, in seconds, before a meteor first falls. */
  maxDelay?: number;
  /** The shortest time, in seconds, one fall takes. */
  minDuration?: number;
  /** The longest time, in seconds, one fall takes. */
  maxDuration?: number;
  /** The angle of each meteor's path, in degrees as a `rotate` transform measures it. */
  angle?: number;
};

/**
 * Meteors that fall across their parent, each a dot trailing a fading line, in the muted foreground, over a
 * background. Decorative: hidden from a screen reader, and touches pass through it. Each starts at a random
 * point along the top edge, given as a share of the width, so it needs no measuring. At the default `angle`
 * of 215 a meteor falls to the right and down. When the system asks for reduced motion no meteor is drawn,
 * as on the web, since a still meteor reads as a stray mark rather than as one falling.
 */
function Meteors({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
  ...props
}: MeteorsProps): ReactNode {
  const reduced = useReducedMotion();
  const meteors = useMemo(
    (): MeteorTiming[] =>
      Array.from({ length: number }, () => ({
        left: between(0, 100),
        delay: between(minDelay, maxDelay) * 1000,
        duration: Math.floor(between(minDuration, maxDuration)) * 1000,
      })),
    [number, minDelay, maxDelay, minDuration, maxDuration],
  );

  return (
    <View aria-hidden pointerEvents="none" className={cn('absolute inset-0 overflow-hidden', className)} {...props}>
      {reduced ? null : meteors.map((meteor, index) => <Meteor key={index} angle={angle} {...meteor} />)}
    </View>
  );
}

export { Meteors };
export type { MeteorsProps };
