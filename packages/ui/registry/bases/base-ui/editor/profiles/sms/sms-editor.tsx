'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { TooltipProvider } from '@/registry/bases/base-ui/ui/tooltip';
import {
  DecorationSet,
  Extension,
  Plugin,
  PluginKey,
  Selection,
  type EditorView,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import type { EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  fromSmsText,
  toSmsText,
  validate,
  type EditorProfile,
  type ProfileProblem,
} from '@zeroxsolutions/editor-core/profiles/index';
import { sameBlockContent } from '@zeroxsolutions/editor-core/template/email/index';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { Editor } from '../../document/react/editor';
import { EditorToolbar } from '../../document/ui/editor-toolbar';
import { SlashMenu } from '../../document/ui/slash-menu';
import { profileMessages, type ProfileEditorMessages } from '../messages';
import { ProblemMarker } from '../problem-marker';
import { caretNode, nextMarker, useFocusLeave } from '../problem-navigation';
import { refreshVariables, variableFeature } from '../variables/variable';
import { VariableMenu } from '../variables/variable-menu';
import { smsDecorations, smsMarks, type SmsMark } from './sms-problems';
import { smsKit, smsSlashItems } from './sms-kit';
import { SmsMeter } from './sms-meter';

/** How long after an edit the problems are read again, at most. */
const SETTLE_MS = 300;

export interface SmsEditorProps {
  profile: EditorProfile;
  /**
   * The body the editor shows. A host hands back what `onChange` gave it, and passes a different `value` only to
   * open another body; one that differs from the editor's replaces it, dropping the edits made since.
   */
  value: string;
  /** The editable surface's accessible name. */
  label: string;
  /**
   * The host's words for any string the editor draws; the rest stay English. Build it once per locale: a new
   * object rebuilds the variable menus' words. A problem keeps the words it was marked with until the
   * problems are read again, after the next edit.
   */
  messages?: Partial<ProfileEditorMessages>;
  /** Shows the body, its problems and its cost with no way to change it: no typing and no variable menu. */
  readOnly?: boolean;
  className?: string;
  onChange?(body: string): void;
  /** The focus left the editor and the popups it opened; when to save is the host's. */
  onBlur?(): void;
  /** The problems, on mount and whenever the list changes. */
  onValidate?(problems: ProfileProblem[]): void;
  onReady?(editor: IEditor): void;
}

const overlayKey = new PluginKey('smsEditorOverlay');

/**
 * The problem decorations and the surface's accessible name. `read` and `label` are getters so a new set of marks
 * or a new name needs no new plugin; a transaction with this plugin's meta redraws. `view` is the engine's, which
 * the editor reaches the caret through.
 */
function overlayFeature(read: () => readonly SmsMark[], label: () => string) {
  let view: EditorView | null = null;
  let drawn: { doc: ProseMirrorNode; marks: readonly SmsMark[]; set: DecorationSet } | null = null;
  const plugin = new Plugin({
    key: overlayKey,
    view(editorView) {
      view = editorView;
      return {
        destroy() {
          view = null;
        },
      };
    },
    props: {
      attributes: () => ({ 'aria-label': label() }),
      decorations(state) {
        const marks = read();
        if (drawn?.doc === state.doc && drawn.marks === marks) return drawn.set;
        const set = DecorationSet.create(state.doc, smsDecorations(state.doc, marks));
        drawn = { doc: state.doc, marks, set };
        return set;
      },
    },
  });
  const feature: EditorFeature = {
    id: 'smsEditorOverlay',
    advanced: {
      engineExtensions: [Extension.create({ name: 'smsEditorOverlay', addProseMirrorPlugins: () => [plugin] })],
    },
  };
  return {
    feature,
    redraw() {
      view?.dispatch(view.state.tr.setMeta(overlayKey, true));
    },
    /** Puts the caret at the start of what `mark` marks, and reports whether it did. */
    returnTo(mark: SmsMark): boolean {
      if (!view) return false;
      const first = smsDecorations(view.state.doc, [mark])[0];
      if (!first) return false;
      view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(first.from))));
      view.focus();
      return true;
    },
  };
}

/**
 * The SMS profile's editor: the document editor with `smsKit`'s paragraphs and variables, each problem marked in
 * the text, a "/" menu of the declared variables, and the segment meter under it. The frame is the Document Editor's: the toolbar above the text and
 * nothing around it. `value` loads whenever it differs from what the editor last reported, so a
 * host hands back what `onChange` gave it without moving the caret.
 */
