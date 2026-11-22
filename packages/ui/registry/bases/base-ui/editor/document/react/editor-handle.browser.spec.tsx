import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../test/nova-style.css';
// The editor's own sheet, which places the handle in the gutter and takes the pointer from it while it is
// hidden. Without it the hidden handle sits in the flow under the block, and a pointer an earlier spec
// file left resting there enters it before the spec hovers it.
import '../../styles.css';
import { standardKit } from '../features/standard/index';
import { Editor } from './editor';

const handles = vi.hoisted(() => {
  const make = () => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() });
  return { grip: make(), plus: make() };
});

function mockedIcon(handle: { startAnimation: () => void; stopAnimation: () => void }) {
  return React.forwardRef<unknown, { size?: number }>((_props, ref) => {
    React.useImperativeHandle(ref, () => handle);
    return <span style={{ display: 'inline-block', width: 16, height: 16 }} />;
  });
}

vi.mock('@/registry/bases/base-ui/icons/lucide/grip-vertical-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/grip-vertical-icon')>()),
  GripVerticalIcon: mockedIcon(handles.grip),
}));
vi.mock('@/registry/bases/base-ui/icons/lucide/plus-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/plus-icon')>()),
  PlusIcon: mockedIcon(handles.plus),
}));

const content: DocJSON = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a block' }] }],
};

/** Mount the real editor and move the pointer over its block, which makes the extension show its handle. */
async function mountWithHandle() {
  await render(
    <div className="style-nova" style={{ padding: '0 80px' }}>
      <Editor features={[standardKit()]} content={content} />
    </div>,
  );
  const block = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('.ProseMirror p');
    if (!found) throw new Error('the editor is not mounted');
    return found;
  });
  await userEvent.hover(block);
  const handle = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('.drag-handle');
    if (!found || found.classList.contains('hide')) throw new Error('the handle is hidden');
    return found;
  });
  return { block, handle };
}

describe('the block handle of the document editor', () => {
  it('starts the grip while the pointer is on the handle and stops it on leave', async () => {
    const { block, handle } = await mountWithHandle();
    await userEvent.hover(handle);
    expect(handles.grip.startAnimation).toHaveBeenCalledTimes(1);
    await userEvent.hover(block);
    expect(handles.grip.stopAnimation).toHaveBeenCalledTimes(1);
  });

  it('starts the plus while the pointer is on it and stops it on leave', async () => {
    const { block } = await mountWithHandle();
    const plus = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('[data-editor-add]');
      if (!found) throw new Error('no plus');
      return found;
    });
    await userEvent.hover(plus);
    expect(handles.plus.startAnimation).toHaveBeenCalledTimes(1);
    await userEvent.hover(block);
    expect(handles.plus.stopAnimation).toHaveBeenCalledTimes(1);
  });

  it('keeps the handle and the plus shown while the pointer crosses onto them, with their cursors', async () => {
    const { handle } = await mountWithHandle();
    const plus = () => document.querySelector<HTMLElement>('[data-editor-add]');
    // The element under the pointer at a control's centre, which is the icon inside it, not the control.
    const cursorAt = (control: HTMLElement) => {
      const rect = control.getBoundingClientRect();
      const under = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return under ? getComputedStyle(under).cursor : null;
    };

    await userEvent.hover(handle);
    expect(handle.classList.contains('hide')).toBe(false);
    expect(plus()).not.toBeNull();
    expect(cursorAt(handle)).toBe('grab');

    await userEvent.hover(plus()!);
    expect(handle.classList.contains('hide')).toBe(false);
    expect(plus()).not.toBeNull();
    expect(cursorAt(plus()!)).toBe('pointer');

    await userEvent.hover(handle);
    expect(handle.classList.contains('hide')).toBe(false);
    expect(plus()).not.toBeNull();
  });
});
