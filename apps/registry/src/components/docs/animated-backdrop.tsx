'use client';

import { AnimatedGridPattern } from '@zeroxsolutions/ui/components/ui/animated-grid-pattern';
import { Meteors } from '@zeroxsolutions/ui/components/ui/meteors';

/**
 * The home hero's animated backdrop - an `AnimatedGridPattern` grid with a
 * `Meteors` shower over it, faded at the edges so the hero copy reads. Both
 * primitives observe the DOM/window, so this is a client boundary the
 * (server) home page composes rather than importing them directly.
 */
export function AnimatedBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
    >
      <AnimatedGridPattern
        numSquares={36}
        maxOpacity={0.35}
        duration={3}
        repeatDelay={1}
        className="text-foreground [mask-image:radial-gradient(ellipse_at_center,black,transparent_85%)]"
      />
      <Meteors number={10} />
    </div>
  );
}