export function SmsEditor({
  profile,
  value,
  label,
  messages,
  readOnly = false,
  className,
  onChange,
  onBlur,
  onValidate,
  onReady,
}: SmsEditorProps) {
  const idBase = useId();
  const text = useMemo(() => profileMessages(messages), [messages]);
  const live = useRef({ profile, label, text, onChange, onValidate, onBlur });
  live.current = { profile, label, text, onChange, onValidate, onBlur };

  const marksRef = useRef<readonly SmsMark[]>([]);
  const unplacedRef = useRef<readonly string[]>([]);
  const [setup] = useState(() => {
    const variables = variableFeature(() => live.current.profile.variables);
    const overlay = overlayFeature(
      () => marksRef.current,
      () => live.current.label,
    );
    return { variables, overlay, features: [...smsKit(profile, { variables }), overlay.feature] };
  });

  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [body, setBody] = useState(value);
  const [marks, setMarks] = useState<SmsMark[]>([]);
  const [unplaced, setUnplaced] = useState<string[]>([]);

  // What the editor last reported, and the value it last loaded: a value equal to either is no news.
  const reported = useRef<string | null>(null);
  const loaded = useRef(value);
  const loading = useRef(false);
  const validated = useRef<ProfileProblem[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(
    (from: IEditor) => {
      if (from.status === 'destroyed') return;
      const text = toSmsText(from.getJSON());
      const problems = validate(text, live.current.profile);
      // The marks follow the body too, as a tail does when the problem stays the same.
      const placed = smsMarks(problems, text, live.current.profile, idBase, live.current.text.problem);
      if (
        !sameBlockContent(marksRef.current, placed.marks) ||
        !sameBlockContent(unplacedRef.current, placed.unplaced)
      ) {
        marksRef.current = placed.marks;
        unplacedRef.current = placed.unplaced;
        setMarks(placed.marks);
        setUnplaced(placed.unplaced);
        setup.overlay.redraw();
      }
      if (validated.current !== null && sameBlockContent(validated.current, problems)) return;
      validated.current = problems;
      live.current.onValidate?.(problems);
    },
    [idBase, setup],
  );

  // Each edit's problems show within SETTLE_MS, however fast the author types.
  const schedule = useCallback(
    (from: IEditor) => {
      if (timer.current !== null) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        check(from);
      }, SETTLE_MS);
    },
    [check],
  );
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (!editor) return;
    const text = toSmsText(editor.getJSON());
    reported.current = text;
    setBody(text);
    check(editor);
    return editor.onChange(() => {
      if (loading.current) return;
      const next = toSmsText(editor.getJSON());
      setBody(next);
      if (reported.current === next) return;
      reported.current = next;
      live.current.onChange?.(next);
      schedule(editor);
    });
  }, [editor, schedule, check]);

  // A value from outside loads; the one the editor reported, handed back, does not.
  useEffect(() => {
    if (!editor) return;
    if (value === loaded.current || value === reported.current) return;
    loaded.current = value;
    loading.current = true;
    try {
      editor.setContent(fromSmsText(value));
    } finally {
      loading.current = false;
    }
    const text = toSmsText(editor.getJSON());
    reported.current = text;
    setBody(text);
    schedule(editor);
  }, [editor, value, schedule]);

  // Chips read the declarations again; the problems follow the profile. The mount already read them, so only a
  // change by value runs again: a host may build the profile anew on every render.
  const read = useRef(profile);
  useEffect(() => {
    const before = read.current;
    if (sameBlockContent(before, profile)) return;
    read.current = profile;
    if (!editor) return;
    if (!sameBlockContent(before.variables, profile.variables)) refreshVariables(editor);
    schedule(editor);
  }, [editor, profile, schedule]);

  // The engine reads the name when it draws, which a new label alone does not cause.
  const named = useRef(label);
  useEffect(() => {
    if (named.current === label) return;
    named.current = label;
    setup.overlay.redraw();
  }, [label, setup]);

  const variables = useMemo(
    () => ({ ...setup.variables.token, emptyText: text.noVariables }),
    [setup, text.noVariables],
  );

  const slash = useMemo(() => smsSlashItems(profile.variables, text), [profile.variables, text]);

  const focus = useFocusLeave(() => live.current.onBlur?.());

  // F8 and Shift+F8 reach the next and the previous problem, as in VS Code; Escape on one goes back to its text.
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editor || !root) return;
    const target = event.target as Element;
    const marker = target.closest<HTMLElement>('[data-slot=sms-problem-marker]');
    if (event.key === 'Escape' && marker) {
      const mark = marks.find((candidate) => candidate.id === marker.dataset.markId);
      if (mark && setup.overlay.returnTo(mark)) event.preventDefault();
      return;
    }
    if (event.key !== 'F8' || !(marker || target.closest('[contenteditable=true]'))) return;
    const markers = [...root.querySelectorAll<HTMLElement>('[data-slot=sms-problem-marker]')];
    if (markers.length === 0) return;
    event.preventDefault();
    nextMarker(markers, marker ?? caretNode() ?? target, event.shiftKey).focus();
  };

  const menus = editor !== null && !readOnly;
  return (
    <div
      ref={setRoot}
      data-slot="sms-editor"
      className={cn('relative flex w-full flex-col gap-3', className)}
      {...focus}
      onKeyDownCapture={keyDown}
    >
      {menus && (
        <EditorToolbar
          editor={editor}
          items={[]}
          className="min-w-0 self-start"
          end={<VariableMenu editor={editor} declarations={profile.variables} messages={text} />}
        />
      )}
      <Editor
        features={setup.features}
        content={fromSmsText(value)}
        editable={!readOnly}
        onReady={(ready) => {
          setEditor(ready);
          onReady?.(ready);
        }}
      />
      {menus && <TriggerLayer editor={editor} triggers={[variables]} />}
      {menus && <SlashMenu editor={editor} items={slash} placeholder={text.slashSearch} emptyText={text.noVariables} />}
      {/* From the text's left edge: the editable text sits past the grip's gutter, the read-only text flush. */}
      <div data-slot="sms-editor-footer" className={cn('flex flex-col gap-1 text-sm', !readOnly && 'px-12')}>
        <TooltipProvider>
          {marks.length > 0 && (
            <div data-slot="sms-problem-markers" className="flex flex-wrap items-center gap-1">
              {marks.map((mark) => (
                <ProblemMarker
                  key={mark.id}
                  id={mark.id}
                  messages={mark.messages}
                  slot="sms-problem-marker"
                  label={text.problemMarker}
                />
              ))}
            </div>
          )}
        </TooltipProvider>
        <SmsMeter body={body} profile={profile} messages={text} />
        {unplaced.length > 0 && (
          <ul data-slot="sms-problems" className="text-destructive flex flex-col gap-1">
            {unplaced.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
