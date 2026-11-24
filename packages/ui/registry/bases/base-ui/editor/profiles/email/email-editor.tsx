'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { EyeIcon } from '@/registry/bases/base-ui/icons/lucide/eye-icon';
import { PencilLineIcon } from '@/registry/bases/base-ui/icons/lucide/pencil-line-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { TooltipProvider } from '@/registry/bases/base-ui/ui/tooltip';
import {
  Decoration,
  DecorationSet,
  Extension,
  Plugin,
  PluginKey,
  Selection,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry } from '@zeroxsolutions/editor-core/document/serialize/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import {
  docProblems,
  fromEmailBlocks,
  toEmailBlocks,
  validate,
  type EditorEmailBlock,
  type EditorProfile,
  type ProfileProblem,
} from '@zeroxsolutions/editor-core/profiles/index';
import {
  sameBlockContent,
  type EmailBlockDefinition,
  type RenderedEmail,
  type RenderEmailInput,
} from '@zeroxsolutions/editor-core/template/email/index';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { Editor } from '../../document/react/editor';
import { BubbleMenu } from '../../document/ui/bubble-menu';
import { ChromeControl } from '../../document/ui/chrome-icon';
import { EditorToolbar } from '../../document/ui/editor-toolbar';
import { renderToReact } from '../../document/serialize/render-to-react';
import { SlashMenu } from '../../document/ui/slash-menu';
import { profileMessages, type ProfileEditorMessages } from '../messages';
import { ProblemMarker } from '../problem-marker';
import { caretNode, nextMarker, useFocusLeave } from '../problem-navigation';
import { refreshVariables, variableFeature } from '../variables/variable';
import { VariableMenu } from '../variables/variable-menu';
import { emailBlockFeature } from './email-block-feature';
import { emailKit, emailUi, type EmailUi } from './email-kit';
import { UNLINK_ITEM_ID } from './marks';
import { carriesKey, contextOf } from './kit-context';
import { EmailLinkPopover } from './email-link-popover';
import { EmailPreview } from './email-preview';
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
  /** The editable surface's accessible name. */
  label: string;
  /**
   * The host's words for any string the editor draws; the rest stay English. Build it once per locale: a new
   * object rebuilds the toolbar's and menus' items. A problem keeps the words it was marked with until the
   * problems are read again, after the next edit.
   */
  messages?: Partial<ProfileEditorMessages>;
  /** The sender's name the preview's inbox line shows above the subject. */
  sender?: string;
  /** Shows the document and its problems with no way to change it: no typing, toolbar or block menu. */
  readOnly?: boolean;
  /**
   * The product's own blocks, from `defineEmailBlock`: each is offered, edited and exported, and its type joins
   * the profile's kinds. Read once: a change needs a remount.
   */
  blocks?: readonly EmailBlockDefinition[];
  /**
   * Features of the host's own, each block in them with an email codec; a block from `defineEmailBlock` goes in
   * `blocks`. Read once: a change needs a remount.
   */
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
  label: string;
}

const overlayKey = new PluginKey('emailEditorOverlay');

/**
 * The problem decorations, the row before each block where its markers and the host's adornment are drawn, and
 * the surface's accessible name. `read` is a getter so a new set of problems needs no new plugin; a transaction
 * with this plugin's meta redraws.
 */
