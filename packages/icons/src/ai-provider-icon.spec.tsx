import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AiProviderIcon } from './ai-provider-icon';
import { resolveAiProviderMark } from './ai-provider-config';

afterEach(cleanup);

const titleOf = (container: HTMLElement) =>
  container.querySelector('title')?.textContent;

describe('AiProviderIcon', () => {
  it('resolves a known provider key to its brand mark', () => {
    const { container } = render(<AiProviderIcon provider="openai" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(titleOf(container)).toBe('OpenAI');
  });

  it('matches the provider key case-insensitively', () => {
    const lower = render(<AiProviderIcon provider="anthropic" />);
    const upper = render(<AiProviderIcon provider="ANTHROPIC" />);
    expect(titleOf(lower.container)).toBe('Anthropic');
    expect(titleOf(upper.container)).toBe(titleOf(lower.container));
  });

  it('resolves an aliased key (claude-code -> Claude)', () => {
    const { container } = render(<AiProviderIcon provider="claude-code" />);
    expect(titleOf(container)).toBe('Claude');
  });

  it('renders the color variant for a mark that ships one', () => {
    const { container } = render(
      <AiProviderIcon provider="gemini" type="color" />,
    );
    // Gemini's color variant paints intrinsic fills (not currentColor).
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('fill')).not.toBe('currentColor');
  });

  it('renders the mono variant following currentColor', () => {
    const { container } = render(
      <AiProviderIcon provider="gemini" type="mono" />,
    );
    expect(container.querySelector('svg')?.getAttribute('fill')).toBe(
      'currentColor',
    );
  });

  it('wraps the mark in a rounded container for the avatar variant', () => {
    const { container } = render(
      <AiProviderIcon provider="openai" type="avatar" size={40} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe('span');
    expect(root.querySelector('svg')).toBeTruthy();
  });

  it('applies a numeric size to an icon variant', () => {
    const { container } = render(
      <AiProviderIcon provider="openai" type="mono" size={32} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('renders a neutral fallback for an unknown provider key', () => {
    const { container } = render(<AiProviderIcon provider="does-not-exist" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(titleOf(container)).toBe('AI provider');
  });

  it('does not throw for an unknown key', () => {
    expect(() =>
      render(<AiProviderIcon provider="totally-unknown-provider" />),
    ).not.toThrow();
  });

  it('resolves an app-supplied extra mapping', () => {
    const mark = resolveAiProviderMark('openai')!;
    const { container } = render(
      <AiProviderIcon
        provider="my-custom-key"
        extra={[{ keywords: ['my-custom-key'], Icon: mark }]}
      />,
    );
    expect(titleOf(container)).toBe('OpenAI');
  });
});
