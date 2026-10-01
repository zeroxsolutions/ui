'use client';

import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The hero's background: a slow field of the logo's modules drawn with WebGL. It fills its positioned
 * parent behind the parent's content. Once the page is idle it loads the field's code as its own chunk
 * and starts it; the field settles within five seconds and stops. Under reduced motion, without WebGL
 * or before it starts, it is an empty layer over the page's own background, so nothing moves and
 * nothing breaks.
 */
function HomeShader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const container = host.current;
    if (!element || !container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let unmounted = false;
    let stop: (() => void) | undefined;
    const start = async (): Promise<void> => {
      const { startHomeShaderField, COLUMN_HALF_WIDTH } = await import('../../_lib/home-shader-field');
      // Narrower than twice the clear half-width, the whole container sits inside the band the field
      // never draws into.
      if (!unmounted && container.clientWidth > 2 * COLUMN_HALF_WIDTH) stop = startHomeShaderField(container, element);
    };
    // Safari has no requestIdleCallback by default; there the start waits a fixed 200ms instead.
    const idleSupported = typeof window.requestIdleCallback === 'function';
    const begin = (): void => void start();
    const idle = idleSupported ? window.requestIdleCallback(begin) : window.setTimeout(begin, 200);

    return () => {
      unmounted = true;
      if (idleSupported) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      stop?.();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      data-slot="home-shader"
      className={cn('text-foreground pointer-events-none absolute inset-0 -z-10', className)}
      {...props}
    >
      <canvas ref={canvas} className="block size-full" />
    </div>
  );
}

export { HomeShader };
