'use client';

import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** Seconds the field moves for before it settles; motion over five seconds would need a pause control (WCAG 2.2.2). */
const SETTLE_SECONDS = 4.5;
/** Seconds the field takes to appear, from nothing, so the switch from the static background does not show. */
const FADE_IN_SECONDS = 0.6;
/** The loop draws at most this often; the field is slow, so more frames buy nothing. */
const FRAME_MS = 1000 / 30;
/** Above this device pixel ratio the field looks the same and costs more fill. */
const MAX_DPR = 1.5;

const VERTEX_SHADER = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * Half the width, in CSS pixels, of the hero's text column (the page's `max-w-3xl`). The field is clear
 * across it: the sub-headline's muted colour holds 4.74:1 on the plain light background, and a module
 * at the base opacity behind it drops that to 4.39:1.
 */
const COLUMN_HALF_WIDTH = 384;
/** CSS pixels over which the field comes in beside the text column. */
const COLUMN_FADE_WIDTH = 160;

// A field of square modules on a 28-pixel grid. Each module's opacity drifts on its own phase while
// `amp` is above zero and holds the base opacity once it reaches zero. The field is clear across the
// text column and comes in beside it, and `fade` brings the whole field in from nothing, so the first
// frame matches the static background it replaces.
const FRAGMENT_SHADER = `precision mediump float;
uniform vec2 res; uniform float t; uniform float amp; uniform float fade; uniform vec3 ink; uniform float dpr;
float hash(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 px = gl_FragCoord.xy / dpr;
  vec2 cell = floor(px / 28.0);
  vec2 f = fract(px / 28.0);
  float inside = step(0.18, f.x) * step(f.x, 0.82) * step(0.18, f.y) * step(f.y, 0.82);
  float phase = hash(cell) * 6.2831;
  float a = 0.035 + amp * 0.03 * (0.5 + 0.5 * sin(t * 0.8 + phase));
  float column = abs(px.x - res.x / dpr * 0.5);
  float edge = smoothstep(${COLUMN_HALF_WIDTH}.0, ${COLUMN_HALF_WIDTH + COLUMN_FADE_WIDTH}.0, column);
  gl_FragColor = vec4(ink, a * inside * edge * fade);
}`;

/** The text colour as 0-1 sRGB channels, read through a 2D canvas so any CSS colour syntax resolves. */
function homeShaderInk(element: HTMLElement): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return [0, 0, 0];
  probe.fillStyle = getComputedStyle(element).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/**
 * The hero's background: a slow field of the logo's modules drawn with WebGL. It starts once the page
 * is idle, settles within five seconds and stops. Under reduced motion, without WebGL or before it
 * starts, it is an empty layer over the page's own background, so nothing moves and nothing breaks.
 */
function HomeShader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const container = host.current;
    if (!element || !container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let stopped = false;
    let visible = true;
    const start = (): void => {
      const gl = element.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
      if (!gl) return;
      const program = gl.createProgram();
      const shader = (type: number, text: string): void => {
        const unit = gl.createShader(type);
        if (!unit || !program) return;
        gl.shaderSource(unit, text);
        gl.compileShader(unit);
        gl.attachShader(program, unit);
      };
      if (!program) return;
      shader(gl.VERTEX_SHADER, VERTEX_SHADER);
      shader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const uniform = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);

      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const size = (): void => {
        element.width = Math.round(container.clientWidth * dpr);
        element.height = Math.round(container.clientHeight * dpr);
        gl.viewport(0, 0, element.width, element.height);
      };
      size();
      const began = performance.now();
      let last = 0;
      const draw = (now: number): void => {
        if (stopped) return;
        const seconds = (now - began) / 1000;
        const amp = Math.max(0, 1 - seconds / SETTLE_SECONDS);
        // The settled frame is always drawn, even inside the 30fps throttle, so the field holds amp 0.
        if (visible && (amp === 0 || now - last >= FRAME_MS)) {
          last = now;
          gl.uniform2f(uniform('res'), element.width, element.height);
          gl.uniform1f(uniform('t'), seconds);
          gl.uniform1f(uniform('amp'), amp);
          gl.uniform1f(uniform('fade'), Math.min(1, seconds / FADE_IN_SECONDS));
          gl.uniform1f(uniform('dpr'), dpr);
          gl.uniform3f(uniform('ink'), ...homeShaderInk(container));
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        if (amp > 0) frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };

    let onScreen = true;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      visible = onScreen && document.visibilityState === 'visible';
    });
    observer.observe(container);
    const onVisibility = (): void => {
      visible = onScreen && document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Safari has no requestIdleCallback by default; there the start waits a fixed 200ms instead.
    const idleSupported = typeof window.requestIdleCallback === 'function';
    const idle = idleSupported ? window.requestIdleCallback(start) : window.setTimeout(start, 200);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (idleSupported) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
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
      <canvas ref={canvas} className="size-full" />
    </div>
  );
}

export { HomeShader };
