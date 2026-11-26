import { describe, expect, it } from 'vitest';

import { editorDocsPageRoute } from './index';

describe('editor docs routes', () => {
  it('reads the page name back from the path it builds', () => {
    expect(editorDocsPageRoute.matcher(editorDocsPageRoute.build({ name: 'document-editor' }))).toMatchObject({
      params: { name: 'document-editor' },
    });
  });
});
