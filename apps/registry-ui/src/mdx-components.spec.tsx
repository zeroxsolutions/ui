import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mdxComponents } from './mdx-components';

// The docs loader reads the compiled docs, which only a build generates; these cases never render the components list.
vi.mock('@/lib/source', () => ({ writtenDocsPage: () => undefined }));

afterEach(cleanup);

describe('mdxComponents.ComponentSource', () => {
  it('heads the source with the path its title gives', async () => {
    const { ComponentSource } = mdxComponents;
    render(<ComponentSource name="status-indicator" code="export {};" language="tsx" title="lib/status-tone.ts" />);
    await act(async () => {});

    expect(screen.getByText('lib/status-tone.ts')).toBeTruthy();
  });
});
