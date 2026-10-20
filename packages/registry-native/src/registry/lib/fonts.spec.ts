import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRadiusScale, themeItem, STATUS_TOKENS, type UpstreamColors } from '../../build/theme';
import { zuiFonts } from './fonts';

const STYLES = join(__dirname, '../../../styles/upstream');
const colors = JSON.parse(readFileSync(join(STYLES, 'colors-neutral.json'), 'utf8')) as UpstreamColors;
const radii = parseRadiusScale(readFileSync(join(STYLES, 'globals.css'), 'utf8'));

describe('zuiFonts', () => {
  it('holds a font for every family the nativewind theme names', () => {
    const { tailwind } = themeItem(colors, radii, STATUS_TOKENS, 'nativewind');
    const extend = (tailwind?.config?.theme?.extend ?? {}) as { fontFamily?: Record<string, string[]> };
    const fontFamily = extend.fontFamily ?? {};
    const families = Object.values(fontFamily).flat();

    expect(families).toHaveLength(4);
    expect(Object.keys(zuiFonts).sort()).toEqual([...families].sort());
  });
});
