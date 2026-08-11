import * as React from 'react';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  bracketMatching,
  indentOnInput,
  indentUnit,
} from '@codemirror/language';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  editorTheme,
  shikiHighlighting,
  syntaxLanguage,
} from './code-syntax.js';

const codeMirrorPaneVariants = cva(
  'h-full overflow-hidden [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto',
  {
    variants: {
      size: {
        sm: 'text-xs [&_.cm-content]:py-2',
        default: 'text-sm',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export interface CodeMirrorPaneProps
  extends Omit<
      React.ComponentProps<'div'>,
      'defaultValue' | 'onChange' | 'children'
    >,
    VariantProps<typeof codeMirrorPaneVariants> {
  /** Document text (controlled). Pair with `onValueChange`. */
  value?: string;
  /** Initial document text (uncontrolled). */
  defaultValue?: string;
  /** Fired with the full document text on every edit. */
  onValueChange?: (value: string) => void;
  /** Shiki language id (`typescript`, `python`, `json`, …); omit for plain text. */
  language?: string;
  /** Render read-only — no editing, no cursor. */
  readOnly?: boolean;
  /** Soft-wrap long lines instead of scrolling horizontally. */
  wrap?: boolean;
  /** Placeholder shown while the document is empty. */
  placeholder?: string;
  /** Columns a tab occupies and the width of one indent step. Defaults to 2. */
  tabSize?: number;
  /** Indent with a real tab character instead of spaces. Defaults to false. */
  useTabs?: boolean;
  /** Show the line-number gutter. Defaults to true. */
  showLineNumbers?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

/** The tab-width + indent-unit extension the settings menu reconfigures live. */
function indentExtension(tabSize: number, useTabs: boolean): Extension {
  return [
    EditorState.tabSize.of(tabSize),
    indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize)),
  ];
}

/**
 * A single text-editing surface built on CodeMirror 6 with Shiki syntax
 * highlighting, themed to the design tokens. A controlled textbox
 * (`value`/`defaultValue`/`onValueChange`); `language`, `readOnly`, `wrap`,
 * `placeholder`, `tabSize`, `useTabs`, and `showLineNumbers` reconfigure the live
 * editor without remounting (each backed by a CodeMirror `Compartment`). The
 * editor fills the height it is given — size the wrapper.
 */
export function CodeMirrorPane({
  value,
  defaultValue,
  onValueChange,
  language,
  readOnly = false,
  wrap = false,
  placeholder,
  tabSize = 2,
  useTabs = false,
  showLineNumbers = true,
  size,
  className,
  ref,
  ...props
}: CodeMirrorPaneProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const onValueChangeRef = React.useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  const languageCompartment = React.useRef(new Compartment());
  const editableCompartment = React.useRef(new Compartment());
  const wrapCompartment = React.useRef(new Compartment());
  const placeholderCompartment = React.useRef(new Compartment());
  const indentCompartment = React.useRef(new Compartment());
  const lineNumbersCompartment = React.useRef(new Compartment());

  const setHost = React.useCallback(
    (node: HTMLDivElement | null) => {
      hostRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as React.RefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // Mount the editor once; prop changes flow through the effects below.
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const state = EditorState.create({
      doc: value ?? defaultValue ?? '',
      extensions: [
        lineNumbersCompartment.current.of(showLineNumbers ? lineNumbers() : []),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        indentCompartment.current.of(indentExtension(tabSize, useTabs)),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        editorTheme,
        // Keep browser extensions + native spellcheck out of the code surface: the
        // `.cm-content` is contenteditable, so Grammarly / LanguageTool / password
        // managers inject nodes and the browser paints spellcheck underlines into
        // it — none of which belong in code and which corrupt CodeMirror's DOM.
        EditorView.contentAttributes.of({
          spellcheck: 'false',
          autocorrect: 'off',
          autocapitalize: 'off',
          translate: 'no',
          'data-gramm': 'false',
          'data-gramm_editor': 'false',
          'data-enable-grammarly': 'false',
          'data-1p-ignore': 'true',
          'data-lpignore': 'true',
        }),
        shikiHighlighting(),
        languageCompartment.current.of(syntaxLanguage.of(language)),
        editableCompartment.current.of([
          EditorView.editable.of(!readOnly),
          EditorState.readOnly.of(readOnly),
        ]),
        wrapCompartment.current.of(wrap ? EditorView.lineWrapping : []),
        placeholderCompartment.current.of(
          placeholder ? placeholderExtension(placeholder) : [],
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onValueChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount-once: initial doc/config are seeded here, kept in sync below.
  }, []);

  // Controlled value → editor (guarded against the edit→onValueChange feedback loop).
  React.useEffect(() => {
    const view = viewRef.current;
    if (!view || value === undefined) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartment.current.reconfigure(
        syntaxLanguage.of(language),
      ),
    });
  }, [language]);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: editableCompartment.current.reconfigure([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
      ]),
    });
  }, [readOnly]);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: wrapCompartment.current.reconfigure(
        wrap ? EditorView.lineWrapping : [],
      ),
    });
  }, [wrap]);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: placeholderCompartment.current.reconfigure(
        placeholder ? placeholderExtension(placeholder) : [],
      ),
    });
  }, [placeholder]);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: indentCompartment.current.reconfigure(
        indentExtension(tabSize, useTabs),
      ),
    });
  }, [tabSize, useTabs]);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: lineNumbersCompartment.current.reconfigure(
        showLineNumbers ? lineNumbers() : [],
      ),
    });
  }, [showLineNumbers]);

  return (
    <div
      ref={setHost}
      data-slot="code-mirror-pane"
      data-language={language}
      data-readonly={readOnly || undefined}
      className={cn(codeMirrorPaneVariants({ size }), className)}
      {...props}
    />
  );
}
