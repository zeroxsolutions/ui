import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mdxComponents } from './mdx-components';

// The components list reads the compiled docs, which only a build generates; these cases never render it.
vi.mock('@/components/navigation/components-list', () => ({ ComponentsList: () => null }));

const { pre: Pre } = mdxComponents;

/** Renders a fence as MDX hands it to `pre`: a `code` child with the fence's language class and text, and the lines `rehypeDocsCode` set. */
async function renderFence(
  text: string,
  { language, title, lines }: { language?: string; title?: string; lines?: string } = {},
): Promise<HTMLElement> {
  const { container } = render(
    <Pre title={title} lines={lines}>
      <code className={language ? `language-${language}` : undefined}>{`${text}\n`}</code>
    </Pre>,
  );
  await act(async () => {});
  return container;
}

afterEach(cleanup);

describe('mdxComponents.pre', () => {
  it('heads a fence with its language as the fence spells it, and its title beside it', async () => {
    await renderFence('const a = 1', { language: 'tsx', title: 'app.tsx' });

    expect(screen.getByText('tsx', { exact: true })).toBeTruthy();
    expect(screen.getByText('app.tsx')).toBeTruthy();
  });

  it('heads a command fence with bash, and shows the command as written', async () => {
    const container = await renderFence('pnpm dlx shadcn@latest add x', { language: 'bash' });

    expect(screen.getByText('bash', { exact: true })).toBeTruthy();
    expect(container.querySelector('code')?.textContent).toBe('pnpm dlx shadcn@latest add x');
  });

  it('paints the fence with the lines tokenized as the page compiled, under a copy button', async () => {
    const lines = JSON.stringify([
      [{ content: 'const', style: { color: 'var(--code-keyword)' } }, { content: ' a = 1' }],
    ]);
    const container = await renderFence('const a = 1', { language: 'ts', lines });

    expect(container.querySelector('code span')?.textContent).toBe('const');
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });
});
