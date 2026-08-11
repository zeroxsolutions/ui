import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { EditorView } from '@codemirror/view';

import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import { CodeBlockNodeView, codeBlockCodec } from './code-block.js';

// The editable node view mounts a real CodeMirror editor and a Base UI
// Combobox/DropdownMenu; the read-only path renders the design-system CodeBlock's
// ScrollArea. jsdom lacks the layout/animation/pointer APIs all three reach for.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Range.prototype.getClientRects ??= () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect;
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

afterEach(cleanup);

type CodeBlockAttrs = { language: string; code: string };

function nodeViewProps(
  attrs: CodeBlockAttrs,
  editable: boolean,
  updateAttrs = vi.fn(),
): NodeViewProps<CodeBlockAttrs> {
  return {
    attrs,
    updateAttrs,
    editable,
    selected: false,
  } as unknown as NodeViewProps<CodeBlockAttrs>;
}

describe('code-block node view (editable)', () => {
  it('frames CodeMirrorPane inside the shared Disclosure', () => {
    const { container } = render(
      <CodeBlockNodeView {...nodeViewProps({ language: 'typescript', code: 'const x = 1' }, true)} />,
    );
    const disclosure = container.querySelector('[data-slot="disclosure"]');
    expect(disclosure).not.toBeNull();
    // The editing surface is the moved CodeMirror pane, framed by the Disclosure.
    expect(disclosure?.querySelector('[data-slot="code-mirror-pane"]')).not.toBeNull();
    expect(container.querySelector('.cm-content')).not.toBeNull();
  });

  it('writes an edit to the code attribute', () => {
    const updateAttrs = vi.fn();
    const { container } = render(
      <CodeBlockNodeView {...nodeViewProps({ language: 'typescript', code: 'a' }, true, updateAttrs)} />,
    );
    const cm = container.querySelector<HTMLElement>('.cm-editor');
    expect(cm).not.toBeNull();
    const view = EditorView.findFromDOM(cm!);
    expect(view).not.toBeNull();
    // Typing at the end of the document flows through the pane's onValueChange.
    view!.dispatch({ changes: { from: view!.state.doc.length, insert: 'X' } });
    expect(updateAttrs).toHaveBeenCalledWith({ code: 'aX' });
  });

  it('writes a language switch to the language attribute', () => {
    const updateAttrs = vi.fn();
    render(
      <CodeBlockNodeView {...nodeViewProps({ language: 'text', code: 'x' }, true, updateAttrs)} />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: /language/i }));
    const python = screen.getAllByText('Python')[0];
    const item = python.closest('[data-slot="combobox-item"]');
    expect(item).not.toBeNull();
    fireEvent.click(item!);
    expect(updateAttrs).toHaveBeenCalledWith(
      expect.objectContaining({ language: expect.any(String) }),
    );
  });

  it('opens the settings menu without crashing', () => {
    // Regression: the settings menu's "Tab size" DropdownMenuLabel must sit inside
    // a group/radio-group context, or Base UI throws "MenuGroupContext is missing"
    // when the menu OPENS — a crash no closed-menu test could catch.
    render(
      <CodeBlockNodeView {...nodeViewProps({ language: 'typescript', code: 'const x = 1' }, true)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Code settings' }));
    expect(screen.getByText('Tab size')).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: '4' })).toBeTruthy();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Soft wrap' })).toBeTruthy();
  });

  it('copies the source through the copy control', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <CodeBlockNodeView {...nodeViewProps({ language: 'typescript', code: 'payload' }, true)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('payload');
  });
});

describe('code-block node view (read-only)', () => {
  it('renders the read-only design-system CodeBlock, not the editing pane', () => {
    const { container } = render(
      <CodeBlockNodeView {...nodeViewProps({ language: 'text', code: 'hello' }, false)} />,
    );
    expect(container.querySelector('[data-slot="code-block"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="code-mirror-pane"]')).toBeNull();
    expect(container.querySelector('.cm-content')).toBeNull();
    expect(screen.getByText('hello')).toBeTruthy();
  });
});

describe('code-block export codec', () => {
  it('renders toReact through the read-only design-system CodeBlock', () => {
    const rendered = codeBlockCodec.toReact?.(
      { type: 'codeBlock', attrs: { language: 'text', code: 'exported' } } as never,
      {} as never,
    ) as ReactNode;
    const { container } = render(<>{rendered}</>);
    expect(container.querySelector('[data-slot="code-block"]')).not.toBeNull();
    expect(screen.getByText('exported')).toBeTruthy();
  });
});
