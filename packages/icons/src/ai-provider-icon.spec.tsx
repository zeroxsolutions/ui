import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AiProviderIcon } from './ai-provider-icon';

afterEach(cleanup);

const titleOf = (container: HTMLElement) => container.querySelector('title')?.textContent;
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

  it('applies a numeric size to an icon variant', () => {
    render(<AiProviderIcon provider="openai" type="mono" size={32} label="Provider" />);
    expect(markOf().style.height).toBe('32px');
  });

  it('renders a neutral fallback for an unknown provider key', () => {
    const { container } = render(<AiProviderIcon provider="does-not-exist" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(titleOf(container)).toBe('AI provider');
  });

  it('does not throw for an unknown key', () => {
    expect(() => render(<AiProviderIcon provider="totally-unknown-provider" />)).not.toThrow();
  });

  it('resolves an app-supplied extra mapping', () => {
    render(<AiProviderIcon provider="my-llm" label="Provider" extra={[{ keywords: ['my-llm'], mark: 'openai' }]} />);
    expect(urlOf()).toContain('/openai.svg');
  });
});
