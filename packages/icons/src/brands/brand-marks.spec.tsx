import { cleanup, render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { GithubMark } from './github-mark';

/**
 * Glob-driven smoke test over the whole `brands/` set (mirrors `material.spec.tsx`).
 * Every mark base renders a non-empty svg; each present lobehub-style variant
 * (`.Color`/`.Mono`/`.Avatar`/`.Text`/`.Combine`) renders; no two marks share an
 * internal svg id across instances. Adding a mark needs no edit here. The internal
 * composition helpers live under `./internal/*` and are excluded by the shallow glob.
 */
type IconComponent = ComponentType<{ size?: string | number }> & {
  Color?: ComponentType<{ size?: string | number }>;
  Mono?: ComponentType<{ size?: string | number }>;
  Avatar?: ComponentType<Record<string, unknown>>;
  Text?: ComponentType<Record<string, unknown>>;
  Combine?: ComponentType<Record<string, unknown>>;
};

const modules = import.meta.glob('./*.tsx', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const marks = Object.entries(modules)
  .filter(([path]) => !path.endsWith('.spec.tsx'))
  .map(([path, mod]) => {
    const entry = Object.entries(mod).find(([, v]) => typeof v === 'function');
    const [name, Component] = entry as [string, IconComponent];
    return { name, path, Component };
  });

const VARIANT_KEYS = ['Color', 'Mono', 'Avatar', 'Text', 'Combine'] as const;

afterEach(cleanup);

describe('brands mark set', () => {
  it('exposes a substantial, growing set of marks', () => {
    expect(marks.length).toBeGreaterThanOrEqual(15);
  });

  it.each(marks)('$name base renders a non-empty svg', ({ Component }) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBeTruthy();
    expect((svg?.children.length ?? 0) > 0).toBe(true);
  });

  const variantCases = marks.flatMap(({ name, Component }) =>
    VARIANT_KEYS.filter((k) => typeof Component[k] === 'function').map((k) => ({
      name,
      key: k,
      Variant: Component[k] as ComponentType<Record<string, unknown>>,
    })),
  );

  it.each(variantCases)('$name.$key renders an svg', ({ Variant }) => {
    const { container } = render(<Variant />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies the size prop to an icon-form variant', () => {
    const openai = marks.find((m) => m.name === 'OpenaiMark')!;
    const { container } = render(<openai.Component size={24} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('GithubMark renders a currentColor svg and forwards arbitrary props', () => {
    const { container } = render(
      <GithubMark className="size-4" data-testid="gh" aria-label="GitHub" />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.classList.contains('size-4')).toBe(true);
    expect(svg?.getAttribute('data-testid')).toBe('gh');
  });

  it('no two different marks share an internal svg id', () => {
    const ids: string[] = [];
    for (const { Component } of marks) {
      const { container, unmount } = render(<Component />);
      container
        .querySelectorAll('[id]')
        .forEach((el) => ids.push((el as Element).id));
      unmount();
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});
