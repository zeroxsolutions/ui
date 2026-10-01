/** Seconds the field moves for before it settles; motion over five seconds would need a pause control (WCAG 2.2.2). */
const SETTLE_SECONDS = 4.5;
/** Seconds the field takes to appear, from nothing, so the switch from the static background does not show. */
const FADE_IN_SECONDS = 0.6;
/** The loop draws at most this often; the field is slow, so more frames buy nothing. */
const FRAME_MS = 1000 / 30;
/** Above this device pixel ratio the field looks the same and costs more fill. */
const MAX_DPR = 1.5;

/**
 * Half the width, in CSS pixels, of the hero's text column. It matches the `max-w-3xl` (48rem) on the
 * hero's inner column in `(app)/page.tsx`; a wider column there puts text over the field. The field is
 * clear across it: the sub-headline's muted colour holds 4.74:1 on the plain light background, and a
 * module at the base opacity behind it drops that to 4.39:1.
 */
const COLUMN_HALF_WIDTH = 384;
/** CSS pixels over which the field comes in beside the text column. */
const COLUMN_FADE_WIDTH = 160;
/** CSS pixels over which the field fades out at the hero's top and bottom edges. */
const EDGE_FADE_HEIGHT = 56;

const VERTEX_SHADER = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

// A field of square modules on a 28-pixel grid. Each module's opacity drifts on its own phase while
// `amp` is above zero and holds the base opacity once it reaches zero. The field is clear across the
// text column and comes in beside it, fades out at the top and bottom edges, and `fade` brings the
// whole field in from nothing, so the first frame matches the static background it replaces.
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
  float rows = smoothstep(0.0, ${EDGE_FADE_HEIGHT}.0, px.y) * smoothstep(0.0, ${EDGE_FADE_HEIGHT}.0, res.y / dpr - px.y);
  gl_FragColor = vec4(ink, a * inside * edge * rows * fade);
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
 * Draws the hero's module field into `canvas`, sized to `container` and inked in its text colour.
 * The field moves for SETTLE_SECONDS of wall time and then holds still; the loop requests no frames
 * while the tab is hidden or the container is off screen, and none once settled. A resize or a theme
 * change (a class change on the root element) redraws one frame at the current state.
 *
 * @returns the cleanup: stops the loop, disconnects every observer and releases the WebGL context.
 *   Without WebGL, or if the program fails to link, nothing is drawn and the cleanup does nothing.
 */
function startHomeShaderField(container: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl || gl.isContextLost()) return () => undefined;
  const release = (): void => gl.getExtension('WEBGL_lose_context')?.loseContext();
  const program = gl.createProgram();
  for (const [type, text] of [
    [gl.VERTEX_SHADER, VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
  ] as const) {
    // The context was just confirmed live, so createShader cannot return null here.
    const unit = gl.createShader(type)!;
    gl.shaderSource(unit, text);
    gl.compileShader(unit);
    gl.attachShader(program, unit);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    release();
    return () => undefined;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = {
    res: gl.getUniformLocation(program, 'res'),
    t: gl.getUniformLocation(program, 't'),
    amp: gl.getUniformLocation(program, 'amp'),
    fade: gl.getUniformLocation(program, 'fade'),
    ink: gl.getUniformLocation(program, 'ink'),
    dpr: gl.getUniformLocation(program, 'dpr'),
  };

  const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
  const began = performance.now();
  let ink = homeShaderInk(container);
  let frame = 0;
  let last = 0;
  let onScreen = true;

  const visible = (): boolean => onScreen && document.visibilityState === 'visible';
  const secondsAt = (now: number): number => (now - began) / 1000;
  const size = (): void => {
    canvas.width = Math.round(container.clientWidth * dpr);
    canvas.height = Math.round(container.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  /** Draws the field as it stands `seconds` after the start; past SETTLE_SECONDS that is the settled field. */
  const drawFrame = (seconds: number): void => {
    gl.uniform2f(uniform.res, canvas.width, canvas.height);
    gl.uniform1f(uniform.t, seconds);
    gl.uniform1f(uniform.amp, Math.max(0, 1 - seconds / SETTLE_SECONDS));
    gl.uniform1f(uniform.fade, Math.min(1, seconds / FADE_IN_SECONDS));
    gl.uniform1f(uniform.dpr, dpr);
    gl.uniform3f(uniform.ink, ...ink);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const tick = (now: number): void => {
    frame = 0;
    const seconds = secondsAt(now);
    const settled = seconds >= SETTLE_SECONDS;
    if (settled || now - last >= FRAME_MS) {
      last = now;
      drawFrame(seconds);
    }
    if (!settled && visible()) frame = requestAnimationFrame(tick);
  };
  // Past SETTLE_SECONDS the one frame this requests draws the settled field and requests no other.
  const resume = (): void => {
    if (frame === 0 && visible()) frame = requestAnimationFrame(tick);
  };
  const redraw = (): void => drawFrame(secondsAt(performance.now()));

  size();
  const resizes = new ResizeObserver(() => {
    size();
    redraw();
  });
  resizes.observe(container);
  const themes = new MutationObserver(() => {
    ink = homeShaderInk(container);
    redraw();
  });
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const onScreenChanges = new IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    resume();
  });
  onScreenChanges.observe(container);
  document.addEventListener('visibilitychange', resume);
  resume();

  return () => {
    cancelAnimationFrame(frame);
    resizes.disconnect();
    themes.disconnect();
    onScreenChanges.disconnect();
    document.removeEventListener('visibilitychange', resume);
    release();
  };
}

export { startHomeShaderField };
