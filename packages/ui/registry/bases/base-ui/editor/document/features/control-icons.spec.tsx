import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import type { ComponentProps } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import { CodeSettingsMenu } from './code-block/code-settings-menu';
import { MathBlockView, MathInlineView } from './math/math';
import { MermaidView } from './mermaid/mermaid';

vi.mock('../../mermaid/core/engine', () => ({
  renderDiagram: vi.fn(async () => ({ ok: true, svg: '<svg></svg>' })),
}));

const handles = vi.hoisted(() => {
  const make = () => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() });
  return {
    check: make(),
    eye: make(),
    omega: make(),
    pencilLine: make(),
    settings2: make(),
    x: make(),
  };
});

function mockedIcon(handle: { startAnimation: () => void; stopAnimation: () => void }) {
  return React.forwardRef<unknown, ComponentProps<'span'>>((props, ref) => {
    React.useImperativeHandle(ref, () => handle);
    return <span aria-hidden={props['aria-hidden']} className={props.className} />;
  });
}

vi.mock('@/registry/bases/base-ui/icons/check-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/check-icon')>()),
  CheckIcon: mockedIcon(handles.check),
}));
vi.mock('@/registry/bases/base-ui/icons/eye-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/eye-icon')>()),
  EyeIcon: mockedIcon(handles.eye),
}));
vi.mock('@/registry/bases/base-ui/icons/omega-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/omega-icon')>()),
  OmegaIcon: mockedIcon(handles.omega),
}));
vi.mock('@/registry/bases/base-ui/icons/pencil-line-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/pencil-line-icon')>()),
  PencilLineIcon: mockedIcon(handles.pencilLine),
}));
vi.mock('@/registry/bases/base-ui/icons/settings-2-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/settings-2-icon')>()),
  Settings2Icon: mockedIcon(handles.settings2),
}));
vi.mock('@/registry/bases/base-ui/icons/x-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/x-icon')>()),
  XIcon: mockedIcon(handles.x),
}));

// The views mount Base UI Tabs, Popover and a real CodeMirror pane; jsdom lacks the APIs they reach for.
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

afterEach(() => {
  cleanup();
  for (const handle of Object.values(handles)) {
    handle.startAnimation.mockClear();
    handle.stopAnimation.mockClear();
  }
});

function viewProps<T>(attrs: T): NodeViewProps<T> {
  return { attrs, updateAttrs: vi.fn(), editable: true, selected: false } as unknown as NodeViewProps<T>;
}

type Handle = { startAnimation: ReturnType<typeof vi.fn>; stopAnimation: ReturnType<typeof vi.fn> };

/** Pointer enter and focus start the icon; leave and blur stop it. */
function expectStartsAndStops(control: HTMLElement, handle: Handle): void {
  fireEvent.pointerEnter(control);
  expect(handle.startAnimation).toHaveBeenCalledTimes(1);
  fireEvent.pointerLeave(control);
  expect(handle.stopAnimation).toHaveBeenCalledTimes(1);
  fireEvent.focus(control);
  expect(handle.startAnimation).toHaveBeenCalledTimes(2);
  fireEvent.blur(control);
  expect(handle.stopAnimation).toHaveBeenCalledTimes(2);
}

describe('the View and Edit tabs of a mermaid block', () => {
  it("starts a tab's icon on pointer enter and on focus, and stops it on leave and blur", () => {
    render(<MermaidView {...viewProps({ source: 'graph TD' })} />);
    expectStartsAndStops(screen.getByRole('tab', { name: 'View' }), handles.eye);
    expectStartsAndStops(screen.getByRole('tab', { name: 'Edit' }), handles.pencilLine);
  });
});

describe('the controls of a math block', () => {
  it("starts a tab's icon on pointer enter and on focus, and stops it on leave and blur", () => {
    render(<MathBlockView {...viewProps({ latex: 'E=mc^2' })} />);
    expectStartsAndStops(screen.getByRole('tab', { name: 'View' }), handles.eye);
    expectStartsAndStops(screen.getByRole('tab', { name: 'Edit' }), handles.pencilLine);
  });

  it("starts the Insert button's icon on pointer enter and on focus, and stops it on leave and blur", () => {
    // An empty block opens on Edit, where the button is.
    render(<MathBlockView {...viewProps({ latex: '' })} />);
    expectStartsAndStops(screen.getByRole('button', { name: 'Insert' }), handles.omega);
  });
});

describe('the controls of an inline math formula', () => {
  async function openForm(): Promise<void> {
    // The accessible-name walk reads the popover's styles, which jsdom cannot parse, so the buttons are found by label.
    render(<MathInlineView {...viewProps({ latex: 'x' })} />);
    fireEvent.click(document.querySelector('[data-math="inline"]')!);
    await act(async () => {});
  }

  it("starts the symbol button's icon on pointer enter and on focus, and stops it on leave and blur", async () => {
    await openForm();
    expectStartsAndStops(screen.getByLabelText('Insert symbol'), handles.omega);
  });

  it("starts the Apply and Cancel buttons' icons on pointer enter and on focus, and stops them on leave and blur", async () => {
    await openForm();
    expectStartsAndStops(screen.getByLabelText('Apply'), handles.check);
    expectStartsAndStops(screen.getByLabelText('Cancel'), handles.x);
  });
});

describe('the code settings menu', () => {
  it("starts the trigger's icon on pointer enter and on focus, and stops it on leave and blur", () => {
    const settings = { tabSize: 2, useTabs: false, showLineNumbers: true, softWrap: false };
    render(<CodeSettingsMenu settings={settings} onSettingsChange={() => {}} />);
    expectStartsAndStops(screen.getByRole('button', { name: 'Code settings' }), handles.settings2);
  });
});
