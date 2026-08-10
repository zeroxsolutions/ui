import * as React from 'react';

import {
  FileContentRouter,
  type FileContentRouterProps,
  type RoutedFile,
} from './file-content-router.js';

interface CodeEditorContextValue {
  files: RoutedFile[];
  activePath: string | undefined;
  setActivePath: (path: string) => void;
  activeFile: RoutedFile | undefined;
  readOnly: boolean;
  onFileTextChange?: (path: string, text: string) => void;
}

const CodeEditorContext = React.createContext<CodeEditorContextValue | null>(
  null,
);

/**
 * The editor's shared state — the open files, which one is active, and the edit
 * callback. Throws outside a `<CodeEditor>`. Bind the active path to a
 * `FileTree` (`value`/`onValueChange`), a `CommandSwitcher`, and the content
 * pane so they all track one selection.
 */
export function useCodeEditor(): CodeEditorContextValue {
  const context = React.useContext(CodeEditorContext);
  if (!context) {
    throw new Error('useCodeEditor must be used within <CodeEditor>');
  }
  return context;
}

function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T | undefined,
  onChange?: (value: T) => void,
): [T | undefined, (value: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;
  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, setValue];
}

export interface CodeEditorProps {
  /** The open files, each already classified by `view`. */
  files: RoutedFile[];
  /** Active file path (controlled). */
  value?: string;
  /** Initial active file path (uncontrolled). */
  defaultValue?: string;
  /** Fired when the active file changes. */
  onValueChange?: (path: string) => void;
  /** Fired when an editable file's text changes; carries the file's path. */
  onFileTextChange?: (path: string, text: string) => void;
  /** Render every file read-only. */
  readOnly?: boolean;
  /** The assembled layout — tree, content pane, command switcher. */
  children: React.ReactNode;
}

/**
 * Headless root for a multi-file code editor: holds the open files and the
 * active selection in context, leaving the layout to the consumer (assemble a
 * `FileTree`, a `CodeEditorContent`, and a `CommandSwitcher` against
 * {@link useCodeEditor}). Owns no persistence or dirty state — the consumer owns
 * the files and reacts to `onFileTextChange`.
 */
export function CodeEditor({
  files,
  value,
  defaultValue,
  onValueChange,
  onFileTextChange,
  readOnly = false,
  children,
}: CodeEditorProps) {
  const [activePath, setActivePath] = useControllableState(
    value,
    defaultValue,
    onValueChange,
  );
  const activeFile = React.useMemo(
    () => files.find((file) => file.path === activePath),
    [files, activePath],
  );

  const context = React.useMemo<CodeEditorContextValue>(
    () => ({
      files,
      activePath,
      setActivePath,
      activeFile,
      readOnly,
      onFileTextChange,
    }),
    [files, activePath, setActivePath, activeFile, readOnly, onFileTextChange],
  );

  return (
    <CodeEditorContext.Provider value={context}>
      {children}
    </CodeEditorContext.Provider>
  );
}

export interface CodeEditorContentProps
  extends Omit<FileContentRouterProps, 'file' | 'readOnly' | 'onTextChange'> {
  /** Shown when no file is active (consumer-owned empty state). */
  children?: React.ReactNode;
}

/**
 * Renders the active file through a `FileContentRouter`, wiring edits back to
 * the editor's `onFileTextChange`. When no file is active it renders `children`
 * as the empty state.
 */
export function CodeEditorContent({
  children,
  ...props
}: CodeEditorContentProps) {
  const { activeFile, readOnly, onFileTextChange } = useCodeEditor();
  if (!activeFile) return <>{children}</>;
  return (
    <FileContentRouter
      file={activeFile}
      readOnly={readOnly}
      onTextChange={(text) => onFileTextChange?.(activeFile.path, text)}
      {...props}
    />
  );
}
