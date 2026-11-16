import { render } from '@testing-library/react-native';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from 'shadcn/schema';
import { demos } from './index';

const REGISTRY_PATH = join(__dirname, '../../registry.json');
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Registry;
/** Utils draws nothing, so it has no demo; the theme's demo draws its colours and fonts. */
const DRAWN_TYPES = new Set(['registry:theme', 'registry:ui', 'registry:component', 'registry:block']);
/** An animated icon has no demo of its own, as on the web; the controls that play it show it. */
const isAnimatedIcon = (item: Registry['items'][number]): boolean =>
  item.type === 'registry:ui' && item.name.endsWith('-icon');
const drawnItems = registry.items
  .filter((item) => DRAWN_TYPES.has(item.type) && !isAnimatedIcon(item))
  .map((item) => item.name);

describe('demos', () => {
  it('has a <name>-demo for the theme and every ui, component and block item of the registry, and nothing else', () => {
    expect(drawnItems.length).toBeGreaterThan(0);
    expect(Object.keys(demos).sort()).toEqual(drawnItems.map((name) => `${name}-demo`).sort());
  });

  it.each(drawnItems)('keeps the %s demo in its own <name>-demo.tsx', (name) => {
    expect(existsSync(join(__dirname, `${name}-demo.tsx`))).toBe(true);
  });

  it.each(Object.entries(demos))('renders %s without throwing', async (_name, Demo) => {
    await expect(render(<Demo />)).resolves.toBeDefined();
  });
});
