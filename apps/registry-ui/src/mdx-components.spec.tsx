import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mdxComponents } from './mdx-components';

// The components list reads the compiled docs, which only a build generates; these cases never render it.
vi.mock('@/components/navigation/components-list', () => ({ ComponentsList: () => null }));

const { figcaption: Figcaption, pre: Pre } = mdxComponents;

afterEach(cleanup);

describe('mdxComponents', () => {
  it('heads a fence with its language, and its title beside it when it has one', () => {
    const { container, rerender } = render(<Figcaption data-language="tsx" />);

    expect(container.textContent).toBe('tsx');

    rerender(<Figcaption data-language="tsx">app.tsx</Figcaption>);

    expect(container.textContent).toBe('tsxapp.tsx');
  });

  it("puts a fence's copy button outside its scroller", async () => {
    render(
      <Pre __raw__="const a = 1">
        <code>const a = 1</code>
      </Pre>,
    );

    // Found by waiting, so the scroll area's measuring after mount settles inside act.
    const copy = await screen.findByRole('button', { name: 'Copy' });
    expect(copy.closest('[data-slot=scroll-area]')).toBeNull();
    expect(screen.getByText('const a = 1').closest('[data-slot=scroll-area]')).not.toBeNull();
  });

  it('leaves a package-manager command to its own block, with no second copy button', () => {
    render(
      <Pre __raw__="npx shadcn@latest add x">
        <code>npx shadcn@latest add x</code>
      </Pre>,
    );

    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
  });
});
