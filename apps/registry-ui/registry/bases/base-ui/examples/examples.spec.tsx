/// <reference types="vite/client" />
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ButtonGroupMenu } from './button-group-menu';
import { ButtonGroupSplit } from './button-group-split';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

const MODULES = import.meta.glob<Record<string, ComponentType>>(['./*.tsx', '!./*.spec.tsx'], { eager: true });

/** Each example file, by basename, and the `data-slot` of the component it demonstrates. */
const EXPECTED_SLOT: Record<string, string> = {
  'ai-provider-picker-demo': 'ai-provider-picker',
  'button-default': 'button',
  'button-demo': 'button',
  'button-destructive': 'button',
  'button-ghost': 'button',
  'button-group-menu': 'button-group',
  'button-group-split': 'button-group',
  'button-outline': 'button',
  'button-secondary': 'button',
  'chat-message-demo': 'chat-message',
  'chat-suggestion-item-demo': 'chat-suggestion-item',
  'command-menu-demo': 'command-menu',
  'copy-button-demo': 'copy-button',
  'emoji-appearance-toggle-group-demo': 'emoji-appearance-toggle-group',
  'emoji-picker-demo': 'emoji-picker-content',
  'icon-chip-demo': 'icon-chip',
  'icon-label-demo': 'icon-label',
  'language-combobox-demo': 'combobox-trigger',
  'language-toggle-group-demo': 'language-toggle-group',
  'number-field-demo': 'input-group',
  'panel-field-label-demo': 'field-label',
  'panel-row-demo': 'panel-row',
  'password-input-demo': 'input-group',
  'permission-card-demo': 'permission-card',
  'resize-handle-demo': 'resize-handle',
  'status-indicator-demo': 'status-indicator',
  'tab-close-button-demo': 'tab-close-button',
  'tag-input-demo': 'tag-input',
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
    expect(document.querySelector(`[data-slot="${EXPECTED_SLOT[file]}"]`)).not.toBeNull();
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
});
