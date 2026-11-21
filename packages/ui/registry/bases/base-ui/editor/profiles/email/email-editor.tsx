'use client';

import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlertIcon } from 'lucide-react';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
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
import type { RenderedEmail, RenderEmailInput } from '@zeroxsolutions/editor-core/template/email/index';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { Editor } from '../../document/react/editor';
import { BubbleMenu } from '../../document/ui/bubble-menu';
import { EditorToolbar } from '../../document/ui/editor-toolbar';
import { SlashMenu } from '../../document/ui/slash-menu';
import { refreshVariables, variableFeature } from '../variables/variable';
import { VariableMenu } from '../variables/variable-menu';
import { BlockAttributesMenu } from './block-attributes-menu';
import { emailKit } from './email-kit';
import { carriesKey, contextOf } from './kit-context';
import { LinkVariablePicker } from './url-variable-picker';
import { problemDecorations, problemMarks, type ProblemMark } from './problem-decorations';

/** How long after an edit the problems and the preview are read again, at most. */
const SETTLE_MS = 300;

/** What a preview's render takes besides the blocks and the variables, which the editor fills itself. */
export type EmailPreviewInput = Partial<Omit<RenderEmailInput<unknown>, 'blocks' | 'variables' | 'variableTypes'>>;

export interface EmailEditorProps {
  profile: EditorProfile;
  value: EditorEmailBlock[];
  /** Features of the host's own blocks, each with an email codec. Read once: a change needs a remount. */
  features?: EditorFeature[];
  /** The ids of the blocks the author may not remove. */
  required?: readonly string[];
  /** `locked` lets the author edit text and variables only; nothing is inserted, removed or restyled. */
  structure?: 'free' | 'locked';
  /** The host's `createEmailRenderer` instance; the preview is drawn only when it is given. */
  renderer?: { render(input: RenderEmailInput<unknown>): RenderedEmail };
  /** The subject, locale, layout props and regions the preview renders with. */
  previewInput?: EmailPreviewInput;
  className?: string;
  onChange?(blocks: EditorEmailBlock[]): void;
  /** The focus left the editor; when to save is the host's. */
  onBlur?(): void;
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

function ProblemMarker({ mark }: { mark: ProblemMark }) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              data-slot="email-problem-marker"
              aria-label="Problem"
              aria-describedby={mark.id}
              className="text-destructive"
            >
              <CircleAlertIcon aria-hidden />
            </Button>
          }
        />
        <TooltipContent side="top">{mark.messages.join('. ')}</TooltipContent>
      </Tooltip>
      <span id={mark.id} className="sr-only">
        {mark.messages.join('. ')}
      </span>
    </>
  );
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
  const live = useRef({ profile, required, structure, renderer, previewInput, onChange, onValidate });
  live.current = { profile, required, structure, renderer, previewInput, onChange, onValidate };

  const hosts = useRef(new Map<string, HTMLElement>());
  const host = useCallback((key: string) => {
    let element = hosts.current.get(key);
    if (!element) {
      element = document.createElement('div');
      element.contentEditable = 'false';
      element.dataset.slot = 'email-block-row';
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
  const [html, setHtml] = useState<string | null>(null);

  // What the editor last reported, and the value it last loaded, each as JSON: a value equal to either is no news.
  const reported = useRef<string | null>(null);
  const loaded = useRef(JSON.stringify(value));
  const loading = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exportBlocks = useCallback((from: IEditor) => toEmailBlocks(from.getJSON(), setup.codecs), [setup]);

  const settle = useCallback(
    (from: IEditor) => {
      if (from.status === 'destroyed') return;
      const blocks = exportBlocks(from);
      const { profile: current, renderer: render, previewInput: input, onValidate: report } = live.current;
      const problems = validate(blocks, current);
      const placed = problemMarks(problems, idBase);
      overlay.current = { marks: placed.marks, host };
      setMarks(placed.marks);
      setUnplaced(placed.unplaced);
      const engine = contextOf(from)?.engine;
      engine?.view.dispatch(engine.state.tr.setMeta(overlayKey, true));
      report?.(problems);
      if (render) {
        const variables = Object.fromEntries(
          current.variables.flatMap(({ name, sampleValue }) =>
            sampleValue === undefined ? [] : [[name, sampleValue]],
          ),
        );
        const variableTypes = Object.fromEntries(current.variables.map(({ name, type }) => [name, type]));
        setHtml(
          render.render({
            subject: '',
            preheader: null,
            locale: 'en',
            layoutProps: undefined,
            ...input,
            blocks: withIds(blocks),
            variables,
            variableTypes,
          }).html,
        );
      } else {
        setHtml(null);
      }
    },
    [exportBlocks, host, idBase],
  );

  // Every edit is read again within SETTLE_MS, however fast the author types.
  const schedule = useCallback(
    (from: IEditor) => {
      if (timer.current !== null) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        settle(from);
      }, SETTLE_MS);
    },
    [settle],
  );
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
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
    reported.current = JSON.stringify(blocks);
    syncRows(blocks);
    settle(editor);
    return editor.onChange(() => {
      if (loading.current) return;
      const next = exportBlocks(editor);
      const json = JSON.stringify(next);
      syncRows(next);
      if (json === reported.current) return;
      reported.current = json;
      live.current.onChange?.(next);
      schedule(editor);
    });
  }, [editor, exportBlocks, schedule, settle, syncRows]);

  // A value from outside loads; the one the editor reported, handed back, does not.
  useEffect(() => {
    if (!editor) return;
    const json = JSON.stringify(value);
    if (json === reported.current || json === loaded.current) return;
    loaded.current = json;
    loading.current = true;
    try {
      editor.setContent(fromEmailBlocks(value, setup.codecs));
    } finally {
      loading.current = false;
    }
    const blocks = exportBlocks(editor);
    reported.current = JSON.stringify(blocks);
    syncRows(blocks);
    schedule(editor);
  }, [editor, value, setup, exportBlocks, schedule, syncRows]);

  // Chips read the declarations again; the problems and the preview follow the profile and the renderer.
  // The mount already read them, so only a change runs again.
  const read = useRef({ profile, renderer, previewInput });
  useEffect(() => {
    const before = read.current;
    read.current = { profile, renderer, previewInput };
    if (!editor) return;
    if (before.profile.variables !== profile.variables) refreshVariables(editor);
    if (before.profile !== profile || before.renderer !== renderer || before.previewInput !== previewInput) {
      schedule(editor);
    }
  }, [editor, profile, renderer, previewInput, schedule]);

  const blur = (event: FocusEvent<HTMLDivElement>) => {
    const to = event.relatedTarget;
    if (!(to instanceof Node && event.currentTarget.contains(to))) onBlur?.();
  };

  const locked = structure === 'locked';
  const marksOf = (row: Row) => marks.filter((mark) => mark.block === (row.id ?? row.key));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div ref={setRoot} data-slot="email-editor" className="relative flex flex-col gap-2" onBlur={blur}>
        {editor && (
          <div className="flex flex-wrap items-center gap-1">
            <EditorToolbar editor={editor} items={setup.ui.toolbar} />
            <LinkVariablePicker editor={editor} declarations={() => live.current.profile.variables} />
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
                  <ProblemMarker key={mark.id} mark={mark} />
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
      {renderer && html !== null && (
        <iframe
          data-slot="email-preview"
          title="Email preview"
          sandbox=""
          srcDoc={html}
          className="cn-editor-block h-[480px] w-full border"
        />
      )}
    </div>
  );
}
