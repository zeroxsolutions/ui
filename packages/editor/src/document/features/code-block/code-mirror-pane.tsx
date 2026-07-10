import type { ComponentType } from 'react';

/**
 * The **CodeMirror pane seam**. The code-block node view renders whatever pane is
 * registered here; by default a plain `<textarea>` (zero heavy deps). An app
 * lazily registers a real CodeMirror pane — e.g. a thin adapter over
 * `@zeroxsolutions/ui`'s code editor — via `setCodeMirrorPane`, keeping the heavy
 * editor out of the core bundle and out of the engine.
 *
 * A module-level registry (not React context) is deliberate: node views render in
 * the engine's own React root, which does not inherit the app's context — a
 * module singleton reaches them, a provider would not.
 */
export interface CodeMirrorPaneProps {
  value: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export type CodeMirrorPaneComponent = ComponentType<CodeMirrorPaneProps>;

/** The zero-dependency fallback pane: a textarea when editable, a `<pre>` when not. */
function DefaultCodePane({ value, readOnly, onChange }: CodeMirrorPaneProps) {
  if (readOnly) {
    return (
      <pre className="overflow-x-auto p-4 font-mono text-sm">
        <code>{value}</code>
      </pre>
    );
  }
  return (
    <textarea
      className="block w-full resize-y bg-transparent p-4 font-mono text-sm text-foreground outline-none"
      value={value}
      spellCheck={false}
      rows={4}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}

let registeredPane: CodeMirrorPaneComponent | null = null;

/** Register (or clear with `null`) the pane every code block renders through. */
export function setCodeMirrorPane(pane: CodeMirrorPaneComponent | null): void {
  registeredPane = pane;
}

/** The pane in effect — the registered one, or the textarea fallback. */
export function resolveCodeMirrorPane(): CodeMirrorPaneComponent {
  return registeredPane ?? DefaultCodePane;
}
