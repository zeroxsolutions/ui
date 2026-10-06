import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AiProviderIcon } from './ai-provider-icon';
import { BRAND_MARKS } from './lib/brand-manifest';

afterEach(cleanup);

const markOf = () => screen.getByRole('img', { name: 'Provider' });
const urlOf = () => markOf().getAttribute('src') ?? markOf().style.maskImage;

describe('AiProviderIcon', () => {
  it('resolves a known provider key to its brand mark', () => {
    render(<AiProviderIcon provider="openai" label="Provider" />);
    // openai ships no colour file, so the default variant draws mono.
    expect(urlOf()).toContain('/mono/openai.svg');
  });

  it('matches the provider key case-insensitively', () => {
    const lower = render(<AiProviderIcon provider="anthropic" label="Provider" />);
    const lowerUrl = urlOf();
    lower.unmount();
    render(<AiProviderIcon provider="ANTHROPIC" label="Provider" />);
    expect(lowerUrl).toContain('/anthropic.svg');
    expect(urlOf()).toContain('/anthropic.svg');
    expect(urlOf()).toBe(lowerUrl);
  });

  it('resolves an aliased key (claude-code -> Claude)', () => {
    render(<AiProviderIcon provider="claude-code" label="Provider" />);
    expect(urlOf()).toContain('/claude.svg');
  });

  it('renders the color variant for a mark that ships one', () => {
    render(<AiProviderIcon provider="gemini" type="color" label="Provider" />);
    expect(markOf().dataset.variant).toBe('color');
  });

  it('renders the mono variant following currentColor', () => {
    render(<AiProviderIcon provider="gemini" type="mono" label="Provider" />);
    expect(markOf().dataset.variant).toBe('mono');
    expect(markOf().style.backgroundColor).toBe('currentColor');
  });

  it('draws the avatar file, round', () => {
    render(<AiProviderIcon provider="openai" type="avatar" size={40} label="Provider" />);
    expect(markOf().dataset.variant).toBe('avatar');
    expect(markOf().style.borderRadius).toBe('50%');
  });

  it('applies a numeric size to an icon variant, the width following the file ratio', () => {
    render(<AiProviderIcon provider="openai" type="mono" size={32} label="Provider" />);
    expect(markOf().style.height).toBe('32px');
    expect(markOf().style.width).toBe(`${32 * BRAND_MARKS.openai.mono}px`);
    cleanup();
    render(<AiProviderIcon provider="openai" type="combine" size={32} label="Provider" />);
    expect(markOf().style.width).toBe(`${32 * BRAND_MARKS.openai.combine}px`);
  });

  it('renders a neutral fallback for an unknown provider key, hidden without a label', () => {
    const { container } = render(<AiProviderIcon provider="does-not-exist" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('title')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('names the fallback for an unknown key by its label', () => {
    render(<AiProviderIcon provider="totally-unknown-provider" label="Provider" />);
    expect(markOf().tagName.toLowerCase()).toBe('svg');
  });

  it('resolves an app-supplied extra mapping', () => {
    render(<AiProviderIcon provider="my-llm" label="Provider" extra={[{ keywords: ['my-llm'], mark: 'openai' }]} />);
    expect(urlOf()).toContain('/openai.svg');
  });
});
