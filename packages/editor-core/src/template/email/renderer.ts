import type { VariableType } from '../variables/variable-type.js';
import type { Variables } from '../variables/variables.js';
import type { BlockDefinition, BlockRenderer, BlockSample, EmailBlock, RenderedBlock, RenderProblem } from './block.js';
import { defaultBlocks, type DefaultBlocks, type DefaultBlockType } from './blocks/index.js';
import { createRenderContext, type RenderState } from './context.js';
import { defaultLayout, type DefaultLayoutProps, type EmailLayout } from './layout.js';
import type { Region, RegionInput } from './region.js';
import { assertEmailTheme, type EmailTheme } from './theme.js';

/** Two definitions of one block type handed to one renderer. */
export class BlockTypeCollision extends Error {
  constructor(readonly type: string) {
    super(`Block type ${type} is defined twice`);
    this.name = 'BlockTypeCollision';
  }
}

type AttributesOf<D> = D extends BlockDefinition<string, infer A, unknown> ? A : never;
type ContentOf<D> = D extends BlockDefinition<string, unknown, infer C> ? C : never;

/** Level 2: a render per default type, each reading that type's own attributes and content. */
export type BlockOverrides = {
  readonly [K in DefaultBlockType]?: BlockRenderer<AttributesOf<DefaultBlocks[K]>, ContentOf<DefaultBlocks[K]>>;
};

export interface EmailRendererOptions<Props, Extra extends readonly BlockDefinition[]> {
  /** Level 1. */
  readonly theme: EmailTheme;
  /** Level 2: the default layout otherwise. */
  readonly layout?: EmailLayout<Props>;
  /** Level 2: replaces the default render of the types it names, and keeps their write checks. */
  readonly blocks?: BlockOverrides;
  /** Level 3: types the defaults do not have. */
  readonly extraBlocks?: Extra;
}

export interface RenderEmailInput<Props> {
  readonly blocks: readonly EmailBlock[];
  readonly subject: string;
  readonly preheader: string | null;
  readonly locale: string;
  readonly variables: Variables;
  /** The template's declarations: only a name declared `url` may fill a link. */
  readonly variableTypes: Readonly<Record<string, VariableType>>;
  readonly layoutProps: Props;
  /** Blocks the layout frames around the body, each region with its own values; an absent region is empty. */
  readonly regions?: Partial<Readonly<Record<Region, RegionInput>>>;
}

export interface RenderedEmail {
  readonly subject: string;
  readonly preheader: string;
  readonly html: string;
  readonly text: string;
  readonly problems: readonly RenderProblem[];
}

/** One composed renderer: the render, and the write checks and translation every caller shares with it. */
export interface EmailRenderer<Type extends string, Props> {
  readonly types: readonly Type[];
  render(input: RenderEmailInput<Props>): RenderedEmail;
  /** The strict write check of a block's attributes; null where refused, or for a type this renderer does not know. */
  attributesOf(type: Type, raw: unknown): unknown;
  contentOf(type: Type, raw: unknown): unknown;
  holdsText(type: Type): boolean;
  holdsLanes(type: Type): boolean;
  /** @throws a `ZodError` when `content` is not its type's shape, which no stored source text is */
  translateContent(type: Type, content: unknown, translateOne: (sentence: string) => Promise<string>): Promise<unknown>;
  sample(type: Type): BlockSample;
}

const EMPTY: RenderedBlock = { html: '', text: '' };

