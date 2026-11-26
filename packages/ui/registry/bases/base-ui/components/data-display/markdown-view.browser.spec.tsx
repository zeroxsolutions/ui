import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../../../test/nova-style.css';
import { MarkdownView } from './markdown-view';

describe('MarkdownView', () => {
  it('renders headings, strong emphasis, and links', async () => {
    await render(<MarkdownView>{'# Title\n\nHello **world** and [link](https://x.test)'}</MarkdownView>);
    await expect.element(page.getByRole('heading', { level: 1, name: 'Title' })).toBeVisible();
    expect(page.getByText('world').element().tagName).toBe('STRONG');
    await expect.element(page.getByRole('link', { name: 'link' })).toHaveAttribute('href', 'https://x.test');
  });

  it('renders GFM tables', async () => {
    await render(<MarkdownView>{'| A | B |\n| - | - |\n| 1 | 2 |'}</MarkdownView>);
    await expect.element(page.getByRole('table')).toBeVisible();
    await expect.element(page.getByRole('row').first()).toHaveTextContent(/^AB$/);
    await expect.element(page.getByRole('row').last()).toHaveTextContent(/^12$/);
  });

  it('does not render raw embedded HTML as markup (safe for untrusted content)', async () => {
    const { container } = await render(<MarkdownView>{'<script>alert(1)</script>\n\nsafe'}</MarkdownView>);
    await expect.element(page.getByText('safe')).toBeVisible();
    expect(container.querySelector('script')).toBeNull();
  });

  describe('fenced code', () => {
    it('renders fenced code as an interactive CodeCard (copy button)', async () => {
      await render(<MarkdownView>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      await expect.element(page.getByRole('button', { name: 'Copy code' })).toBeVisible();
      await expect.element(page.getByText('{ "a": 1 }', { exact: true })).toBeVisible();
    });

    it('heads a fenced block that names a language with that language', async () => {
      await render(<MarkdownView>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      await expect.element(page.getByText('JSON', { exact: true })).toBeVisible();
    });

    it('leaves a fenced block with no language headerless', async () => {
      await render(<MarkdownView>{'```\nline one\nline two\n```'}</MarkdownView>);
      await expect.element(page.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
      await expect.element(page.getByText('Plain text')).not.toBeInTheDocument();
    });

    it('keeps inline code as a plain chip (no copy button)', async () => {
      await render(<MarkdownView>{'use `npm` here'}</MarkdownView>);
      expect(page.getByText('npm', { exact: true }).element().tagName).toBe('CODE');
      await expect.element(page.getByRole('button', { name: 'Copy code' })).not.toBeInTheDocument();
    });
  });

  it('draws each GFM task item as a read-only checkbox in its state, which a click does not change', async () => {
    await render(
      <div className="style-nova">
        <MarkdownView>{'- [x] Ship the parser\n- [ ] Document the API'}</MarkdownView>
      </div>,
    );
    const done = page.getByRole('checkbox', { name: 'Ship the parser' });
    const open = page.getByRole('checkbox', { name: 'Document the API' });
    await expect.element(done).toBeChecked();
    await expect.element(open).not.toBeChecked();
    await expect.element(open).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(open);
    await expect.element(open).not.toBeChecked();
  });

  it('drops a nested task list below the parent row instead of beside its text', async () => {
    await render(<MarkdownView>{'- [ ] parent\n  - [ ] child'}</MarkdownView>);

    // A task's checkbox is named by its whole item, so the parent's name holds the child's text too.
    const child = page.getByRole('checkbox', { name: 'child', exact: true }).element();
    const parentItem = page.getByTestId('markdown-view-task-item').first().element();
    const row = parentItem.querySelector('[data-slot="markdown-view-task-item-row"]');

    expect(row?.contains(child)).toBe(false);
    const nestedList = parentItem.querySelector('ul');
    expect(nestedList?.contains(child)).toBe(true);
    expect(row?.compareDocumentPosition(nestedList as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
