import type { z } from 'zod';
import type { VariableType } from '../variables/variable-type.js';
import type { EmailNode, EmailPrimitives } from './primitives/nodes.js';
import type { Region } from './region.js';
import type { EmailTheme } from './theme.js';

/**
 * One stored block, as a product reads it back. Its attributes and content are unknown on purpose: a
 * renderer reads them through the block type's own definition, which degrades what it cannot read.
 */
export interface EmailBlock<Type extends string = string> {
  readonly id: string;
  readonly type: Type;
  readonly attributes: unknown;
  /** This locale's text for the block; `{}` for a type that holds none. */
  readonly content: unknown;
  /** A lane-holding block's lanes, each in order; absent on every other type. */
  readonly lanes?: readonly (readonly EmailBlock<Type>[])[];
}

/** One render's two arms. Neither is optional: a mail with no plain-text twin is filed as spam by many receivers. */
export interface RenderedBlock {
  readonly html: string;
  readonly text: string;
}

export type RenderProblemKind =
  | 'variable-missing'
  | 'href-invalid'
  | 'href-scheme-refused'
  | 'unknown-block-type'
  | 'block-nested-too-deep'
  | 'lanes-count';

/** Something a render filled with empty rather than fail; `blockId` is null for the subject and preheader. */
export interface RenderProblem {
  readonly blockId: string | null;
  readonly kind: RenderProblemKind;
  readonly name?: string;
  /** The region the block sits in; absent for the body, the subject and the preheader. */
  readonly region?: Region;
}

/** The only way a block's text reaches either arm. */
export interface RenderContext {
  readonly theme: EmailTheme;
  readonly locale: string;
  /** Where the block renders, which decides the text size and colour a default block draws. */
  readonly region: Region | 'body';
  /** The template's text and every value, escaped: authored text in a block is text, never markup. */
  html(template: string): string;
  /** The template's own markup as written, every value escaped: the `html` block's arm, and no other's. */
  markup(template: string): string;
  /** The template with every value printed as it is. */
  text(template: string): string;
  /**
   * The template read as inline markup (`**bold**`, `_italic_`, `[label]({{url}})`), every value escaped and
   * drawn as text inside the marks. A link passes the check `href` does; a refused one draws its label alone.
   * Markup that does not parse draws as the plain text it was written as.
   */
  inline(template: string): RenderedBlock;
  /** A link: the value of the one `url` variable `template` names, escaped for the html arm; empty otherwise. */
  href(template: string): RenderedBlock;
  /** The primitives a render draws with, filling each value through this context and checking each link. */
  readonly h: EmailPrimitives;
  /** A lane-holding block's lane, its blocks rendered through the same renderer; empty on any other type. */
  lane(index: number): readonly EmailNode[];
  /** How many lanes the stored block holds; 0 on a type that holds none. */
  readonly laneCount: number;
}

/** What a block's render reads: its attributes and its content, already read through its definition. */
export interface BlockView<Attributes, Content> {
  readonly id: string;
  readonly attributes: Attributes;
  readonly content: Content;
}

/**
 * What a render answers: primitives, which the renderer places in the block's own row and styles, or, as a
 * render written before there were primitives, the block's rows as HTML and its text, placed as written.
 */
export type BlockRendering = EmailNode | readonly EmailNode[] | RenderedBlock;

export type BlockRenderer<Attributes, Content> = (
  block: BlockView<Attributes, Content>,
  ctx: RenderContext,
) => BlockRendering;

/**
 * A block of this type as `checkEmailRenderer` renders it. A type that holds text names at least one variable
 * in its content, so the check can see that variable's value reach both arms.
 */
export interface BlockSample {
  readonly attributes: unknown;
  readonly content: unknown;
  readonly variableTypes: Readonly<Record<string, VariableType>>;
  readonly lanes?: readonly (readonly EmailBlock[])[];
}

/** One block type: what a write accepts, what a render reads, what a translation replaces, and how it draws. */
export interface BlockDefinition<Type extends string = string, Attributes = unknown, Content = unknown> {
  readonly type: Type;
  /** Strict: a key another type owns is refused. */
  readonly attributes: z.ZodType<Attributes>;
  /** Strict, for a write. */
  readonly content: z.ZodType<Content>;
  /** Lenient, for a render: what it cannot read degrades to empty and never throws. */
  readAttributes(raw: unknown): Attributes;
  readContent(raw: unknown): Content;
  readonly holdsText: boolean;
  /** Whether the block holds lanes of other blocks, one level deep. */
  readonly holdsLanes: boolean;
  /**
   * Whether the block is drawn at the card's whole width, which Outlook would push a lane past: the renderer
   * reports `block-nested-too-deep` for one in a lane and draws nothing of it.
   */
  readonly wide?: boolean;
  /**
   * How many lanes a lanes block takes. The renderer reports `lanes-count` for a stored block outside it and
   * draws no lane past `max`; without it, every stored lane is drawn.
   */
  readonly laneBounds?: { readonly min: number; readonly max: number };
  /** The content with each sentence replaced by `translateOne`'s answer; what is not a sentence is copied. */
  translate(content: Content, translateOne: (sentence: string) => Promise<string>): Promise<Content>;
  render(block: BlockView<Attributes, Content>, ctx: RenderContext): BlockRendering;
  readonly sample: BlockSample;
}

/** A block definition, its type literal kept, so a renderer composed with it knows the type by name. */
export function defineBlockType<const Type extends string, Attributes, Content>(
  definition: BlockDefinition<Type, Attributes, Content>,
): BlockDefinition<Type, Attributes, Content> {
  return definition;
}
