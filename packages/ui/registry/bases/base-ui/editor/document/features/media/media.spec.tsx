import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index';
import { Viewer } from '../../react/viewer';
import { media } from './media';

const features = [standardKit(), media()];

const docOf = (attrs: Record<string, unknown>): DocJSON => ({ type: 'doc', content: [{ type: 'media', attrs }] });

function viewed(attrs: Record<string, unknown>): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Viewer doc={docOf(attrs)} features={features} />);
  return host;
}

describe('media', () => {
  it('draws a video with its controls, poster and caption in the Viewer', () => {
    const host = viewed({ src: 'https://c.test/a.mp4', poster: 'https://c.test/a.jpg', caption: 'Lanterns' });
    const video = host.querySelector('video')!;
    expect(video.getAttribute('src')).toBe('https://c.test/a.mp4');
    expect(video.getAttribute('poster')).toBe('https://c.test/a.jpg');
    expect(video.hasAttribute('controls')).toBe(true);
    expect(host.querySelector('figcaption')?.textContent).toBe('Lanterns');
  });

  it('draws an audio player for an audio block', () => {
    const host = viewed({ src: 'https://c.test/a.mp3', kind: 'audio' });
    expect(host.querySelector('audio')?.getAttribute('src')).toBe('https://c.test/a.mp3');
    expect(host.querySelector('video')).toBeNull();
    expect(host.querySelector('figcaption')).toBeNull();
  });

  it('loads nothing from an address that is not a web one', () => {
    const video = viewed({
      src: 'javascript:alert(1)',
      poster: 'data:image/svg+xml,<svg onload=alert(1)>',
    }).querySelector('video')!;
    expect(video.hasAttribute('src')).toBe(false);
    expect(video.hasAttribute('poster')).toBe(false);
  });

  it('offers a video and an audio item in the slash menu', () => {
    expect(
      collectUiContributions([media()]).slash.map(({ title, command, args }) => ({ title, command, args })),
    ).toEqual([
      { title: 'Video', command: 'insertBlock:media', args: undefined },
      { title: 'Audio', command: 'insertBlock:media', args: { attributes: { kind: 'audio' } } },
    ]);
  });

  it('round-trips through HTML with the Viewer features', () => {
    const registry = createCodecRegistry(features);
    const doc = docOf({ src: 'https://c.test/a.mp3', kind: 'audio', caption: 'Rain' });
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });
});
