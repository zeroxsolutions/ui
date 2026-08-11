import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { EditorView } from '@codemirror/view';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type {
  DocJSON,
  IEditor,
  NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importMarkdown,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index.js';
import { mermaid, MermaidView, mermaidCodec } from './mermaid.js';

// Keep the heavy Mermaid engine out of the node-view render: the render path is
// debounced and its timer is cleared on unmount before it fires in a synchronous
// test, but mocking the seam makes that guarantee explicit and deterministic.
vi.mock('../../../mermaid/core/engine.js', () => ({
  renderDiagram: vi.fn(async (_id: string, source: string) => ({
    ok: true,
    svg: `<svg data-source="${source}"></svg>`,
  })),
}));

// The editable node view mounts a real CodeMirror editor plus Base UI Tabs /
// Combobox / ScrollArea surfaces; jsdom lacks the layout/animation/pointer APIs
// all three reach for.
beforeAll(() => {
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
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(mermaid());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
  cleanup();
});

// mermaid is registered before standard so it claims the ```mermaid code fence
// before the generic code-block codec.
const registry = createCodecRegistry([mermaid(), standardKit()]);

const SOURCE = 'graph TD;\n  A-->B;';

function nodeViewProps(
  attrs: { source: string },
  editable: boolean,
  updateAttrs = vi.fn(),
): NodeViewProps<{ source: string }> {
  return {
    attrs,
    updateAttrs,
    editable,
    selected: false,
  } as unknown as NodeViewProps<{ source: string }>;
}

describe('mermaid', () => {
  it('inserts a mermaid node with the given source via its command', () => {
    const editor = build();
    expect(editor.run('insertMermaid', { source: SOURCE })).not.toBe(false);
    const node = editor.getJSON().content?.find((n) => n.type === 'mermaid');
    expect(node?.type).toBe('mermaid');
    expect(node?.attrs?.source).toBe(SOURCE);
  });

  it('exports a mermaid node as a ```mermaid fenced block with the source', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ type: 'mermaid', attrs: { source: SOURCE } }],
    };
    const md = serialize(doc, 'markdown', registry);
    expect(md).toContain('```mermaid');
    expect(md).toContain(SOURCE);
  });

  it('imports a ```mermaid fenced block back into a mermaid node', () => {
    const result = importMarkdown('```mermaid\ngraph TD;A-->B;\n```', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('mermaid');
    expect(node?.attrs?.source).toBe('graph TD;A-->B;');
  });
});

describe('mermaid node view (editable)', () => {
  it('composes the shared Disclosure header — type label, View/Edit tabs, copy', () => {
    const { container } = render(
      <MermaidView {...nodeViewProps({ source: SOURCE }, true)} />,
    );
    // The header + body are the shared Disclosure compound, not a bespoke strip.
    expect(container.querySelector('[data-slot="disclosure"]')).not.toBeNull();
    const title = container.querySelector<HTMLElement>(
      '[data-slot="disclosure-title"]',
    );
    expect(title).not.toBeNull();
    expect(within(title!).getByText('Flowchart')).toBeTruthy();
    // The View/Edit tab control + copy live in the actions slot.
    const actions = container.querySelector<HTMLElement>(
      '[data-slot="disclosure-actions"]',
    );
    expect(actions).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'View' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy source' })).toBeTruthy();
  });

  it('reveals the CodeMirror pane on the Edit tab', () => {
    const { container } = render(
      <MermaidView {...nodeViewProps({ source: SOURCE }, true)} />,
    );
    // An existing diagram opens on View — the edit pane is not mounted yet.
    expect(
      container.querySelector('[data-slot="code-mirror-pane"]'),
    ).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Edit' }));
    expect(
      container.querySelector('[data-slot="code-mirror-pane"]'),
    ).not.toBeNull();
    expect(container.querySelector('.cm-content')).not.toBeNull();
  });

  it('writes an edit to the source attribute', () => {
    const updateAttrs = vi.fn();
    // An empty block opens on Edit, so the pane is mounted immediately.
    const { container } = render(
      <MermaidView {...nodeViewProps({ source: '' }, true, updateAttrs)} />,
    );
    const cm = container.querySelector<HTMLElement>('.cm-editor');
    expect(cm).not.toBeNull();
    const view = EditorView.findFromDOM(cm!);
    expect(view).not.toBeNull();
    view!.dispatch({
      changes: { from: view!.state.doc.length, insert: 'graph TD' },
    });
    expect(updateAttrs).toHaveBeenCalledWith({ source: 'graph TD' });
  });

  it('copies the source through the copy control', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MermaidView {...nodeViewProps({ source: SOURCE }, true)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }));
    expect(writeText).toHaveBeenCalledWith(SOURCE);
  });
});

describe('mermaid node view (read-only)', () => {
  it('frames the diagram in the design-system Card, with no edit tabs', () => {
    const { container } = render(
      <MermaidView {...nodeViewProps({ source: SOURCE }, false)} />,
    );
    expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
    expect(screen.queryByRole('tab', { name: 'Edit' })).toBeNull();
  });
});

describe('mermaid export codec', () => {
  it('renders toReact through the read-only design-system CodeBlock', () => {
    const rendered = mermaidCodec.toReact?.(
      { type: 'mermaid', attrs: { source: SOURCE } } as never,
      {} as never,
    ) as ReactNode;
    const { container } = render(<>{rendered}</>);
    expect(container.querySelector('[data-slot="code-block"]')).not.toBeNull();
    expect(container.textContent).toContain('graph TD');
  });
});
