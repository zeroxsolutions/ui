import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setFluentEmojiBase, setFluentEmojiStyle } from './fluent-emoji-url';
import { FluentEmoji } from './fluent-emoji';
import { FluentEmojiStyleProvider, useFluentEmojiStyle } from './fluent-emoji-style-provider';

const BASE = 'https://cdn.example/emoji';
const src = () => screen.getByRole('img').getAttribute('src');

afterEach(() => {
  cleanup();
  setFluentEmojiBase(undefined);
  setFluentEmojiStyle(undefined);
});

describe('FluentEmojiStyleProvider', () => {
  it('renders a bare <FluentEmoji> in the ambient style', () => {
    setFluentEmojiBase(BASE);
    render(
      <FluentEmojiStyleProvider defaultStyle="flat">
        <FluentEmoji glyph="🤯" />
      </FluentEmojiStyleProvider>,
    );
    expect(src()).toBe(`${BASE}/flat/1f92f.svg`);
  });

  it('lets an explicit variant win over the ambient style', () => {
    setFluentEmojiBase(BASE);
    render(
      <FluentEmojiStyleProvider defaultStyle="flat">
        <FluentEmoji glyph="🤯" variant="3d" />
      </FluentEmojiStyleProvider>,
    );
    expect(src()).toBe(`${BASE}/3d/1f92f.webp`);
  });

  it('re-renders every subscribed <FluentEmoji> when the ambient style changes', () => {
    setFluentEmojiBase(BASE);

    function StyleSwitch() {
      const { setStyle } = useFluentEmojiStyle();
      return <button onClick={() => setStyle('mono')}>switch</button>;
    }

    render(
      <FluentEmojiStyleProvider defaultStyle="3d">
        <FluentEmoji glyph="🤯" />
        <StyleSwitch />
      </FluentEmojiStyleProvider>,
    );

    // Starts in the ambient 3D set…
    expect(src()).toBe(`${BASE}/3d/1f92f.webp`);

    // …and switching the ambient style redraws the already-mounted emoji.
    fireEvent.click(screen.getByRole('button', { name: 'switch' }));
    expect(src()).toBe(`${BASE}/mono/1f92f.svg`);
  });

  it('mirrors the ambient style into the module-global resolver', () => {
    setFluentEmojiBase(BASE);
    render(
      <FluentEmojiStyleProvider defaultStyle="modern">
        <span />
      </FluentEmojiStyleProvider>,
    );
    // A FluentEmoji rendered OUTSIDE the provider now resolves to the mirrored
    // global, so non-React `fluentEmojiUrl` callers stay in sync.
    render(<FluentEmoji glyph="🤯" />);
    expect(src()).toBe(`${BASE}/modern/1f92f.svg`);
  });

  it('drives the value from `style` when controlled', () => {
    setFluentEmojiBase(BASE);
    render(
      <FluentEmojiStyleProvider style="mono">
        <FluentEmoji glyph="🤯" />
      </FluentEmojiStyleProvider>,
    );
    expect(src()).toBe(`${BASE}/mono/1f92f.svg`);
  });

  it('reports changes via onStyleChange', () => {
    const onStyleChange = vi.fn();
    const { result } = renderHook(() => useFluentEmojiStyle(), {
      wrapper: ({ children }) => (
        <FluentEmojiStyleProvider defaultStyle="3d" onStyleChange={onStyleChange}>
          {children}
        </FluentEmojiStyleProvider>
      ),
    });
    result.current.setStyle('flat');
    expect(onStyleChange).toHaveBeenCalledWith('flat');
  });
});

describe('useFluentEmojiStyle', () => {
  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useFluentEmojiStyle())).toThrow(/within <FluentEmojiStyleProvider>/);
  });
});

describe('<FluentEmoji> without a provider', () => {
  it('falls back to the 3D default', () => {
    setFluentEmojiBase(BASE);
    render(<FluentEmoji glyph="🤯" />);
    expect(src()).toBe(`${BASE}/3d/1f92f.webp`);
  });
});
