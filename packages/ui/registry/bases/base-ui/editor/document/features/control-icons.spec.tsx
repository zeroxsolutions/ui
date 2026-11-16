import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import type { ComponentProps } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import { ChatInput } from '../../composer/chat-input';
import { MathToolbar } from '../../math/react/toolbar';
import { DiagramCanvas } from '../../mermaid/react/preview';
import { MermaidToolbar } from '../../mermaid/react/toolbar';
import { ToggleView } from './toggle/toggle';
import { CodeSettingsMenu } from './code-block/code-settings-menu';
import { MathBlockView, MathInlineView } from './math/math';
import { MermaidView } from './mermaid/mermaid';

vi.mock('../../mermaid/core/engine', () => ({
  renderDiagram: vi.fn(async () => ({ ok: true, svg: '<svg></svg>' })),
}));

const handles = vi.hoisted(() => {
  const make = () => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() });
  return {
    arrowUp: make(),
    check: make(),
    chevronRight: make(),
    copy: make(),
    download: make(),
    image: make(),
    maximize: make(),
    minus: make(),
    plus: make(),
    rotateCcw: make(),
    eye: make(),
    omega: make(),
    pencilLine: make(),
    settings2: make(),
    workflow: make(),
    x: make(),
  };
});

function mockedIcon(handle: { startAnimation: () => void; stopAnimation: () => void }) {
  return React.forwardRef<unknown, ComponentProps<'span'>>((props, ref) => {
    React.useImperativeHandle(ref, () => handle);
    return <span aria-hidden={props['aria-hidden']} className={props.className} />;
  });
}

vi.mock('@/registry/bases/base-ui/icons/arrow-up-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/arrow-up-icon')>()),
  ArrowUpIcon: mockedIcon(handles.arrowUp),
}));
vi.mock('@/registry/bases/base-ui/icons/chevron-right-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/chevron-right-icon')>()),
  ChevronRightIcon: mockedIcon(handles.chevronRight),
}));
vi.mock('@/registry/bases/base-ui/icons/copy-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/copy-icon')>()),
  CopyIcon: mockedIcon(handles.copy),
}));
vi.mock('@/registry/bases/base-ui/icons/download-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/download-icon')>()),
  DownloadIcon: mockedIcon(handles.download),
}));
vi.mock('@/registry/bases/base-ui/icons/image-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/image-icon')>()),
  ImageIcon: mockedIcon(handles.image),
}));
vi.mock('@/registry/bases/base-ui/icons/maximize-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/maximize-icon')>()),
  MaximizeIcon: mockedIcon(handles.maximize),
}));
vi.mock('@/registry/bases/base-ui/icons/minus-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/minus-icon')>()),
  MinusIcon: mockedIcon(handles.minus),
}));
vi.mock('@/registry/bases/base-ui/icons/plus-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/plus-icon')>()),
  PlusIcon: mockedIcon(handles.plus),
}));
vi.mock('@/registry/bases/base-ui/icons/rotate-ccw-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/rotate-ccw-icon')>()),
  RotateCcwIcon: mockedIcon(handles.rotateCcw),
}));
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
vi.mock('@/registry/bases/base-ui/icons/workflow-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/workflow-icon')>()),
  WorkflowIcon: mockedIcon(handles.workflow),
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
  vi.unstubAllGlobals();
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

describe('the toggle control', () => {
  it('starts the chevron on pointer enter and on focus, and stops it on leave and blur', () => {
    render(<ToggleView {...viewProps({ open: true })}>{null}</ToggleView>);
    expectStartsAndStops(screen.getByRole('button', { name: 'Collapse' }), handles.chevronRight);
  });
});

describe('the zoom buttons of a mermaid canvas', () => {
  it("start each button's icon on pointer enter and on focus, and stop it on leave and blur", () => {
    const state = { svg: '<svg></svg>', status: 'ready', error: null, line: null } as never;
    render(<DiagramCanvas state={state} />);
    expectStartsAndStops(screen.getByRole('button', { name: 'Zoom out' }), handles.minus);
    expectStartsAndStops(screen.getByRole('button', { name: 'Zoom in' }), handles.plus);
    expectStartsAndStops(screen.getByRole('button', { name: 'Fit to view' }), handles.maximize);
    expectStartsAndStops(screen.getByRole('button', { name: 'Reset view' }), handles.rotateCcw);
  });
});

describe('the chat input', () => {
  it("starts the Send button's icon on pointer enter and on focus, and stops it on leave and blur", () => {
    render(<ChatInput triggers={[]} onSubmit={() => {}} />);
    expectStartsAndStops(screen.getByRole('button', { name: 'Send' }), handles.arrowUp);
  });
});

/**
 * A menu item takes focus as the pointer enters it and gives it up as the pointer leaves, and the two
 * are one state, so each pair starts once and stops once.
 */
function expectItemStartsAndStops(item: HTMLElement, handle: Handle): void {
  fireEvent.pointerEnter(item);
  fireEvent.focus(item);
  expect(handle.startAnimation).toHaveBeenCalledTimes(1);
  fireEvent.pointerLeave(item);
  fireEvent.blur(item);
  expect(handle.stopAnimation).toHaveBeenCalledTimes(1);
}

describe('the export controls of the math and mermaid toolbars', () => {
  async function openExport(): Promise<void> {
    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    await act(async () => {});
  }

  it('starts the Export icon on pointer enter and on focus, and stops it on leave and blur', () => {
    render(<MathToolbar source="x" onInsert={() => {}} />);
    expectStartsAndStops(screen.getByRole('button', { name: /export/i }), handles.download);
  });

  it("starts the math toolbar's Insert icon on pointer enter and on focus, and stops it on leave and blur", () => {
    render(<MathToolbar source="x" onInsert={() => {}} />);
    expectStartsAndStops(screen.getByRole('button', { name: 'Insert' }), handles.omega);
  });

  it("starts the mermaid toolbar's Diagram type icon on pointer enter and on focus, and stops it on leave and blur", () => {
    render(<MermaidToolbar source="graph TD" svg="" onPickTemplate={() => {}} />);
    expectStartsAndStops(screen.getByRole('combobox', { name: 'Diagram type' }), handles.workflow);
  });

  it("starts the math menu item's Copy icon from the item", async () => {
    render(<MathToolbar source="x" onInsert={() => {}} />);
    await openExport();
    expectItemStartsAndStops(await screen.findByRole('menuitem', { name: 'Copy LaTeX' }), handles.copy);
  });

  it("starts the mermaid menu items' icons from the item", async () => {
    render(<MermaidToolbar source="graph TD" svg="<svg></svg>" onPickTemplate={() => {}} />);
    await openExport();
    expectItemStartsAndStops(await screen.findByRole('menuitem', { name: 'Copy source' }), handles.copy);
    expectItemStartsAndStops(await screen.findByRole('menuitem', { name: 'Download SVG' }), handles.download);
    expectItemStartsAndStops(await screen.findByRole('menuitem', { name: 'Download PNG' }), handles.image);
  });

  it('plays the check once when the export finishes', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn(async () => {}), write: vi.fn(async () => {}) },
    });
    render(<MathToolbar source="x" onInsert={() => {}} />);
    await openExport();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy LaTeX' }));
    await act(async () => {});
    expect(handles.check.startAnimation).toHaveBeenCalledTimes(1);
  });
});
