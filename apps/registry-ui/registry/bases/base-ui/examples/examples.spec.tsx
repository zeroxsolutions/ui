/// <reference types="vite/client" />
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// code-block-demo renders CodeBlock, which highlights asynchronously through the
// shared Shiki highlighter; mocking it keeps this spec deterministic, the same
// way code-block.spec.tsx does for the component's own tests.
vi.mock('../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import { AlertDialogConfirm } from './alert-dialog-confirm';
import { ButtonGroupMenu } from './button-group-menu';
import { ButtonGroupSplit } from './button-group-split';
import { PermissionCardDemo } from './permission-card-demo';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= () =>
    ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
});

afterEach(cleanup);

/** What one example file exports, by export name. */
type ExampleModule = Record<string, ComponentType>;

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is
// the declaration that wins, so the module shape is asserted here instead.
const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__index__.tsx', '!./__components__.tsx'], {
  eager: true,
}) as Record<string, ExampleModule>;

/** Each example file, by basename, and the `data-slot` of the component it demonstrates. */
const EXPECTED_SLOT: Record<string, string> = {
  'ai-provider-card-demo': 'ai-provider-card',
  'ai-provider-picker-demo': 'ai-provider-picker',
  'alert-dialog-confirm': 'alert-dialog-trigger',
  'avatar-picker-demo': 'avatar-picker-trigger',
  'button-group-menu': 'button-group',
  'button-group-split': 'button-group',
  'center-demo': 'center',
  'chat-message-demo': 'chat-message',
  'chat-suggestion-item-demo': 'chat-suggestion-item',
  'code-block-demo': 'code-block',
  'collapsible-card-demo': 'collapsible-card',
  'collapsible-card-section': 'collapsible-card',
  'command-menu-demo': 'command-menu',
  'copy-button-demo': 'copy-button',
  'data-table-demo': 'data-table',
  'emoji-appearance-toggle-group-demo': 'emoji-appearance-toggle-group',
  'emoji-picker-demo': 'emoji-picker-content',
  'empty-file': 'empty',
  'file-tree-demo': 'file-tree',
  'file-type-icon-demo': 'file-type-icon',
  'floating-toolbar-demo': 'floating-toolbar',
  'font-preview-demo': 'font-preview',
  'frontmatter-form-demo': 'frontmatter-form',
  'highlighted-code-demo': 'highlighted-code',
  'icon-chip-demo': 'icon-chip',
  'icon-label-demo': 'icon-label',
  'icons-demo': 'item',
  'image-preview-demo': 'image-preview',
  'input-group-search': 'input-group',
  'language-combobox-demo': 'combobox-trigger',
  'language-toggle-group-demo': 'language-toggle-group',
  'markdown-view-demo': 'markdown-view',
  'model-info-card-demo': 'model-info-card',
  'model-list-demo': 'model-list',
  'number-field-demo': 'input-group',
  'page-container-demo': 'page-container',
  'panel-field-group-demo': 'panel-field-group',
  'panel-field-label-demo': 'field-label',
  'panel-header-demo': 'panel-header',
  'panel-row-demo': 'panel-row',
  'password-input-demo': 'input-group',
  'permission-card-demo': 'permission-card',
  'popover-icon-trigger': 'tooltip-trigger',
  'reasoning-collapsible-demo': 'reasoning-collapsible',
  'resize-handle-demo': 'resize-handle',
  'sidebar-group-collapsible': 'sidebar-group',
  'sidebar-menu-collapsible': 'sidebar-menu-sub',
  'status-indicator-busy': 'status-indicator',
  'status-indicator-demo': 'status-indicator',
  'status-indicator-idle': 'status-indicator',
  'status-indicator-offline': 'status-indicator',
  'status-indicator-online': 'status-indicator',
  'status-indicator-pulse': 'status-indicator',
  'tab-close-button-demo': 'tab-close-button',
  'tag-input-demo': 'tag-input',
  'toggle-toolbar': 'tooltip-trigger',
  'tool-call-card-demo': 'tool-call-card',
  'tree-item-demo': 'tree-item',
  'unsaved-indicator-demo': 'unsaved-indicator',
};

const EXAMPLES = Object.entries(MODULES).flatMap(([path, module]) =>
  Object.entries(module).map(([exportName, Example]) => ({
    file: path.slice('./'.length, -'.tsx'.length),
    exportName,
    Example,
  })),
);

describe('examples', () => {
  it('has a row for every example file and a file for every row', () => {
    const files = Object.keys(MODULES).map((path) => path.slice('./'.length, -'.tsx'.length));
    expect(files.sort()).toEqual(Object.keys(EXPECTED_SLOT).sort());
  });

  it.each(EXAMPLES)('$file renders $exportName with its data-slot', async ({ file, Example }) => {
    render(<Example />);
    // An upstream ScrollArea measures its viewport in a queueMicrotask outside
    // render's own act() batch; settle it so no example leaves a state update
    // to land after the test has moved on.
    await act(async () => {});
    // command-menu-demo portals its dialog out of the render container, so this checks the whole document.
    expect(document.querySelector(`[data-slot="${EXPECTED_SLOT[file]}"]`)).not.toBeNull();
  });

  it('alert-dialog-confirm closes the dialog after confirming', async () => {
    render(<AlertDialogConfirm />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('button-group-split opens its related actions from the caret', async () => {
    render(<ButtonGroupSplit />);
    fireEvent.click(screen.getByRole('button', { name: 'More action options' }));
    expect(await screen.findByRole('menuitem', { name: 'Second' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Third' })).toBeTruthy();
  });

  it('button-group-menu makes the picked option the primary action', async () => {
    render(<ButtonGroupMenu />);
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Change action' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Always allow' }));
    expect(await screen.findByRole('button', { name: 'Always allow' })).toBeTruthy();
  });

  it('permission-card-demo shows the session wording after allowing for the session', async () => {
    render(<PermissionCardDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'More allow options' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Allow this session' }));
    expect(await screen.findByText('Allowed for this session - 2:14pm')).toBeTruthy();
  });
});
