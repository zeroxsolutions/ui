import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CodeMirrorPane } from './code-mirror-pane.js';

beforeAll(() => {
  // CodeMirror measures layout on mount; jsdom lacks these.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Range.prototype.getClientRects ??= () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect;
});

afterEach(() => {
  cleanup();
});

describe('CodeMirrorPane', () => {
  it('mounts a CodeMirror editor showing the document text', () => {
    const { container } = render(
      <CodeMirrorPane value={'const x = 1'} language="typescript" />,
    );
    const content = container.querySelector('.cm-content');
    expect(content).not.toBeNull();
    expect(content?.textContent).toContain('const x = 1');
  });

  it('reflects language and read-only as data attributes', () => {
    const { container } = render(
      <CodeMirrorPane value="x" language="python" readOnly />,
    );
    const root = container.querySelector('[data-slot="code-mirror-pane"]')!;
    expect(root.getAttribute('data-language')).toBe('python');
    expect(root.getAttribute('data-readonly')).toBe('true');
    // read-only editors are not contenteditable
    expect(
      container.querySelector('.cm-content')?.getAttribute('contenteditable'),
    ).toBe('false');
  });

  it('shows the line-number gutter by default and hides it when disabled', () => {
    const { container, rerender } = render(
      <CodeMirrorPane value={'a\nb'} language="typescript" />,
    );
    // Default: the gutter is present.
    expect(container.querySelector('.cm-lineNumbers')).not.toBeNull();
    // Toggling the compartment removes the gutter without a remount.
    rerender(
      <CodeMirrorPane
        value={'a\nb'}
        language="typescript"
        showLineNumbers={false}
      />,
    );
    expect(container.querySelector('.cm-lineNumbers')).toBeNull();
    // …and toggling it back restores it (compartment reconfigure, still no remount).
    rerender(
      <CodeMirrorPane value={'a\nb'} language="typescript" showLineNumbers />,
    );
    expect(container.querySelector('.cm-lineNumbers')).not.toBeNull();
  });

  it('mounts and keeps its text with custom indent settings (tabSize + useTabs)', () => {
    const { container } = render(
      <CodeMirrorPane
        value={'const x = 1'}
        language="typescript"
        tabSize={8}
        useTabs
      />,
    );
    expect(container.querySelector('.cm-content')?.textContent).toContain(
      'const x = 1',
    );
  });

  it('syncs a controlled value change into the editor', () => {
    const { container, rerender } = render(
      <CodeMirrorPane value="first" language="typescript" />,
    );
    expect(container.querySelector('.cm-content')?.textContent).toContain(
      'first',
    );
    rerender(<CodeMirrorPane value="second" language="typescript" />);
    expect(container.querySelector('.cm-content')?.textContent).toContain(
      'second',
    );
    expect(container.querySelector('.cm-content')?.textContent).not.toContain(
      'first',
    );
  });

  // Regression: in a dark app the editor was built with CodeMirror's LIGHT
  // baseTheme, whose focused-selection rule
  // (`.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground`,
  // specificity 0,5,0) out-ranked the theme's shorter `.cm-focused
  // .cm-selectionBackground` (0,3,0). The pale light default then sat behind the
  // (light) `--code-fg` text, so selecting all made the text disappear. The
  // theme's selection rule must mirror that 5-class path so the `var(--accent)`
  // highlight wins the cascade. Asserting on the injected CSS, not pixels,
  // because jsdom can't compute `color-mix`/`oklch` — but it preserves the rule
  // text verbatim.
  it("themes the selection so it out-ranks CodeMirror's baseTheme default", () => {
    render(<CodeMirrorPane value={'const x = 1'} language="typescript" />);

    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .join('\n');

    // Each `<sel> { <decl> }` block, in source order.
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
      selector: m[1].trim(),
      decl: m[2].trim(),
    }));

    // Our token-driven selection rule (the only one using `var(--accent)`).
    const ours = blocks.findIndex(
      (b) =>
        b.decl.includes('var(--accent)') &&
        b.selector.includes('cm-selectionBackground'),
    );
    expect(ours).toBeGreaterThanOrEqual(0);

    // It must carry the high-specificity layer path, else the base default wins.
    expect(blocks[ours].selector).toContain(
      '.cm-scroller > .cm-selectionLayer .cm-selectionBackground',
    );

    // Same specificity as the base focused rule(s) → ours must come LAST so the
    // source-order tiebreak resolves in its favour.
    const lastBaseSelection = blocks.reduce(
      (last, b, i) =>
        b.selector.includes('.cm-selectionLayer .cm-selectionBackground') &&
        !b.decl.includes('var(--accent)')
          ? i
          : last,
      -1,
    );
    expect(lastBaseSelection).toBeGreaterThanOrEqual(0); // base rules present
    expect(ours).toBeGreaterThan(lastBaseSelection);
  });
});