function overlayFeature(read: () => Overlay): EditorFeature {
  let drawn: { doc: ProseMirrorNode; overlay: Overlay; set: DecorationSet } | null = null;
  const plugin = new Plugin({
    key: overlayKey,
    props: {
      attributes: () => ({ 'aria-label': read().label }),
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

/**
 * The value with the keys of saved blocks left out: a saved block is known by its id, and a refetched copy may
 * carry no keys or other ones. A block not saved yet keeps its key, the only identity it has.
 */
function withoutSavedKeys(blocks: readonly EditorEmailBlock[]): unknown[] {
  return blocks.map(({ key, lanes, ...block }) => ({
    ...block,
    ...(block.id === null ? { key } : {}),
    ...(lanes ? { lanes: lanes.map(withoutSavedKeys) } : {}),
  }));
}

/** Whether two values hold the same content, saved blocks compared by id alone. */
function sameValue(left: readonly EditorEmailBlock[], right: readonly EditorEmailBlock[]): boolean {
  return sameBlockContent(withoutSavedKeys(left), withoutSavedKeys(right));
}

interface EmailEditorStaticProps {
  doc: DocJSON;
  features: EditorFeature[];
  /** Leaves the editable surface's side gutter, where the block grips sit, so the text does not move as it mounts. */
  editable: boolean;
}

/**
 * The document the editor opens on, drawn from its JSON with no engine, in the editor's own frame. The server
 * draws no editor, and the engine mounts only after hydration, so without it the page shows nothing where
 * the document goes until the client has loaded and run the editor.
 */
function EmailEditorStatic({ doc, features, editable }: EmailEditorStaticProps) {
  const registry = useMemo(() => createCodecRegistry(features), [features]);
  return (
    <div
      data-slot="email-editor-static"
      data-editor="document"
      className="cn-editor-content document-editor prose max-w-none text-base leading-relaxed [contain:inline-size]"
    >
      {/* The engine's own wrapper, which the document's rules in `styles.css` select. */}
      <div className={cn('ProseMirror', editable && 'px-12')}>{renderToReact(doc, registry)}</div>
    </div>
  );
}

interface EmailEditorPaneProps {
  /** The element the editor renders into, once for the editor's life. */
  surface: HTMLElement | null;
  /** Called as the pane gives the surface up, before it leaves the document. */
  onRelease(): void;
  /** Called once the pane holds the surface. */
  onAdopt(): void;
}

/**
 * Where the editor is drawn, alone or under the Edit tab. The pane mounted last takes `surface`, so a renderer
 * given or taken away moves the editor's DOM into the new pane: rendered inside each pane, the editor would mount
 * again and lose its document, selection and history.
 */
function EmailEditorPane({ surface, onRelease, onAdopt }: EmailEditorPaneProps) {
  const pane = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onRelease, onAdopt });
  handlers.current = { onRelease, onAdopt };
  // React runs a removed pane's cleanup while its DOM is still in the document, and the new pane's effect after.
  useLayoutEffect(() => {
    if (!surface) return;
    pane.current?.append(surface);
    handlers.current.onAdopt();
    return () => handlers.current.onRelease();
  }, [surface]);
  return <div ref={pane} data-slot="email-editor-pane" />;
}

interface EmailEditorBubbleMenuProps {
  editor: IEditor;
  items: EmailUi['bubble'];
  container: HTMLElement | null;
}

/** The selection bubble, offering to remove a link only while the selection is in one. */
function EmailEditorBubbleMenu({ editor, items, container }: EmailEditorBubbleMenuProps) {
  const [inLink, setInLink] = useState(() => editor.isActive('emailLink'));
  // The engine's own events, not the DOM's `selectionchange`, which fires before the engine reads the selection.
  useEffect(() => {
    const update = () => setInLink(editor.isActive('emailLink'));
    const offSelection = editor.onSelectionUpdate(update);
    const offChange = editor.onChange(update);
    return () => {
      offSelection();
      offChange();
    };
  }, [editor]);
  const offered = items.filter((item) => inLink || item.id !== UNLINK_ITEM_ID);
  return <BubbleMenu editor={editor} items={offered} container={container} />;
}

/**
 * The email profile's editor: the document editor with `emailKit`'s blocks, marks and variables, the block menu,
 * each problem marked where it is, the host's adornment beside each block, and, with a renderer, the rendered
 * email under a Preview tab, at the editor's own width and in the scheme of the theme around it. The frame is
 * the Document Editor's: the toolbar above the document, the Edit and Preview tabs at the end of the toolbar's
 * row, as a Mermaid block's switch sits, and the problems no block holds under the document.
 * `value` loads whenever it differs from what the editor last reported, so a host hands back what `onChange`
 * gave it without moving the caret.
 */
export function EmailEditor({
  profile: given,
  value,
  label,
  messages,
  readOnly = false,
  features: hosted,
  blocks,
  required = [],
  structure = 'free',
  renderer,
  previewInput,
  sender,
  className,
  onChange,
  onBlur,
  onValidate,
  renderBlockAdornment,
  onReady,
}: EmailEditorProps) {
  const idBase = useId();
  const text = useMemo(() => profileMessages(messages), [messages]);
  const [types] = useState(() => (blocks ?? []).map((definition) => definition.editor.type));
  const profile = useMemo(
    () =>
      types.every((type) => given.kinds.includes(type))
        ? given
        : { ...given, kinds: [...given.kinds, ...types.filter((type) => !given.kinds.includes(type))] },
    [given, types],
  );
  const live = useRef({ profile, required, structure, renderer, previewInput, text, onChange, onValidate, onBlur });
  live.current = { profile, required, structure, renderer, previewInput, text, onChange, onValidate, onBlur };

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
  const overlay = useRef<Overlay>({ marks: [], host, label });

  const [setup] = useState(() => {
    const extra = [
      ...(blocks ?? []).map((definition) => emailBlockFeature(definition, { messages: () => live.current.text })),
      ...(hosted ?? []),
    ];
    const codecs = extra.flatMap((feature) => feature.codecs ?? []);
    const declarations = () => live.current.profile.variables;
    const variables = variableFeature(declarations);
    const kit = emailKit(profile, extra, {
      declarations,
      variables,
      required: () => live.current.required,
      structure: () => live.current.structure,
      messages: () => live.current.text,
    });
    const features = [...kit, overlayFeature(() => overlay.current)];
    return { codecs, variables, features, profile, ui: collectUiContributions(features) };
  });
  // The editor reads its content once, on mount; a later value loads through setContent below.
  const [initialContent] = useState(() => fromEmailBlocks(value, setup.codecs));

  // Made after hydration, as the server draws no editor.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = document.createElement('div');
    element.dataset.slot = 'email-editor-surface';
    setSurface(element);
  }, []);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const previewing = Boolean(renderer) && tab === 'preview';

  // What held the focus in the editor as its pane gave it up: moving the surface drops the focus, and the
  // author typing as the host passes a renderer keeps typing.
  const held = useRef<HTMLElement | null>(null);

  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [marks, setMarks] = useState<ProblemMark[]>([]);
  const [unplaced, setUnplaced] = useState<string[]>([]);
  const [preview, setPreview] = useState<{
    html: string;
    subject: string;
    preheader: string;
    problems: string[];
  } | null>(null);

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
      // What the export cannot carry is named on the document's own nodes, before they fold into email blocks.
      const problems = [...validate(exportBlocks(from), live.current.profile), ...docProblems(from.getJSON())];
      if (validated.current !== null && sameBlockContent(validated.current, problems)) return;
      validated.current = problems;
      const placed = problemMarks(problems, idBase, live.current.text.problem);
      overlay.current = { ...overlay.current, marks: placed.marks };
      setMarks(placed.marks);
      setUnplaced(placed.unplaced);
      const engine = contextOf(from)?.engine;
      engine?.view.dispatch(engine.state.tr.setMeta(overlayKey, true));
      live.current.onValidate?.(problems);
    },
    [exportBlocks, idBase],
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
      const blocks = exportBlocks(from);
      const rendered = render.render({ ...input, blocks: withIds(blocks), variables, variableTypes });
      const places = new Map(rowsOf(blocks).map((row, index) => [row.id ?? row.key, index + 1]));
      const problems = rendered.problems.map((problem) =>
        live.current.text.renderProblem(problem, problem.blockId === null ? undefined : places.get(problem.blockId)),
      );
      setPreview({ html: rendered.html, subject: rendered.subject, preheader: rendered.preheader, problems });
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
    if (sameValue(value, loaded.current)) return;
    if (reported.current !== null && sameValue(value, reported.current)) return;
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

  // The engine reads the name off the overlay when it draws, which a new label alone does not cause.
  useEffect(() => {
    if (overlay.current.label === label) return;
    overlay.current = { ...overlay.current, label };
    const engine = editor && contextOf(editor)?.engine;
    engine?.view.dispatch(engine.state.tr.setMeta(overlayKey, true));
  }, [editor, label]);

  const variables = useMemo(
    () => ({ ...setup.variables.token, emptyText: text.noVariables }),
    [setup, text.noVariables],
  );
  const items = useMemo(() => emailUi(setup.ui, setup.profile, text), [setup, text]);

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
  const menus = editor !== null && !readOnly;
  const marksOf = (row: Row) => marks.filter((mark) => mark.block === (row.id ?? row.key));

  const release = () => {
    const active = document.activeElement;
    held.current = surface && active instanceof HTMLElement && surface.contains(active) ? active : null;
  };
  const adopt = () => {
    const element = held.current;
    held.current = null;
    if (!element?.isConnected) return;
    const view = editor && contextOf(editor)?.engine.view;
    // The view puts its own selection back as it takes the focus; a bare focus() would let the browser place it.
    if (view?.dom === element) view.focus();
    else element.focus({ preventScroll: true });
  };
  const pane = (
    <>
      {editor === null && <EmailEditorStatic doc={initialContent} features={setup.features} editable={!readOnly} />}
      <EmailEditorPane surface={surface} onRelease={release} onAdopt={adopt} />
    </>
  );
  const toolbar = menus && (
    <EditorToolbar
      editor={editor}
      items={items.toolbar}
      className="min-w-0 self-start"
      end={<VariableMenu editor={editor} declarations={profile.variables} messages={text} />}
    />
  );
  const previewProblems = (renderer && preview?.problems) || [];

  return (
    <div
      ref={setRoot}
      data-slot="email-editor"
      className={cn('relative flex w-full flex-col gap-3', className)}
      {...focus}
      onKeyDownCapture={keyDown}
    >
      {renderer ? (
        <Tabs value={tab} onValueChange={(value: 'edit' | 'preview') => setTab(value)} className="gap-3">
          <div data-slot="email-editor-bar" className="flex items-center gap-3">
            {/* The editor is out of sight on the Preview tab, so its toolbar is too. */}
            {!previewing && toolbar}
            <TabsList className="ms-auto shrink-0">
              <ChromeControl
                icon={PencilLineIcon}
                render={(control) => <TabsTrigger value="edit" aria-label={text.editTab} {...control} />}
              />
              <ChromeControl
                icon={EyeIcon}
                render={(control) => <TabsTrigger value="preview" aria-label={text.previewTab} {...control} />}
              />
            </TabsList>
          </div>
          {/* Kept mounted, so the editor stays in the document behind the preview and the preview behind it. */}
          <TabsContent value="edit" keepMounted>
            {pane}
          </TabsContent>
          <TabsContent value="preview" keepMounted>
            {preview && (
              <EmailPreview
                html={preview.html}
                subject={preview.subject}
                preheader={preview.preheader}
                sender={sender}
                messages={text}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {toolbar}
          {pane}
        </>
      )}
      {surface &&
        createPortal(
          <Editor
            features={setup.features}
            content={initialContent}
            editable={!readOnly}
            blockMenuLabel={text.blockActions}
            onReady={(ready) => {
              setEditor(ready);
              onReady?.(ready);
            }}
          />,
          surface,
        )}
      {menus && <TriggerLayer editor={editor} triggers={[variables]} />}
      {menus && !locked && (
        <SlashMenu editor={editor} items={items.slash} placeholder={text.slashSearch} emptyText={text.slashEmpty} />
      )}
      {menus && <EmailEditorBubbleMenu editor={editor} items={items.bubble} container={root} />}
      {menus && <EmailLinkPopover editor={editor} messages={text} />}
      <TooltipProvider>
        {rows.map((row) =>
          createPortal(
            <>
              {marksOf(row).map((mark) => (
                <ProblemMarker
                  key={mark.id}
                  id={mark.id}
                  messages={mark.messages}
                  slot="email-problem-marker"
                  label={text.problemMarker}
                />
              ))}
              {renderBlockAdornment && (
                <span data-slot="email-block-adornment" className="contents">
                  {renderBlockAdornment(row.id, row.key)}
                </span>
              )}
            </>,
            host(row.key),
            row.key,
          ),
        )}
      </TooltipProvider>
      {(unplaced.length > 0 || previewProblems.length > 0) && (
        // Under the document, from its text's left edge: the editable text sits past the grip's gutter.
        <div data-slot="email-editor-footer" className={cn('flex flex-col gap-1 text-sm', !readOnly && 'px-12')}>
          {unplaced.length > 0 && (
            <ul data-slot="email-problems" className="text-destructive flex flex-col gap-1">
              {unplaced.map((message, index) => (
                <li key={`${index}:${message}`}>{message}</li>
              ))}
            </ul>
          )}
          {previewProblems.length > 0 && (
            <ul data-slot="email-preview-problems" className="text-destructive flex flex-col gap-1">
              {previewProblems.map((message, index) => (
                // The renderer reports a variable once per use, so two lines can read the same.
                <li key={`${index}:${message}`}>{message}</li>
              ))}
            </ul>
          )}
        </div>
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
