import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { Editor } from '../../react/editor';
import { standardKit } from '../standard/index';
import { mention } from './index';

const pill = { type: 'mention', attrs: { id: 'u1', label: 'Lan' } };
const content: DocJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hi ' }, pill] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Hi ' }, pill] },
  ],
};

describe('a mention', () => {
  // The pill is a Badge, whose own text is a label's size; in a document it is a word of its line.
  it('reads at the size of the text around it', async () => {
    const screen = await render(
      <div className="style-nova">
        <Editor features={[standardKit(), mention()]} content={content} />
      </div>,
    );
    await expect.element(screen.getByText('@Lan').first()).toBeVisible();
    const sizes = [...document.querySelectorAll('[data-slot=mention]')].map((element) => {
      const block = element.closest('h1, p');
      return [getComputedStyle(element).fontSize, block && getComputedStyle(block).fontSize];
    });
    expect(sizes).toHaveLength(2);
    for (const [own, around] of sizes) expect(own).toBe(around);
  });
});
