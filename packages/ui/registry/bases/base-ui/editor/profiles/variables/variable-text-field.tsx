'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { EditorContent } from '@tiptap/react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  Extension,
  Fragment,
  Plugin,
  PluginKey,
  Slice,
  type EditorView,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import { createDocumentEditor, defineFeature, type IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { fromSmsText, toSmsText, type VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { COMPOSER_TOP_CONTENT, composerKit } from '../../composer/composer-kit';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { createNodeViewRenderer } from '../../document/node-view-adapter';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { variableFeature, type VariableFeature } from './variable';

export interface VariableTextFieldProps {
  /** The text, each `{{name}}` in it drawn as a chip. One that differs from what the field reported loads. */
  value: string;
  /** The text after each edit, its chips as `{{name}}` tokens. */
  onValueChange(value: string): void;
  /** Enter, while the `{{` menu is closed: the text is done, as a popover's Apply. */
  onCommit?(value: string): void;
  /** The declarations the chips and the `{{` menu read; a chip naming none is marked. */
  declarations: () => readonly VariableDeclaration[];
  /**
   * The variable feature whose chips the field draws, when a host refreshes one of its own: its chips then
   * follow `refreshVariables` on the host's editor. One is built on `declarations` when absent.
   */
  variables?: VariableFeature;
  /** The field's accessible name. */
  label: string;
  /** The hint the field shows while it is empty; none when absent. */
  placeholder?: string;
  /** Shows the text dimmed, with no way to change it and no `{{` menu, as a field that does not apply now. */
  disabled?: boolean;
  /** Shows the text with no way to change it and no `{{` menu, drawn as it is, as a read-only document shows it. */
  readOnly?: boolean;
  /** Marks the field as holding a value that cannot be used. */
  invalid?: boolean;
  /** The id of the element that says why it is invalid. */
  describedBy?: string;
  /** Takes the focus, with the caret at the end, once the field is built. */
  autoFocus?: boolean;
  /** The words of the `{{` menu; the English when absent. */
  messages?: ProfileEditorMessages;
  className?: string;
}

const fieldKey = new PluginKey('variableTextField');

/** Each field's root, with the editor a variable inserted there goes into while the field takes typing. */
const fields = new WeakMap<Element, () => IEditor | null>();

/**
 * The editor of the variable text field `element` is in, while that field takes typing, or null. A variable
 * menu outside the field reads it off the element that held the focus before the menu took it, so the
 * variable lands in the field rather than in the document around it.
 */
export function variableTextFieldOf(element: Element | null): IEditor | null {
  const root = element?.closest('[data-slot=variable-text-field]');
  return (root && fields.get(root)?.()) ?? null;
}

/** `text` on one line: each line break in it a space. */
const lineOf = (text: string) => text.replace(/\r\n?|\n/g, ' ');

/** The one paragraph `value` reads as. */
const fieldContent = (value: string) => fromSmsText(lineOf(value));

/** The inline nodes of `slice`, its blocks and its line breaks joined by spaces, its marks dropped. */
function oneLine(slice: Slice, view: EditorView): Slice {
  const { schema } = view.state;
  const inline: ProseMirrorNode[] = [];
  const space = () => {
    if (inline.length > 0) inline.push(schema.text(' '));
  };
  const collect = (node: ProseMirrorNode) => {
    if (node.type.name === 'hardBreak') space();
    else if (node.isText) inline.push(schema.text(lineOf(node.text ?? '')));
    else if (node.isInline) inline.push(node.mark([]));
    else {
      if (node.isTextblock) space();
      node.forEach(collect);
    }
  };
  slice.content.forEach(collect);
  return new Slice(Fragment.from(schema.nodes.paragraph.create(null, inline)), 1, 1);
}

/** What the field reads each time it draws: its name and its state, read off the field's latest props. */
interface FieldState {
  labelId: string;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  describedBy?: string;
}

function fieldLine(read: () => FieldState): Extension {
  return Extension.create({
    name: 'variableTextFieldLine',
    onBeforeCreate() {
      // The composer's rules would turn `**x**` into nothing the field holds; the engine reads these as it builds.
      this.editor.options.enableInputRules = ['variableEngine'];
      this.editor.options.enablePasteRules = false;
    },
    addProseMirrorPlugins: () => [
      new Plugin({
        key: fieldKey,
        props: {
          attributes: () => {
            const { labelId, disabled, readOnly, invalid, describedBy } = read();
            return {
              role: 'textbox',
              'aria-multiline': 'false',
              'aria-labelledby': labelId,
              ...(disabled ? { 'aria-disabled': 'true' } : {}),
              ...(readOnly ? { 'aria-readonly': 'true' } : {}),
              ...(invalid ? { 'aria-invalid': 'true' } : {}),
              ...(describedBy ? { 'aria-describedby': describedBy } : {}),
            };
          },
          clipboardTextParser: (text, _context, _plain, view) =>
            oneLine(new Slice(Fragment.from(view.state.schema.text(lineOf(text) || ' ')), 0, 0), view),
          transformPasted: (slice, view) => oneLine(slice, view),
        },
      }),
    ],
  });
}

/**
 * One line of text that holds `{{name}}` tokens, as a button's label or a link's href: each token a variable
 * chip, `{{` opening the variable menu, a chip naming no declaration marked. It is the editor core on one
 * paragraph with the variable feature, no blocks and no marks; Enter and Shift+Enter break no line, a paste
 * lands as one line, and the value is the text with its chips as tokens.
 */
export function VariableTextField({
  value,
  onValueChange,
  onCommit,
  declarations,
  variables: shared,
  label,
  placeholder,
  disabled = false,
  readOnly = false,
  invalid = false,
  describedBy,
  autoFocus = false,
  messages = DEFAULT_PROFILE_MESSAGES,
  className,
}: VariableTextFieldProps) {
  const labelId = useId();
  const live = useRef({ onValueChange, onCommit, declarations, labelId, disabled, readOnly, invalid, describedBy });
  live.current = { onValueChange, onCommit, declarations, labelId, disabled, readOnly, invalid, describedBy };
  const editable = !disabled && !readOnly;
  // Read once, when the field is built.
  const build = useRef({ value, shared, placeholder, editable, autoFocus });

  const [engine, setEngine] = useState<{ view?: EditorView } | null>(null);
  const [field, setField] = useState<{ editor: IEditor; variables: VariableFeature } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const reported = useRef(value);
  const loading = useRef(false);

  useEffect(() => {
    const { shared, placeholder, editable, autoFocus } = build.current;
    const variables = shared ?? variableFeature(() => live.current.declarations());
    const editor = createDocumentEditor({
      features: [
        composerKit({ placeholder: placeholder ?? '' }),
        variables.feature,
        defineFeature({ id: 'variableTextField', advanced: { engineExtensions: [fieldLine(() => live.current)] } }),
      ],
      topContent: COMPOSER_TOP_CONTENT,
      content: fieldContent(build.current.value),
      editable,
      nodeViewRenderer: createNodeViewRenderer(),
      element: document.createElement('div'),
      onEngine: (raw) => setEngine(raw as { view?: EditorView }),
    });
    setField({ editor, variables });
    const offChange = editor.onChange(() => {
      if (loading.current) return;
      const next = toSmsText(editor.getJSON());
      if (next === reported.current) return;
      reported.current = next;
      live.current.onValueChange(next);
    });
    if (autoFocus) editor.focus('end');
    return () => {
      offChange();
      editor.destroy();
      setField(null);
      setEngine(null);
    };
  }, []);

  // A value from outside loads; the one the field reported, handed back, does not.
  useEffect(() => {
    if (!field || value === reported.current) return;
    reported.current = value;
    loading.current = true;
    try {
      field.editor.setContent(fieldContent(value));
    } finally {
      loading.current = false;
    }
  }, [field, value]);

  useEffect(() => {
    field?.editor.setEditable(editable);
  }, [field, editable]);

  useEffect(() => {
    const element = root.current;
    if (!element || !field) return;
    fields.set(element, () => (field.editor.isEditable() ? field.editor : null));
    return () => {
      fields.delete(element);
    };
  }, [field]);

  // The engine reads the attributes when it draws, which a new state alone does not cause.
  useEffect(() => {
    const view = engine?.view;
    view?.dispatch(view.state.tr.setMeta(fieldKey, true));
  }, [engine, disabled, readOnly, invalid, describedBy]);

  // Enter is the field's in the capture phase, before the engine's own keys; an open `{{` menu stops it first.
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.shiftKey && field) live.current.onCommit?.(toSmsText(field.editor.getJSON()));
  };

  const trigger = useMemo(
    () => field && { ...field.variables.token, emptyText: messages.noVariables },
    [field, messages.noVariables],
  );

  return (
    <div
      ref={root}
      data-slot="variable-text-field"
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={invalid || undefined}
      // The ring an input draws on its own focus and invalid state, drawn here because the focus and
      // `aria-invalid` sit on the text inside.
      className={cn(
        'variable-text-field cn-editor-content cn-editor-field min-w-0 transition-[color,box-shadow] data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      onKeyDownCapture={keyDown}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <EditorContent editor={engine as never} />
      {field && trigger && editable && <TriggerLayer editor={field.editor} triggers={[trigger]} />}
    </div>
  );
}
