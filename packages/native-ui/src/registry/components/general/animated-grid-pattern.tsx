// Adapted from Magic UI (https://github.com/magicuidesign/magicui), MIT License, Copyright (c) 2023 Magic UI.

import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { forwardRef, useCallback, useEffect, useId, useState, type ComponentProps, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { useReducedMotion } from '../../lib/motion';
import { cn } from '../../lib/utils';
import { Icon } from '../../ui/icon';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** How long after the cell before it each lit cell starts to fade in, as the web's `index * 0.1` s, in ms. */
const STAGGER = 100;

/**
 * The canvas the grid draws on, across the whole of its parent, with its children inside. It takes an icon's
 * props so that Icon draws it, which resolves a colour class to `color` on a phone, which the children read
 * as `currentColor`; on the web the class reaches the svg itself. Its `size` is ignored, and `size-full`
 * stretches it through its style.
 */
const GridCanvas: LucideIcon = forwardRef<Svg, LucideProps>(function GridCanvas(
  { color = 'currentColor', size: _size, ...props },
  ref,
) {
  return <Svg ref={ref} width="100%" height="100%" color={color} {...props} />;
});

/** One lit cell: which it is, the column and row it lights, and how many times it has moved. */
interface Square {
  id: number;
  pos: [number, number];
  iteration: number;
}

interface CellProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A cell that waits `delay`, fades in to `maxOpacity` over `duration`, stays lit for `repeatDelay`, fades out
 * again, and then calls `onFaded` with its `squareId`, all in ms.
 */
function FadingCell({
  squareId,
  delay,
  duration,
  repeatDelay,
  maxOpacity,
  onFaded,
  ...cell
}: CellProps & {
  squareId: number;
  delay: number;
  duration: number;
  repeatDelay: number;
  maxOpacity: number;
  onFaded: (squareId: number) => void;
}): ReactNode {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(maxOpacity, { duration }),
        withDelay(
          repeatDelay,
          withTiming(0, { duration }, (finished) => {
            if (finished === true) scheduleOnRN(onFaded, squareId);
          }),
        ),
      ),
    );
    return () => cancelAnimation(opacity);
  }, [squareId, delay, duration, repeatDelay, maxOpacity, onFaded, opacity]);

  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  return <AnimatedRect testID="grid-square" fill="currentColor" animatedProps={animatedProps} {...cell} />;
}

type AnimatedGridPatternProps = ComponentProps<typeof View> & {
  /** The width of one cell of the grid, in px. */
  width?: number;
  /** The height of one cell of the grid, in px. */
  height?: number;
  /** How far the grid is shifted right, in px. */
  x?: number;
  /** How far the grid is shifted down, in px. */
  y?: number;
  /** The dash pattern of the grid's lines; 0 draws them solid. */
  strokeDasharray?: number;
  /** How many cells are lit at once. */
  numSquares?: number;
  /** The opacity a lit cell fades in to. */
  maxOpacity?: number;
  /** How long a cell takes to fade in, and again to fade out, in seconds. */
  duration?: number;
  /** How long a cell stays lit between fading in and fading out, in seconds. */
  repeatDelay?: number;
};

/**
 * A grid of lines across its parent in which `numSquares` cells fade in and out, each moving to another cell
 * at random once it has faded out, in the muted foreground: the lines at 30% of it, a lit cell at up to
 * `maxOpacity`. Decorative: hidden from a screen reader, and touches pass through it. It measures its own box
 * through `onLayout`, so it lights no cell until it has been laid out. When the system asks for reduced
 * motion the lit cells are drawn still at `maxOpacity` and never move, as on the web.
 */
function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  className,
  onLayout,
  ...props
}: AnimatedGridPatternProps): ReactNode {
  const id = `grid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const reduced = useReducedMotion();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [squares, setSquares] = useState<Square[]>([]);

  const getPos = useCallback(
    (): [number, number] => [
      Math.floor((Math.random() * dimensions.width) / width),
      Math.floor((Math.random() * dimensions.height) / height),
    ],
    [dimensions.width, dimensions.height, width, height],
  );

  const moveSquare = useCallback(
    (squareId: number) => {
      setSquares((current) =>
        current.map((square) =>
          square.id === squareId ? { ...square, pos: getPos(), iteration: square.iteration + 1 } : square,
        ),
      );
    },
    [getPos],
  );

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    setSquares(Array.from({ length: numSquares }, (_, i) => ({ id: i, pos: getPos(), iteration: 0 })));
  }, [dimensions.width, dimensions.height, getPos, numSquares]);

  const measure = (event: LayoutChangeEvent): void => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    setDimensions((current) =>
      current.width === nextWidth && current.height === nextHeight ? current : { width: nextWidth, height: nextHeight },
    );
    onLayout?.(event);
  };

  return (
    <View aria-hidden pointerEvents="none" className={cn('absolute inset-0', className)} onLayout={measure} {...props}>
      <Icon as={GridCanvas} className="text-muted-foreground size-full">
        <Defs>
          <Pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
            <Path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeDasharray={strokeDasharray}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
        <G x={x} y={y}>
          {squares.map(({ pos: [column, row], id: squareId, iteration }, index) => {
            const cell = { width: width - 1, height: height - 1, x: column * width + 1, y: row * height + 1 };
            return reduced ? (
              <Rect key={squareId} testID="grid-square" fill="currentColor" opacity={maxOpacity} {...cell} />
            ) : (
              <FadingCell
                key={`${squareId}-${iteration}`}
                delay={index * STAGGER}
                duration={duration * 1000}
                repeatDelay={repeatDelay * 1000}
                maxOpacity={maxOpacity}
                squareId={squareId}
                onFaded={moveSquare}
                {...cell}
              />
            );
          })}
        </G>
      </Icon>
    </View>
  );
}

export { AnimatedGridPattern };
export type { AnimatedGridPatternProps };
