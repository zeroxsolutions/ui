// Adapted from Magic UI (https://github.com/magicuidesign/magicui), MIT License, Copyright (c) 2023 Magic UI.

import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface MeteorsProps extends React.ComponentProps<'div'> {
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
  /** The angle of each meteor's path, in degrees as CSS `rotate` measures it. */
  angle?: number;
}

/** Where one meteor starts, as a share of the width, and when and how fast it falls. */
interface Meteor {
  left: number;
  delay: number;
  duration: number;
}

/** A number picked at random from `min` up to `max`. */
function between(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Meteors that fall across the box of their nearest positioned ancestor, each a dot trailing a fading
 * line, over a background. Decorative: hidden from assistive technology and from the pointer. They
 * draw in the current text colour, muted by default, so a `text-*` class recolours them.
 *
 * Each meteor starts at a random point along the top edge, given as a share of the width, and the
 * points are picked after mount, so the server and the first client render draw none and agree.
 * At the default `angle` of 215 a meteor falls to the right and down. Under `prefers-reduced-motion`
 * no meteor is drawn, since a still meteor reads as a stray mark rather than as one falling.
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
}: MeteorsProps): React.ReactNode {
  const [meteors, setMeteors] = React.useState<Meteor[]>([]);

  React.useEffect(() => {
    setMeteors(
      Array.from({ length: number }, () => ({
        left: between(0, 100),
        delay: between(minDelay, maxDelay),
        duration: Math.floor(between(minDuration, maxDuration)),
      })),
    );
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <div
      data-slot="meteors"
      aria-hidden
      className={cn('text-muted-foreground pointer-events-none absolute inset-0 overflow-hidden', className)}
      {...props}
    >
      {meteors.map(({ left, delay, duration }, index) => (
        <span
          key={index}
          style={
            {
              '--angle': `${angle}deg`,
              top: '-5%',
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            } as React.CSSProperties
          }
          className="animate-meteor absolute size-0.5 rounded-full bg-current motion-reduce:hidden"
        >
          <span className="absolute top-1/2 h-px w-12.5 -translate-y-1/2 bg-linear-to-r from-current to-transparent" />
        </span>
      ))}
    </div>
  );
}

export { Meteors };
export type { MeteorsProps };
