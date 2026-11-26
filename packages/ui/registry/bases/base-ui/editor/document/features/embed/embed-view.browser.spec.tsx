import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { ViewerLive } from '../../react/viewer-live';
import { standardKit } from '../standard/index';
import { embed } from './embed';

const features = [standardKit(), embed()];
const empty: DocJSON = {
  type: 'doc',
  content: [{ type: 'embed', attrs: { url: '', title: '' } }, { type: 'paragraph' }],
};
const urlOf = (editor: IEditor) => editor.getJSON().content?.[0]?.attrs?.url;
const addressField = () => page.getByPlaceholder('Paste a URL to embed…');

describe('an empty embed in the Document Editor', () => {
  it('takes the address typed into it, trimmed, when the field loses the focus', async () => {
    const editor = await mountDocumentEditor(features, empty);
    await userEvent.fill(addressField(), '  https://example.com/v  ');
    await userEvent.keyboard('{Tab}');
    await vi.waitFor(() => expect(urlOf(editor)).toBe('https://example.com/v'));
  });

  it('takes the address on Enter, and nothing for a blank one', async () => {
    const editor = await mountDocumentEditor(features, empty);
    await userEvent.fill(addressField(), '   ');
    await userEvent.keyboard('{Enter}');
    expect(urlOf(editor)).toBe('');
    await userEvent.fill(addressField(), 'https://example.com/x');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(urlOf(editor)).toBe('https://example.com/x'));
  });

  it('shows the embedded page in place of the field once it has an address', async () => {
    await mountDocumentEditor(features, empty);
    await userEvent.fill(addressField(), 'about:blank');
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByTestId('embed')).toBeVisible();
    expect(addressField().query()).toBeNull();
  });
});

describe('an empty embed in the read-only live Viewer', () => {
  it('draws nothing to type an address into', async () => {
    await render(<ViewerLive content={empty} features={features} />);
    await expect.element(page.getByRole('textbox')).toBeInTheDocument();
    expect(addressField().query()).toBeNull();
  });
});
