import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { Viewer } from '../../react/viewer';
import { callout } from '../callout/index';
import { standardKit } from '../standard/index';
import { toggleHeading } from '../toggle-heading/index';
import { tableOfContents } from './table-of-contents';

const heading = (level: number, text: string): NodeJSON => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});
const line = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });

const content: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph' },
    { type: 'toggleHeading', attrs: { open: true }, content: [heading(2, 'Day one')] },
    // Enough lines that the last heading starts below the fold.
    ...Array.from({ length: 60 }, (_, index) => line(`Line ${index + 1}`)),
    heading(3, 'Night'),
  ],
};

const listed = () =>
  page
    .getByRole('navigation', { name: 'Table of contents' })
    .getByRole('link')
    .elements()
    .map((link) => link.textContent);

describe('the table of contents in the Document Editor', () => {
  it('is inserted from the slash menu, follows the headings as they change and scrolls to one', async () => {
    const editor = await mountDocumentEditor([standardKit(), toggleHeading(), tableOfContents()], content);

    await insertFromSlashMenu('Table of contents');
    await expect.poll(listed).toEqual(['Day one', 'Night']);

    await userEvent.click(page.getByRole('heading', { level: 3, name: 'Night' }));
    await userEvent.keyboard('{End} falls');
    await expect.poll(listed).toEqual(['Day one', 'Night falls']);

    const night = page.getByRole('heading', { level: 3, name: 'Night falls' });
    await userEvent.click(page.getByRole('link', { name: 'Day one' }));
    await expect.element(night).not.toBeInViewport();
    await userEvent.click(page.getByRole('link', { name: 'Night falls' }));
    await expect.element(night).toBeInViewport();
    expect(editor.getJSON().content?.filter((node) => node.type === 'tableOfContents')).toHaveLength(1);
  });

  it('asks for a heading while the document has none', async () => {
    await mountDocumentEditor([standardKit(), tableOfContents()]);
    await insertFromSlashMenu('Table of contents');
    await expect
      .element(page.getByTestId('table-of-contents'))
      .toHaveTextContent('Add a heading and it is listed here.');
  });
});

describe('the table of contents in the Viewer', () => {
  it('opens the toggle heading folding the heading an entry links to, and brings it into view', async () => {
    const screen = await render(
      <Viewer
        doc={{
          type: 'doc',
          content: [
            { type: 'tableOfContents' },
            { type: 'toggleHeading', attrs: { open: false }, content: [heading(2, 'Day one'), heading(3, 'Morning')] },
          ],
        }}
        features={[standardKit(), callout(), toggleHeading(), tableOfContents()]}
      />,
    );
    // Folded, the heading is out of the accessibility tree, so the locator takes hidden elements too.
    const morning = screen.getByRole('heading', { level: 3, name: 'Morning', includeHidden: true });
    await expect.element(morning).not.toBeVisible();

    await userEvent.click(screen.getByRole('link', { name: 'Morning' }));

    await expect.element(morning).toBeVisible();
    await expect.element(morning).toBeInViewport();
  });
});
