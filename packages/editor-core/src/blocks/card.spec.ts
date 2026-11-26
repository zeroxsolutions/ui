// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '../document/core/types/index.js';
import { createCodecRegistry } from '../document/serialize/create-codec-registry.js';
import { serialize } from '../document/serialize/serialize-to-string.js';
import { card } from './card.js';

const registry = createCodecRegistry([{ id: 'card', nodes: [card.document!.node], codecs: [card.document!.codec] }]);

const attrs = {
  image: 'https://x.test/h.png',
  alt: 'A "bay"',
  heading: 'Hello <b>',
  buttonLabel: 'Go',
  buttonHref: 'https://x.test/go?a=1&b=2',
};
const docOf = (values: Record<string, unknown>): DocJSON => ({
  type: 'doc',
  content: [{ type: 'card', attrs: values, content: [{ type: 'text', text: 'Come soon' }] }],
});

describe('the card', () => {
  it('writes its image, heading, text and button into HTML, each value escaped', () => {
    expect(serialize(docOf(attrs), 'html', registry)).toContain(
      '<figure data-card><img src="https://x.test/h.png" alt="A &quot;bay&quot;"><figcaption><strong>Hello &lt;b&gt;</strong><div data-block-body>Come soon</div><a href="https://x.test/go?a=1&amp;b=2">Go</a></figcaption></figure>',
    );
  });

  it('writes no button where its label or link is empty, and no link a reader would not open', () => {
    expect(serialize(docOf({ ...attrs, buttonHref: '' }), 'html', registry)).not.toContain('<a');
    expect(serialize(docOf({ ...attrs, buttonLabel: '' }), 'html', registry)).not.toContain('<a');
    for (const buttonHref of ['javascript:alert(1)', '{{u}}', '   ']) {
      expect(serialize(docOf({ ...attrs, buttonHref }), 'html', registry)).not.toContain('<a');
    }
    expect(serialize(docOf({ ...attrs, buttonLabel: '   ' }), 'html', registry)).not.toContain('<a');
  });

  it('checks a stored card on write as the library card does, its button label and link together', () => {
    const content = { ...attrs, text: 'Come', buttonHref: '' };
    expect(card.email?.content.safeParse(content).success).toBe(false);
    expect(card.email?.content.safeParse({ ...content, buttonLabel: '' }).success).toBe(true);
  });
});
