'use client';

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Selection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { TooltipProvider } from '@/registry/bases/base-ui/ui/tooltip';
import { Extension, Plugin, PluginKey, type ProseMirrorNode } from '@zeroxsolutions/editor-core/document/advanced';
import type { EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import {
  fromEmailBlocks,
  toEmailBlocks,
  validate,
  type EditorEmailBlock,
  type EditorProfile,
  type ProfileProblem,
} from '@zeroxsolutions/editor-core/profiles/index';
import {
  sameBlockContent,
  type RenderedEmail,
  type RenderEmailInput,
  type RenderProblem,
} from '@zeroxsolutions/editor-core/template/email/index';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { Editor } from '../../document/react/editor';
import { BubbleMenu } from '../../document/ui/bubble-menu';
import { EditorToolbar } from '../../document/ui/editor-toolbar';
import { SlashMenu } from '../../document/ui/slash-menu';
import { ProblemMarker } from '../problem-marker';
import { caretNode, nextMarker, useFocusLeave } from '../problem-navigation';
import { refreshVariables, variableFeature } from '../variables/variable';
import { VariableMenu } from '../variables/variable-menu';
import { BlockAttributesMenu } from './block-attributes-menu';
import { emailKit } from './email-kit';
import { carriesKey, contextOf } from './kit-context';
import { LinkVariablePicker } from './url-variable-picker';
import { problemDecorations, problemMarks, type ProblemMark } from './problem-decorations';

/** How long after an edit the problems are read again, at most, and how long after the last edit the preview is. */
const SETTLE_MS = 300;

/** What a preview's render takes besides the blocks and the variables, which the editor fills itself. */
export type EmailPreviewInput = Omit<RenderEmailInput<unknown>, 'blocks' | 'variables' | 'variableTypes'>;

/** The host's `createEmailRenderer` instance. */
export interface EmailPreviewRenderer {
  render(input: RenderEmailInput<unknown>): RenderedEmail;
}

/** The preview is drawn only with a renderer, and a renderer needs the subject, locale and layout it renders in. */
export type EmailPreviewProps =
  | { renderer?: undefined; previewInput?: undefined }
  | { renderer: EmailPreviewRenderer; previewInput: EmailPreviewInput };

/**
 * `value` is the document the editor shows. A host hands back what `onChange` gave it, calls `assignBlockIds`
 * after a save, and passes a different `value` only to open another document, or remounts the editor with a
 * `key`. A value whose content differs from the editor's replaces it, so a refetched copy fed back mid-edit
 * drops the edits made since.
 */
export type EmailEditorProps = EmailEditorBaseProps & EmailPreviewProps;

interface EmailEditorBaseProps {
  profile: EditorProfile;
  value: EditorEmailBlock[];
  /** Features of the host's own blocks, each with an email codec. Read once: a change needs a remount. */
  features?: EditorFeature[];
  /** The ids of the blocks the author may not remove. */
  required?: readonly string[];
  /** `locked` lets the author edit text and variables only; nothing is inserted, removed or restyled. */
  structure?: 'free' | 'locked';
  className?: string;
  onChange?(blocks: EditorEmailBlock[]): void;
  /** The focus left the editor and the popups it opened; when to save is the host's. */
  onBlur?(): void;
  /** The problems, on mount and whenever the list changes. */
  onValidate?(problems: ProfileProblem[]): void;
  /** What the host draws beside a block, such as a translation's standing. */
  renderBlockAdornment?(id: string | null, key: string): ReactNode;
  onReady?(editor: IEditor): void;
}

interface Row {
  id: string | null;
  key: string;
}

/** The top-level blocks and each lane's blocks, in document order. */
function rowsOf(blocks: readonly EditorEmailBlock[]): Row[] {
  return blocks.flatMap((block) => [
    { id: block.id, key: block.key },
    ...(block.lanes ?? []).flatMap((lane) => rowsOf(lane)),
  ]);
}

/** The blocks a render takes: a key stands in for the id of a block the host has not saved yet. */
function withIds(blocks: readonly EditorEmailBlock[]): RenderEmailInput<unknown>['blocks'] {
  return blocks.map(({ lanes, ...block }) => ({
    ...block,
    id: block.id ?? block.key,
    ...(lanes ? { lanes: lanes.map(withIds) } : {}),
  }));
}

interface Overlay {
  marks: readonly ProblemMark[];
  host(key: string): HTMLElement;
}

const overlayKey = new PluginKey('emailEditorOverlay');

/**
 * The problem decorations, and the row before each block where its markers and the host's adornment are drawn.
 * `read` is a getter so a new set of problems needs no new plugin; a transaction with this plugin's meta redraws.
 */
function overlayFeature(read: () => Overlay): EditorFeature {
  let drawn: { doc: ProseMirrorNode; overlay: Overlay; set: DecorationSet } | null = null;
  const plugin = new Plugin({
    key: overlayKey,
    props: {
      decorations(state) {
        const overlay = read();
        if (drawn?.doc === state.doc && drawn.overlay === overlay) return drawn.set;
        const rows: Decoration[] = [];
        state.doc.descendants((node, pos) => {
          if (!carriesKey(node) || typeof node.attrs.key !== 'string') return true;
          rows.push(
            Decoration.widget(pos, overlay.host(node.attrs.key), {
              key: `email-row-${node.attrs.key}`,
              side: -1,
              ignoreSelection: true,
              // The host's controls take their own clicks and keys.
              stopEvent: () => true,
            }),
          );
          return true;
        });
        const set = DecorationSet.create(state.doc, [...rows, ...problemDecorations(state.doc, overlay.marks)]);
        drawn = { doc: state.doc, overlay, set };
        return set;
      },
    },
  });
  return {
    id: 'emailEditorOverlay',
    advanced: {
      engineExtensions: [Extension.create({ name: 'emailEditorOverlay', addProseMirrorPlugins: () => [plugin] })],
    },
  };
}

/** The message a render problem shows under the preview. */
function renderProblemMessage(problem: RenderProblem): string {
  const where = problem.blockId === null ? '' : ` in block ${problem.blockId}`;
  return `${problem.kind}${problem.name === undefined ? '' : ` {{${problem.name}}}`}${where}`;
}

/**
 * The email profile's editor: the document editor with `emailKit`'s blocks, marks and variables, the block menu,
 * each problem marked where it is, the host's adornment beside each block, and the renderer's preview.
 * `value` loads whenever it differs from what the editor last reported, so a host hands back what `onChange`
 * gave it without moving the caret.
 */
export function EmailEditor({
  profile,
  value,
  features: extra,
  required = [],
  structure = 'free',
  renderer,
  previewInput,
  className,
  onChange,
  onBlur,
  onValidate,
  renderBlockAdornment,
  onReady,
}: EmailEditorProps) {
  const idBase = useId();
  const live = useRef({ profile, required, structure, renderer, previewInput, onChange, onValidate, onBlur });
  live.current = { profile, required, structure, renderer, previewInput, onChange, onValidate, onBlur };

  const hosts = useRef(new Map<string, HTMLElement>());
  const host = useCallback((key: string) => {
    let element = hosts.current.get(key);
    if (!element) {
      element = document.createElement('div');
      element.contentEditable = 'false';
      element.dataset.slot = 'email-block-row';
      element.dataset.key = key;
      element.className = 'not-prose flex items-center justify-end gap-1 empty:hidden';
      hosts.current.set(key, element);
    }
    return element;
  }, []);
  const overlay = useRef<Overlay>({ marks: [], host });

  const [setup] = useState(() => {
    const codecs = (extra ?? []).flatMap((feature) => feature.codecs ?? []);
    const declarations = () => live.current.profile.variables;
    const variables = variableFeature(declarations);
    const kit = emailKit(profile, extra, {
      declarations,
      variables,
      required: () => live.current.required,
      structure: () => live.current.structure,
    });
    const features = [...kit, overlayFeature(() => overlay.current)];
    return { codecs, variables, features, ui: collectUiContributions(features) };
  });

  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [marks, setMarks] = useState<ProblemMark[]>([]);
  const [unplaced, setUnplaced] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ html: string; problems: string[] } | null>(null);

  // What the editor last reported, and the value it last loaded: a value with the same content as either is no news.
  const reported = useRef<EditorEmailBlock[] | null>(null);
  const loaded = useRef(value);
  const loading = useRef(false);
  const validated = useRef<ProfileProblem[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exportBlocks = useCallback((from: IEditor) => toEmailBlocks(from.getJSON(), setup.codecs), [setup]);

  const check = useCallback(
    (from: IEditor) => {
      if (from.status === 'destroyed') return;
      const problems = validate(exportBlocks(from), live.current.profile);
      if (validated.current !== null && sameBlockContent(validated.current, problems)) return;
      validated.current = problems;
      const placed = problemMarks(problems, idBase);
      overlay.current = { marks: placed.marks, host };
      setMarks(placed.marks);
      setUnplaced(placed.unplaced);
      const engine = contextOf(from)?.engine;
      engine?.view.dispatch(engine.state.tr.setMeta(overlayKey, true));
      live.current.onValidate?.(problems);
    },
    [exportBlocks, host, idBase],
  );

  const draw = useCallback(
    (from: IEditor) => {
      if (from.status === 'destroyed') return;
      const { profile: current, renderer: render, previewInput: input } = live.current;
      if (!render || !input) {
        setPreview(null);
        return;
      }
      const variables = Object.fromEntries(
        current.variables.flatMap(({ name, sampleValue }) => (sampleValue === undefined ? [] : [[name, sampleValue]])),
      );
      const variableTypes = Object.fromEntries(current.variables.map(({ name, type }) => [name, type]));
      const rendered = render.render({ ...input, blocks: withIds(exportBlocks(from)), variables, variableTypes });
      setPreview({ html: rendered.html, problems: rendered.problems.map(renderProblemMessage) });
    },
    [exportBlocks],
  );

  // Each edit's problems show within SETTLE_MS, however fast the author types; the preview waits for a pause.
  const schedule = useCallback(
    (from: IEditor) => {
      if (timer.current === null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          check(from);
        }, SETTLE_MS);
      }
      if (previewTimer.current !== null) clearTimeout(previewTimer.current);
      previewTimer.current = setTimeout(() => {
        previewTimer.current = null;
        draw(from);
      }, SETTLE_MS);
    },
    [check, draw],
  );
  useEffect(
    () => () => {
      for (const pending of [timer, previewTimer]) if (pending.current !== null) clearTimeout(pending.current);
    },
    [],
  );

  const syncRows = useCallback((blocks: readonly EditorEmailBlock[]) => {
    const next = rowsOf(blocks);
    setRows((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    const keys = new Set(next.map((row) => row.key));
    for (const key of hosts.current.keys()) if (!keys.has(key)) hosts.current.delete(key);
  }, []);

  useEffect(() => {
    if (!editor) return;
    const blocks = exportBlocks(editor);
    reported.current = blocks;
    syncRows(blocks);
    check(editor);
    draw(editor);
    return editor.onChange(() => {
      if (loading.current) return;
      const next = exportBlocks(editor);
      syncRows(next);
      if (reported.current !== null && sameBlockContent(reported.current, next)) return;
      reported.current = next;
      live.current.onChange?.(next);
      schedule(editor);
    });
  }, [editor, exportBlocks, schedule, check, draw, syncRows]);

  // A value from outside loads; the one the editor reported, handed back, does not.
  useEffect(() => {
    if (!editor) return;
    if (sameBlockContent(value, loaded.current)) return;
    if (reported.current !== null && sameBlockContent(value, reported.current)) return;
    loaded.current = value;
    loading.current = true;
    try {
      editor.setContent(fromEmailBlocks(value, setup.codecs));
    } finally {
      loading.current = false;
    }
    const blocks = exportBlocks(editor);
    reported.current = blocks;
    syncRows(blocks);
    schedule(editor);
  }, [editor, value, setup, exportBlocks, schedule, syncRows]);

  // Chips read the declarations again; the problems and the preview follow the profile and the renderer.
  // The mount already read them, so only a change runs again; a host may build them anew on every render.
  const read = useRef({ profile, renderer, previewInput });
  useEffect(() => {
    const before = read.current;
    if (
      sameBlockContent(before.profile, profile) &&
      before.renderer === renderer &&
      sameBlockContent(before.previewInput ?? null, previewInput ?? null)
    ) {
      return;
    }
    read.current = { profile, renderer, previewInput };
    if (!editor) return;
    if (!sameBlockContent(before.profile.variables, profile.variables)) refreshVariables(editor);
    schedule(editor);
  }, [editor, profile, renderer, previewInput, schedule]);

  const focus = useFocusLeave(() => live.current.onBlur?.());

  // F8 and Shift+F8 reach the next and the previous problem, as in VS Code; Escape on one goes back to its block.
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editor || !root) return;
    const target = event.target as Element;
    const marker = target.closest('[data-slot=email-problem-marker]');
    if (event.key === 'Escape' && marker) {
      const key = marker.closest<HTMLElement>('[data-slot=email-block-row]')?.dataset.key;
      if (key !== undefined && returnTo(editor, key)) event.preventDefault();
      return;
    }
    if (event.key !== 'F8' || !(marker || target.closest('[contenteditable=true]'))) return;
    const markers = [...root.querySelectorAll<HTMLElement>('[data-slot=email-problem-marker]')];
    if (markers.length === 0) return;
    event.preventDefault();
    const from = marker ?? caretNode() ?? target;
    const next = nextMarker(markers, from, event.shiftKey);
    next.focus();
  };

  const locked = structure === 'locked';
  const variablesOf = useCallback(() => live.current.profile.variables, []);
  const marksOf = (row: Row) => marks.filter((mark) => mark.block === (row.id ?? row.key));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        ref={setRoot}
        data-slot="email-editor"
        className="relative flex flex-col gap-2"
        {...focus}
        onKeyDownCapture={keyDown}
      >
        {editor && (
          <div className="flex flex-wrap items-center gap-1">
            <EditorToolbar editor={editor} items={setup.ui.toolbar} />
            <LinkVariablePicker editor={editor} declarations={variablesOf} />
            <VariableMenu editor={editor} declarations={profile.variables} />
          </div>
        )}
        <Editor
          features={setup.features}
          content={fromEmailBlocks(value, setup.codecs)}
          onReady={(ready) => {
            setEditor(ready);
            onReady?.(ready);
          }}
        />
        {editor && <TriggerLayer editor={editor} triggers={[setup.variables.token]} />}
        {editor && !locked && <SlashMenu editor={editor} items={setup.ui.slash} />}
        {editor && <BubbleMenu editor={editor} items={setup.ui.bubble} container={root} />}
        {editor && !locked && <BlockAttributesMenu key={required.join('\u0000')} editor={editor} />}
        <TooltipProvider>
          {rows.map((row) => {
            return createPortal(
              <>
                {marksOf(row).map((mark) => (
                  <ProblemMarker key={mark.id} id={mark.id} messages={mark.messages} slot="email-problem-marker" />
                ))}
                {renderBlockAdornment && (
                  <span data-slot="email-block-adornment" className="contents">
                    {renderBlockAdornment(row.id, row.key)}
                  </span>
                )}
              </>,
              host(row.key),
              row.key,
            );
          })}
        </TooltipProvider>
      </div>
      {unplaced.length > 0 && (
        <ul data-slot="email-problems" className="text-destructive flex flex-col gap-1 text-sm">
          {unplaced.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {renderer && preview && (
        <>
          <iframe
            data-slot="email-preview"
            title="Email preview"
            sandbox=""
            srcDoc={preview.html}
            className="cn-editor-block h-[480px] w-full border"
          />
          {preview.problems.length > 0 && (
            <ul data-slot="email-preview-problems" className="text-destructive flex flex-col gap-1 text-sm">
              {preview.problems.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** Puts the caret at the start of the block keyed `key`, or picks the block when it holds no text. */
function returnTo(editor: IEditor, key: string): boolean {
  const engine = contextOf(editor)?.engine;
  if (!engine) return false;
  let found: number | undefined;
  engine.state.doc.descendants((node, pos) => {
    if (found === undefined && carriesKey(node) && node.attrs.key === key) found = pos;
    return found === undefined;
  });
  if (found === undefined) return false;
  const { doc, tr } = engine.state;
  engine.view.dispatch(tr.setSelection(Selection.near(doc.resolve(found + 1))));
  engine.view.focus();
  return true;
}
