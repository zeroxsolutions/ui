import { cleanup, render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Retained smoke test over the generated Material icon set. Guards the one-time
 * conversion: every module must export a renderable, non-empty svg; the light
 * variants must expose a working `.Light`; and no two different icons may share
 * an internal SVG id (the cross-icon collision hazard the per-icon id prefix
 * solves — see the change's design D5).
 */
type IconComponent = ComponentType<{ size?: string | number }> & {
  Light?: ComponentType<{ size?: string | number }>;
};

const modules = import.meta.glob('./*.tsx', { eager: true }) as Record<string, Record<string, IconComponent>>;

const icons = Object.entries(modules)
  .filter(([path]) => !path.endsWith('.spec.tsx'))
  .map(([path, mod]) => {
    const [name, Component] = Object.entries(mod)[0];
    return { name, Component };
  });

afterEach(cleanup);

describe('material icon set', () => {
  it('exports 587 icon modules', () => {
    expect(icons.length).toBe(587);
  });

  it.each(icons)('$name renders a non-empty svg', ({ Component }) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBeTruthy();
    expect((svg?.children.length ?? 0) > 0).toBe(true);
  });

  it('applies the size prop to width/height', () => {
    const { Component } = icons.find((i) => i.name === 'TypescriptIcon')!;
    const { container } = render(<Component size={24} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  const withLight = icons.filter((i) => typeof i.Component.Light === 'function');

  it('exposes .Light on exactly 46 icons', () => {
    expect(withLight.length).toBe(46);
  });

  it.each(withLight)('$name.Light renders a non-empty svg', ({ Component }) => {
    const Light = Component.Light!;
    const { container } = render(<Light />);
    expect((container.querySelector('svg')?.children.length ?? 0) > 0).toBe(true);
  });

  it('no two different icons share an internal svg id', () => {
    const ids: string[] = [];
    for (const { Component } of icons) {
      const { container, unmount } = render(<Component />);
      container.querySelectorAll('[id]').forEach((el) => ids.push((el as Element).id));
      unmount();
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});
