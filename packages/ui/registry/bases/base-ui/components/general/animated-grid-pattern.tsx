// Adapted from Magic UI (https://github.com/magicuidesign/magicui), MIT License, Copyright (c) 2023 Magic UI.

import { motion } from 'motion/react';
import * as React from 'react';

import { usePrefersReducedMotion } from '@/registry/bases/base-ui/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface AnimatedGridPatternProps extends React.ComponentProps<'svg'> {
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
}

/** One lit cell: which it is, the column and row it lights, and how many times it has moved. */
interface Square {
  id: number;
  pos: [number, number];
  iteration: number;
}

/**
 * A grid of lines over the box of its nearest positioned ancestor, in which `numSquares` cells fade
 * in and out, each moving to another cell at random once it has faded out. Decorative: hidden from
 * assistive technology and from the pointer. It draws in the current text colour, muted by default,
 * so a `text-*` class recolours it: the lines at 30% of it, a lit cell at up to `maxOpacity`.
 *
 * It measures its own box, so it lights no cell until it has been laid out. Under
 * `prefers-reduced-motion` the lit cells are drawn still at `maxOpacity` and never move.
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
  ...props
}: AnimatedGridPatternProps): React.ReactNode {
  const id = React.useId();
  const containerRef = React.useRef<SVGSVGElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [squares, setSquares] = React.useState<Square[]>([]);

  const getPos = React.useCallback(
    (): [number, number] => [
      Math.floor((Math.random() * dimensions.width) / width),
      Math.floor((Math.random() * dimensions.height) / height),
    ],
    [dimensions.width, dimensions.height, width, height],
  );

  const moveSquare = React.useCallback(
    (squareId: number) => {
      setSquares((current) =>
        current.map((square) =>
          square.id === squareId ? { ...square, pos: getPos(), iteration: square.iteration + 1 } : square,
        ),
      );
    },
    [getPos],
  );

  React.useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    setSquares(Array.from({ length: numSquares }, (_, i) => ({ id: i, pos: getPos(), iteration: 0 })));
  }, [dimensions.width, dimensions.height, getPos, numSquares]);

  React.useEffect(() => {
    const element = containerRef.current;
    if (element === null) return undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nextWidth, height: nextHeight } = entry.contentRect;
        setDimensions((current) =>
          current.width === nextWidth && current.height === nextHeight
            ? current
            : { width: nextWidth, height: nextHeight },
        );
      }
    });
    observer.observe(element);
    return (): void => observer.disconnect();
  }, []);

  return (
    <svg
      ref={containerRef}
      data-slot="animated-grid-pattern"
      aria-hidden
      className={cn('text-muted-foreground pointer-events-none absolute inset-0 size-full', className)}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(({ pos: [column, row], id: squareId, iteration }, index) => {
          const cell = {
            width: width - 1,
            height: height - 1,
            x: column * width + 1,
            y: row * height + 1,
            fill: 'currentColor',
            strokeWidth: 0,
          };
          return reduced ? (
            <rect key={squareId} opacity={maxOpacity} {...cell} />
          ) : (
            <motion.rect
              key={`${squareId}-${iteration}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: maxOpacity }}
              transition={{ duration, repeat: 1, delay: index * 0.1, repeatType: 'reverse', repeatDelay }}
              onAnimationComplete={() => moveSquare(squareId)}
              {...cell}
            />
          );
        })}
      </svg>
    </svg>
  );
}

export { AnimatedGridPattern };
export type { AnimatedGridPatternProps };
