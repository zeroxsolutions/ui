import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
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
});
