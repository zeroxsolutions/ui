/**
 * One-time: renders every brand component in dist/brands/ to assets/brands/<variant>/<name>.svg.
 * Deleted by the commit that deletes the components; the files are the source from then on.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist/brands');
const OUT = resolve(ROOT, 'assets/brands');
const VARIANTS = ['color', 'mono', 'avatar', 'combine'] as const;
for (const v of VARIANTS) mkdirSync(resolve(OUT, v), { recursive: true });

type Mark = ComponentType<Record<string, unknown>> & {
  Color?: ComponentType<Record<string, unknown>>;
  Mono?: ComponentType<Record<string, unknown>>;
  Text?: ComponentType<Record<string, unknown>>;
  Avatar?: ComponentType<Record<string, unknown>>;
  Combine?: ComponentType<Record<string, unknown>>;
};

const render = (C: ComponentType<Record<string, unknown>>, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(C, props));

const viewBoxOf = (svg: string): [number, number, number, number] => {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) throw new Error('svg without a viewBox');
  return m[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number) as [number, number, number, number];
};

/**
 * Makes a component's markup a standalone image file: no title, no root inline style, the root's
 * size set to its viewBox (an <img> of an svg with no width/height reports naturalWidth 0 in
 * Firefox, which BrandMark reads as a failed load), an xmlns, and React's ids made fixed.
 */
function clean(svg: string, name: string): string {
  const [, , w, h] = viewBoxOf(svg);
  let out = svg
    .replace(/<title>[^<]*<\/title>/g, '')
    .replace(/^<svg([^>]*?)\sstyle="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height)="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height)="[^"]*"/, '<svg$1')
    .replace(/^<svg/, `<svg width="${w}" height="${h}"`);
  if (!/^<svg[^>]*\sxmlns=/.test(out)) out = out.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  const ids = [...out.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ids.forEach((id, i) => {
    const fixed = `${name}-${i}`;
    out = out.split(`id="${id}"`).join(`id="${fixed}"`).split(`#${id}`).join(`#${fixed}`);
  });
  return out;
}

/** Rounds a written coordinate to 4 decimals. */
const r4 = (n: number) => +n.toFixed(4);

/** Places an <svg> at x,y,w,h inside another, with `color` set so its currentColor resolves. */
const place = (svg: string, x: number, y: number, w: number, h: number, color: string) =>
  svg
    .replace(/^<svg([^>]*?)\s(?:width|height|color)="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height|color)="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height|color)="[^"]*"/, '<svg$1')
    .replace(/^<svg/, `<svg x="${r4(x)}" y="${r4(y)}" width="${r4(w)}" height="${r4(h)}" color="${color}"`);

/** A CSS linear-gradient as an SVG <linearGradient> over the object's box. */
function gradient(css: string, id: string): string {
  const inner = css.slice(css.indexOf('(') + 1, css.lastIndexOf(')'));
  const parts = inner.split(/,(?![^(]*\))/).map((p) => p.trim());
  let deg = 180;
  if (/deg$/.test(parts[0])) deg = parseFloat(parts.shift()!);
  else if (parts[0].startsWith('to ')) {
    deg = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[parts.shift()!] ?? 180;
  }
  const rad = (deg * Math.PI) / 180;
  const k = (Math.abs(Math.sin(rad)) + Math.abs(Math.cos(rad))) / 2;
  const [sx, sy] = [Math.sin(rad) * k, Math.cos(rad) * k];
  const stops = parts.map((p, i) => {
    const [color, pos] = p.split(/\s+/);
    const offset = pos ?? `${(i / (parts.length - 1)) * 100}%`;
    return `<stop offset="${offset}" stop-color="${color}"/>`;
  });
  return `<linearGradient id="${id}" x1="${r4(0.5 - sx)}" y1="${r4(0.5 + sy)}" x2="${r4(0.5 + sx)}" y2="${r4(0.5 - sy)}">${stops.join('')}</linearGradient>`;
}

/**
 * Avatars whose component paints the brand's own colours onto a background of the same colour, so
 * the tile renders blank. They are drawn as a one-colour silhouette instead.
 */
const SILHOUETTE = new Set(['heroku', 'pinecone', 'segment', 'twilio']);

const counts = { color: 0, mono: 0, avatar: 0, combine: 0 };
const write = (variant: (typeof VARIANTS)[number], name: string, svg: string) => {
  writeFileSync(resolve(OUT, variant, `${name}.svg`), `${svg}\n`);
  counts[variant] += 1;
};

for (const file of readdirSync(DIST)
  .filter((f) => f.endsWith('.js'))
  .sort()) {
  const name = file.slice(0, -3);
  const mod = (await import(resolve(DIST, file))) as Record<string, unknown>;
  const Mark = Object.values(mod).find((v) => typeof v === 'function') as Mark;
  const base = clean(render(Mark), name);
  const baseIsMono = base.includes('currentColor');

  const Mono = Mark.Mono ?? (baseIsMono ? Mark : undefined);
  const Color = Mark.Color ?? (baseIsMono ? undefined : Mark);
  const mono = Mono ? clean(render(Mono), name).replace(/^<svg/, '<svg color="#000"') : undefined;

  if (Color) {
    const color = clean(render(Color), name);
    write('color', name, color.includes('currentColor') ? color.replace(/^<svg/, '<svg color="#000"') : color);
  }
  if (mono) write('mono', name, mono);

  if (Mark.Avatar) {
    const html = render(Mark.Avatar, { size: 100 });
    const background = html.match(/background:(.*?);border-radius/)![1];
    const rawColor = html.match(/;color:([^;"]+)/)?.[1] ?? '#fff';
    // A glyph set in its own tile's colour is invisible, so it is drawn white.
    const color = rawColor.toLowerCase() === background.toLowerCase() ? '#fff' : rawColor;
    const icon = Number(html.match(/<svg[^>]*?width="(\d+)"/)![1]);
    let glyph = clean(html.slice(html.indexOf('<svg'), html.lastIndexOf('</svg>') + 6), `${name}-a`);
    if (SILHOUETTE.has(name)) {
      glyph = glyph.replace(/\sfill="(?!none|currentColor)[^"]*"/g, '').replace(/^<svg/, '<svg fill="currentColor"');
    }
    const fill = background.startsWith('linear-gradient') ? `url(#${name}-bg)` : background;
    const defs = background.startsWith('linear-gradient') ? `<defs>${gradient(background, `${name}-bg`)}</defs>` : '';
    const o = (100 - icon) / 2;
    write(
      'avatar',
      name,
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${defs}<rect width="100" height="100" fill="${fill}"/>${place(glyph, o, o, icon, icon, color)}</svg>`,
    );
  }

  if (Mark.Combine && Mark.Text && mono) {
    const html = render(Mark.Combine, { size: 100 });
    const gap = Number(html.match(/gap:(-?\d+)(?:px)?;/)![1]);
    const textHeight = Number(html.match(/font-size:(\d+)px/)![1]);
    const text = clean(render(Mark.Text), `${name}-t`);
    const [, , mw, mh] = viewBoxOf(mono);
    const [, , tw, th] = viewBoxOf(text);
    const iconWidth = (100 * mw) / mh;
    const textWidth = (textHeight * tw) / th;
    const width = r4(iconWidth + gap + textWidth);
    write(
      'combine',
      name,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="100" viewBox="0 0 ${width} 100">${place(mono, 0, 0, iconWidth, 100, '#000')}${place(text, iconWidth + gap, (100 - textHeight) / 2, textWidth, textHeight, '#000')}</svg>`,
    );
  }
}

console.log(`exported: ${JSON.stringify(counts)}`);
