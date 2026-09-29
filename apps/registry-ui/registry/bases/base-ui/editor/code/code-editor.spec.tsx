import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CodeEditor, CodeEditorContent, useCodeEditor } from './code-editor.js';
import type { RoutedFile } from './file-content-router.js';

// CodeEditorContent's Markdown view renders upstream ScrollArea, which
// measures its viewport in a `queueMicrotask` its layout effect schedules
// on mount, outside of `render`'s own act() batch — awaiting a no-op act()
// settles it before the test's assertions run.
async function settle(): Promise<void> {
  await act(async () => {});
}

afterEach(() => {
  cleanup();
});

const FILES: RoutedFile[] = [
  { path: 'README.md', view: 'markdown', text: '# Readme' },
  { path: 'GUIDE.md', view: 'markdown', text: '# Guide' },
];

describe('useCodeEditor', () => {
  it('throws outside a <CodeEditor>', () => {
    function Orphan() {
      useCodeEditor();
      return null;
    }
    // React logs the thrown error; the assertion is what matters.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/within <CodeEditor>/);
    vi.restoreAllMocks();
  });
});

describe('CodeEditor', () => {
  it('renders the active file through the content pane', async () => {
    render(
      <CodeEditor files={FILES} value="README.md">
        <CodeEditorContent>
          <span>nothing open</span>
        </CodeEditorContent>
      </CodeEditor>,
    );
    await settle();
    expect(screen.getByRole('heading', { level: 1, name: 'Readme' })).toBeTruthy();
  });

  it('shows the empty state when no file is active', () => {
    render(
      <CodeEditor files={FILES} defaultValue={undefined}>
        <CodeEditorContent>
          <span>nothing open</span>
        </CodeEditorContent>
      </CodeEditor>,
    );
    expect(screen.getByText('nothing open')).toBeTruthy();
  });

  it('switches the active file via context (uncontrolled)', async () => {
    function Switcher() {
      const { setActivePath } = useCodeEditor();
      return (
        <button type="button" onClick={() => setActivePath('GUIDE.md')}>
          open guide
        </button>
      );
    }
    render(
      <CodeEditor files={FILES} defaultValue="README.md">
        <Switcher />
        <CodeEditorContent />
      </CodeEditor>,
    );
    await settle();
    expect(screen.getByRole('heading', { name: 'Readme' })).toBeTruthy();
    fireEvent.click(screen.getByText('open guide'));
    expect(screen.getByRole('heading', { name: 'Guide' })).toBeTruthy();
  });

  it('reports the active path through onValueChange (controlled)', () => {
    const onValueChange = vi.fn();
    function Switcher() {
      const { setActivePath } = useCodeEditor();
      return (
        <button type="button" onClick={() => setActivePath('GUIDE.md')}>
          open guide
        </button>
      );
    }
    render(
      <CodeEditor files={FILES} value="README.md" onValueChange={onValueChange}>
        <Switcher />
      </CodeEditor>,
    );
    fireEvent.click(screen.getByText('open guide'));
    expect(onValueChange).toHaveBeenCalledWith('GUIDE.md');
  });
});
