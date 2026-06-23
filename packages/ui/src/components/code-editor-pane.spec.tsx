import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CodeEditorPane } from './code-editor-pane';

beforeAll(() => {
  // CodeMirror measures layout on mount; jsdom lacks these.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Range.prototype.getClientRects ??= () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect;
});

afterEach(() => {
  cleanup();
});

describe('CodeEditorPane', () => {
  it('mounts a CodeMirror editor showing the document text', () => {
    const { container } = render(
      <CodeEditorPane value={'const x = 1'} language="typescript" />,
    );
    const content = container.querySelector('.cm-content');
    expect(content).not.toBeNull();
    expect(content?.textContent).toContain('const x = 1');
  });

  it('reflects language and read-only as data attributes', () => {
    const { container } = render(
      <CodeEditorPane value="x" language="python" readOnly />,
    );
    const root = container.querySelector('[data-slot="code-editor-pane"]')!;
    expect(root.getAttribute('data-language')).toBe('python');
    expect(root.getAttribute('data-readonly')).toBe('true');
    // read-only editors are not contenteditable
    expect(
      container.querySelector('.cm-content')?.getAttribute('contenteditable'),
    ).toBe('false');
  });

  it('syncs a controlled value change into the editor', () => {
    const { container, rerender } = render(
      <CodeEditorPane value="first" language="typescript" />,
    );
    expect(container.querySelector('.cm-content')?.textContent).toContain(
      'first',
    );
    rerender(<CodeEditorPane value="second" language="typescript" />);
    expect(container.querySelector('.cm-content')?.textContent).toContain(
      'second',
    );
    expect(container.querySelector('.cm-content')?.textContent).not.toContain(
      'first',
    );
  });
});
