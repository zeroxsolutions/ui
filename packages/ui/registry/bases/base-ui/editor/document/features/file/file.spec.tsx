import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index';
import { Viewer } from '../../react/viewer';
import { file } from './file';

const features = [standardKit(), file()];

const docOf = (attrs: Record<string, unknown>): DocJSON => ({ type: 'doc', content: [{ type: 'file', attrs }] });

function viewed(attrs: Record<string, unknown>): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Viewer doc={docOf(attrs)} features={features} />);
  return host;
}

describe('file', () => {
  it('draws a row downloading the file, with its name and size, in the Viewer', () => {
    const row = viewed({ name: 'plan.pdf', href: 'https://f.test/plan.pdf', size: 1536 }).querySelector(
      '[data-slot=file]',
    )!;
    expect(row.getAttribute('href')).toBe('https://f.test/plan.pdf');
    expect(row.hasAttribute('download')).toBe(true);
    expect(row.querySelector('[data-slot=file-name]')?.textContent).toBe('plan.pdf');
    expect(row.querySelector('[data-slot=file-size]')?.textContent).toBe('1.5 KB');
  });

  it('shows no size it does not know', () => {
    expect(viewed({ name: 'a', href: 'https://f.test/a' }).querySelector('[data-slot=file-size]')).toBeNull();
  });

  it('downloads nothing from an address that is not a web or mail one', () => {
    const row = viewed({ name: 'a', href: 'javascript:alert(1)' }).querySelector('[data-slot=file]')!;
    expect(row.hasAttribute('href')).toBe(false);
  });

  it('round-trips through HTML with the Viewer features', () => {
    const registry = createCodecRegistry(features);
    const doc = docOf({ name: 'a.pdf', href: 'https://f.test/a.pdf', size: 10 });
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });
});
