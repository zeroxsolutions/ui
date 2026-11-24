import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { button } from './button';

const registry = createCodecRegistry([button(), standardKit()]);

const docOf = (attrs: Record<string, unknown>): DocJSON => ({ type: 'doc', content: [{ type: 'button', attrs }] });

describe('button', () => {
  it('round-trips through HTML, its label, link and place', () => {
    const doc = docOf({
      label: 'Go',
      href: 'https://x.test/a?b=1&c=2',
      align: 'center',
      width: 'full',
      spaceAfter: 'large',
    });
    const html = serialize(doc, 'html', registry);
    expect(html).toContain(
      '<div data-button data-align="center" data-width="full" data-space-after="large"><a href="https://x.test/a?b=1&amp;c=2">Go</a></div>',
    );
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it('escapes its label in HTML and reads it back as written', () => {
    const doc = docOf({ label: '"><script>alert(1)</script>', href: 'https://x.test' });
    const html = serialize(doc, 'html', registry);
    expect(html).not.toContain('<script');
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it.each(['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', '{{url}}', 'java\tscript:x'])(
    'writes no link for %s in HTML, Markdown or the Viewer',
    (href) => {
      const doc = docOf({ label: 'Go', href });
      expect(serialize(doc, 'html', registry)).toContain('<a>Go</a>');
      expect(serialize(doc, 'markdown', registry).trim()).toBe('Go');
      expect(renderToStaticMarkup(<Viewer doc={doc} features={[button(), standardKit()]} />)).not.toContain('href');
    },
  );

  it('reads no link a reader would not open from HTML', () => {
    const html = '<div data-button data-align="sideways"><a href="javascript:alert(1)">Go</a></div>';
    expect(importHTML(html, registry).doc).toEqual(docOf({ label: 'Go' }));
  });

  it('writes Markdown as a link on its own line, its label escaped', () => {
    const doc = docOf({ label: 'Go [now]', href: 'https://x.test/a b(c)' });
    expect(serialize(doc, 'markdown', registry).trim()).toBe('[Go \\[now\\]](https://x.test/a%20b%28c%29)');
  });

  it('draws in the Viewer as a link in the button look', () => {
    const markup = renderToStaticMarkup(
      <Viewer doc={docOf({ label: 'Go', href: 'https://x.test' })} features={[button(), standardKit()]} />,
    );
    expect(markup).toContain('data-slot="link-button"');
    expect(markup).toMatch(/<a href="https:\/\/x.test"[^>]*>Go<\/a>/);
  });
});
