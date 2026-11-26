import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { HUES } from '@zeroxsolutions/editor-core/template/layout/index';

const ROOT = resolve(import.meta.dirname, '../..');
const STYLES = readFileSync(resolve(ROOT, 'registry/bases/base-ui/styles.css'), 'utf8');
const REGISTRY = JSON.parse(readFileSync(resolve(ROOT, 'registry.json'), 'utf8')) as {
  items: { name: string; cssVars?: Record<string, Record<string, string>> }[];
};

/** WCAG 2's least contrast for body text, level AA. */
const AA = 4.5;

/** The custom properties a block of the sheet declares, by name without the leading dashes. */
function declared(selector: ':root' | '.dark'): Record<string, string> {
  const start = STYLES.indexOf(`${selector} {`);
  const body = STYLES.slice(start, STYLES.indexOf('\n}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]));
}

/** An `oklch(L C H)` colour as linear sRGB channels, clipped to the gamut a screen draws. */
function linearOf(oklch: string): [number, number, number] {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(oklch.trim());
  if (!match) throw new Error(`not an oklch colour: ${oklch}`);
  const [lightness, chroma, hue] = match.slice(1).map(Number);
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel))) as [number, number, number];
}

function luminance([red, green, blue]: [number, number, number]): number {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The WCAG 2 contrast ratio of two colours. */
function contrast(one: string, other: string): number {
  const [lighter, darker] = [luminance(linearOf(one)), luminance(linearOf(other))].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('the named hues', () => {
  const schemes = { light: declared(':root'), dark: declared('.dark') };

  describe.each(Object.entries(schemes))('in %s', (_, vars) => {
    it.each(HUES)('reads %s text at AA on the page and on its own surface', (hue) => {
      expect(contrast(vars[`hue-${hue}`], vars.background)).toBeGreaterThanOrEqual(AA);
      expect(contrast(vars[`hue-${hue}`], vars[`hue-${hue}-surface`])).toBeGreaterThanOrEqual(AA);
    });
  });

  it.each(['document-editor', 'editor-section'])('installs the sheet values with %s', (name) => {
    const cssVars = REGISTRY.items.find((item) => item.name === name)?.cssVars ?? {};
    for (const scheme of ['light', 'dark'] as const) {
      const installed = Object.entries(cssVars[scheme] ?? {}).filter(([key]) => key.startsWith('hue-'));
      expect(installed.length).toBeGreaterThan(0);
      for (const [key, value] of installed) expect([scheme, key, value]).toEqual([scheme, key, schemes[scheme][key]]);
    }
  });
});