/** A stored entry with the two fields a render routes by; anything else is skipped. */
function isBlock(value: unknown): value is EmailBlock {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

/** `problems` without a repeat: a block reads its text on both arms, and reports a missing value on each. */
function distinct(problems: readonly RenderProblem[]): RenderProblem[] {
  const seen = new Set<string>();
  return problems.filter((problem) => {
    const key = `${problem.region ?? ''}\u0000${problem.blockId}\u0000${problem.kind}\u0000${problem.name ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * The renderer a product composes once and every caller imports: the sender, the preview, the draft edit and
 * the retranslation. A second renderer anywhere is a preview that can disagree with the mail it previews.
 *
 * @throws {EmailThemeInvalid} for a theme value a mail client cannot read
 * @throws {BlockTypeCollision} for an extra type that a default or another extra already defines
 */
export function createEmailRenderer<Props = DefaultLayoutProps, const Extra extends readonly BlockDefinition[] = []>(
  options: EmailRendererOptions<Props, Extra>,
): EmailRenderer<DefaultBlockType | Extra[number]['type'], Props> {
  type Type = DefaultBlockType | Extra[number]['type'];
  const { theme } = options;
  assertEmailTheme(theme);

  const definitions = new Map<string, BlockDefinition>();
  for (const definition of Object.values(defaultBlocks) as BlockDefinition[]) {
    const override = options.blocks?.[definition.type as DefaultBlockType] as unknown as
      | BlockDefinition['render']
      | undefined;
    definitions.set(definition.type, override === undefined ? definition : { ...definition, render: override });
  }
  for (const definition of options.extraBlocks ?? []) {
    if (definitions.has(definition.type)) throw new BlockTypeCollision(definition.type);
    definitions.set(definition.type, definition);
  }
  // Without a layout, `Props` is its default, `DefaultLayoutProps`, which is the default layout's.
  const layout = (options.layout ?? defaultLayout) as EmailLayout<Props>;

  const definitionOf = (type: string): BlockDefinition | undefined => definitions.get(type);

  return {
    types: [...definitions.keys()] as Type[],

    render(input): RenderedEmail {
      const problems: RenderProblem[] = [];
      // Stored JSON is read, not trusted: a list or lane of another shape renders as empty.
      const renderList = (state: RenderState, blocks: unknown, inLane: boolean): RenderedBlock => {
        const readable = Array.isArray(blocks) ? (blocks as unknown[]).filter(isBlock) : [];
        const parts = readable.map((block) => renderOne(state, block, inLane));
        return { html: parts.map((part) => part.html).join(''), text: parts.map((part) => part.text).join('') };
      };
      const renderOne = (state: RenderState, block: EmailBlock, inLane: boolean): RenderedBlock => {
        const definition = definitionOf(block.type);
        const where = state.region === 'body' ? {} : { region: state.region };
        if (definition === undefined) {
          problems.push({ blockId: block.id, kind: 'unknown-block-type', name: block.type, ...where });
          return EMPTY;
        }
        if (inLane && definition.holdsLanes) {
          problems.push({ blockId: block.id, kind: 'block-nested-too-deep', ...where });
          return EMPTY;
        }
        const lanes: readonly unknown[] = Array.isArray(block.lanes) ? block.lanes : [];
        const ctx = createRenderContext(state, block.id, (index) =>
          definition.holdsLanes ? renderList(state, lanes[index], true) : EMPTY,
        );
        return definition.render(
          {
            id: block.id,
            attributes: definition.readAttributes(block.attributes),
            content: definition.readContent(block.content),
          },
          ctx,
        );
      };

      const bodyState: RenderState = {
        theme,
        locale: input.locale,
        variables: input.variables,
        variableTypes: input.variableTypes,
        problems,
        region: 'body',
      };
      const renderRegion = (region: Region): RenderedBlock => {
        // Stored JSON is read, not trusted: a region that is not an object renders as empty.
        const given: unknown = input.regions?.[region];
        if (typeof given !== 'object' || given === null) return EMPTY;
        const { blocks, variables, variableTypes } = given as Partial<RegionInput>;
        return renderList(
          {
            theme,
            locale: input.locale,
            variables: variables ?? {},
            variableTypes: variableTypes ?? {},
            problems,
            region,
          },
          blocks,
          false,
        );
      };

      const header = renderRegion('header');
      const body = renderList(bodyState, input.blocks, false);
      const footer = renderRegion('footer');
      const inbox = createRenderContext(bodyState, null, () => EMPTY);
      const subject = inbox.text(input.subject);
      const preheader = input.preheader === null ? '' : inbox.text(input.preheader);
      const { html, text } = layout({
        body,
        regions: { header, footer },
        subject,
        preheader,
        locale: input.locale,
        theme,
        props: input.layoutProps,
      });
      return { subject, preheader, html, text, problems: distinct(problems) };
    },

    attributesOf(type, raw): unknown {
      const parsed = definitionOf(type)?.attributes.safeParse(raw);
      return parsed?.success ? parsed.data : null;
    },
    contentOf(type, raw): unknown {
      const parsed = definitionOf(type)?.content.safeParse(raw);
      return parsed?.success ? parsed.data : null;
    },
    holdsText: (type) => definitionOf(type)?.holdsText ?? false,
    holdsLanes: (type) => definitionOf(type)?.holdsLanes ?? false,
    async translateContent(type, content, translateOne): Promise<unknown> {
      const definition = definitionOf(type);
      if (definition === undefined) return content;
      return definition.translate(definition.content.parse(content), translateOne);
    },
    sample(type): BlockSample {
      const definition = definitionOf(type);
      if (definition === undefined) throw new RangeError(`No block type ${type}`);
      return definition.sample;
    },
  };
}

/** Whether two contents hold the same values. A store answers an object's keys in its own order, so order is not compared. */
export function sameBlockContent(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
