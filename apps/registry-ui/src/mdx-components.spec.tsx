import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mdxComponents } from './mdx-components';

// The components list reads the compiled docs, which only a build generates; these cases never render it.
vi.mock('@/app/(app)/docs/[[...slug]]/_components/data-display/components-list', () => ({
  ComponentsList: () => null,
}));

afterEach(cleanup);

describe('mdxComponents.ComponentSource', () => {
  it('heads the source with the path its title gives', async () => {
    const { ComponentSource } = mdxComponents;
    render(<ComponentSource name="status-indicator" code="export {};" language="tsx" title="lib/status-tone.ts" />);
    await act(async () => {});

    expect(screen.getByText('lib/status-tone.ts')).toBeTruthy();
  });
});
