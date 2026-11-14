import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { ComponentsList } from './components-list';

afterEach(cleanup);

describe('ComponentsList', () => {
  it("links each item to its page's folder: a component under its base, an editor item under editor", () => {
    render(
      <TestHost>
        <ComponentsList writtenDocsPage={(href) => href} />
      </TestHost>,
    );
    expect(screen.getByRole('link', { name: 'Image Preview' }).getAttribute('href')).toBe(
      '/docs/components/base/image-preview',
    );
    expect(screen.getByRole('link', { name: 'Document Editor' }).getAttribute('href')).toBe(
      '/docs/editor/document-editor',
    );
  });
});
