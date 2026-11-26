// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { createEmailRenderer } from './renderer.js';

const blocks: EmailBlock[] = [
  { id: 'b1', type: 'paragraph', attributes: {}, content: { text: 'Hi {{name}},' } },
  { id: 'b2', type: 'paragraph', attributes: { tone: 'muted' }, content: { text: 'Ignore this if it was not you.' } },
  { id: 'b3', type: 'list', attributes: {}, content: { items: ['One', 'Two'] } },
  { id: 'b4', type: 'callout', attributes: {}, content: { text: 'Road closed.' } },
  { id: 'b5', type: 'button', attributes: {}, content: { label: 'Verify', href: '{{verify_url}}' } },
];

const rendered = createEmailRenderer({ theme: FIXTURE_THEME }).render({
  blocks,
  subject: 'Verify your email',
  preheader: 'Works for 30 minutes',
  locale: 'en',
  variables: { name: 'Mai', verify_url: 'https://x.test/v' },
  variableTypes: { name: 'string', verify_url: 'url' },
  layoutProps: FIXTURE_LAYOUT_PROPS,
});

describe('a render with no regions', () => {
  it('draws the blocks in order with their values filled, then the footer lines', () => {
    const order = [
      'Hi Mai,',
      'Ignore this if it was not you.',
      '<li>One</li><li>Two</li>',
      'Road closed.',
      '<a href="https://x.test/v"',
      'Example Company Limited, 1 Example Street.',
      'Sent because you created an account.',
    ].map((part) => rendered.html.indexOf(part));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(rendered.html).not.toContain('{{');
  });

  it('inlines the base sheet on every element it styles, and leaves only the narrow-screen rules in the head', () => {
    const classed = [
      ...rendered.html.matchAll(/<(?:div|ul|a|td)\b[^>]*class="[^"]*\bzx-(?:text|button|callout)\b[^>]*>/g),
    ];
    expect(classed.length).toBeGreaterThan(0);
    for (const [tag] of classed) expect(tag, tag).toMatch(/\bstyle="[^"]+"/);
    const head = /<style>(.*)<\/style>/.exec(rendered.html)?.[1] ?? '';
    expect(head.replace(/@media only screen and \(max-width:600px\)\{.*\}\}$/, '')).toBe('');
  });

  it('writes the same text as plain text, the button as its label and link', () => {
    expect(rendered.text).toBe(
      [
        'Hi Mai,',
        'Ignore this if it was not you.',
        '- One\n- Two',
        'Road closed.',
        'Verify: https://x.test/v',
        'Example Company Limited, 1 Example Street.\nSent because you created an account.',
      ].join('\n\n'),
    );
  });
});
