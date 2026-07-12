import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NodeViewProps } from '../../core/index.js';
import { EmbedView } from './embed.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type EmbedAttrs = { url: string; title: string };

function embedProps(
  attrs: EmbedAttrs,
  editable: boolean,
  updateAttrs = vi.fn(),
): NodeViewProps<EmbedAttrs> {
  return {
    attrs,
    updateAttrs,
    editable,
    selected: false,
  } as unknown as NodeViewProps<EmbedAttrs>;
}

describe('EmbedView', () => {
  it('renders the design-system Input (not a raw <input>) for URL entry when empty + editable', () => {
    const { container } = render(<EmbedView {...embedProps({ url: '', title: '' }, true)} />);
    const input = container.querySelector('[data-slot="input"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('placeholder')).toBe('Paste a URL to embed…');
  });

  it('commits a trimmed URL on blur', () => {
    const updateAttrs = vi.fn();
    const { container } = render(
      <EmbedView {...embedProps({ url: '', title: '' }, true, updateAttrs)} />,
    );
    const input = container.querySelector('[data-slot="input"]') as HTMLInputElement;
    fireEvent.blur(input, { target: { value: '  https://example.com/v  ' } });
    expect(updateAttrs).toHaveBeenCalledWith({ url: 'https://example.com/v' });
  });

  it('commits on Enter (preventing default) and ignores an empty value', () => {
    const updateAttrs = vi.fn();
    const { container } = render(
      <EmbedView {...embedProps({ url: '', title: '' }, true, updateAttrs)} />,
    );
    const input = container.querySelector('[data-slot="input"]') as HTMLInputElement;
    input.value = '   ';
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(updateAttrs).not.toHaveBeenCalled();
    input.value = 'https://example.com/x';
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(updateAttrs).toHaveBeenCalledWith({ url: 'https://example.com/x' });
  });

  it('renders the iframe frame (no input) once a URL is set', () => {
    const { container } = render(
      <EmbedView {...embedProps({ url: 'https://example.com', title: '' }, true)} />,
    );
    expect(container.querySelector('[data-slot="embed"]')).not.toBeNull();
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(container.querySelector('[data-slot="input"]')).toBeNull();
  });

  it('renders nothing interactive for an empty embed in the read-only viewer', () => {
    const { container } = render(<EmbedView {...embedProps({ url: '', title: '' }, false)} />);
    expect(container.querySelector('[data-slot="input"]')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });
});
