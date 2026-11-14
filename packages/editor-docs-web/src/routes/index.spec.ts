import { describe, expect, it } from 'vitest';

import { editorDocsPageRoute, editorDocsRoute, editorDocsShareImageRoute } from './index';

describe('editor docs routes', () => {
  it('builds the editor paths', () => {
    expect(editorDocsRoute.build()).toBe('/docs/editor');
    expect(editorDocsPageRoute.build({ name: 'document-editor' })).toBe('/docs/editor/document-editor');
    expect(editorDocsShareImageRoute.build({ slug: 'document-editor/image.png' })).toBe(
      '/og/docs/editor/document-editor/image.png',
    );
  });

  it('reads the page name back from its own path', () => {
    expect(editorDocsPageRoute.matcher('/docs/editor/document-editor')).toMatchObject({
      params: { name: 'document-editor' },
    });
  });
});
