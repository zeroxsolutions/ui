import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { mdxComponents } from './mdx-components';

// The components list reads the compiled docs, which only a build generates; these cases never render it.
vi.mock('@/components/navigation/components-list', () => ({ ComponentsList: () => null }));

const { pre: Pre } = mdxComponents;

/** Renders a fence as MDX hands it to `pre`: a `code` child with the fence's language class and text. */
async function renderFence(text: string, language?: string, title?: string): Promise<void> {
  const element = (await Pre({
    title,
    children: <code className={language ? `language-${language}` : undefined}>{`${text}\n`}</code>,
  })) as ReactNode;
  render(element);
  await act(async () => {});
}

beforeAll(() => {
  // The block's scroll area measures with a ResizeObserver and reads getAnimations, both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

describe('mdxComponents.pre', () => {
  it('heads a fence with its language, and its title beside it when it has one', async () => {
    await renderFence('const a = 1', 'tsx', 'app.tsx');

    const header = document.querySelector('[data-slot="collapsible-card-header"]');
    expect(header?.textContent).toContain('TSX');
    expect(header?.textContent).toContain('app.tsx');
  });

  it('paints the fence with the lines tokenized as it renders, and keeps the copy button out of the scroller', async () => {
    await renderFence('const a = 1', 'ts');

    expect(document.querySelector('[data-slot="highlighted-code"] span')).not.toBeNull();
    const copy = screen.getByRole('button', { name: 'Copy code' });
    expect(copy.closest('[data-slot="code-block-viewport"]')).toBeNull();
  });

  it('renders an npm command as the package-manager block', async () => {
    await renderFence('npx shadcn@latest add x', 'bash');

    expect(screen.getByRole('tab', { name: 'pnpm' })).toBeTruthy();
    expect(document.querySelector('[data-slot="highlighted-code"]')?.textContent).toBe('pnpm dlx shadcn@latest add x');
  });
});
