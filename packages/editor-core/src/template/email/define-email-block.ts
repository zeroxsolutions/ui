import { z } from 'zod';
import { parseInlineMarkup } from '../markup/inline-markup.js';
import type { VariableType } from '../variables/variable-type.js';
import type { BlockDefinition, EmailBlock, RenderContext } from './block.js';
import { MAX_LANES } from './blocks/columns.js';
import { defaultBlocks } from './blocks/index.js';
import { readOr } from './blocks/shared.js';
import type {
  ChoiceAttribute,
  EmailBlockAttribute,
  EmailBlockField,
  LanesField,
  NumberAttribute,
  ToggleAttribute,
} from './fields.js';
import type { EmailNode, EmailPrimitives } from './primitives/nodes.js';
import type { Region } from './region.js';

type FieldMap = Readonly<Record<string, EmailBlockField>>;
type AttributeMap = Readonly<Record<string, EmailBlockAttribute>>;

/** The names of `F`'s fields that hold text, every one but a lanes field. */
type TextFieldName<F extends FieldMap> = { [K in keyof F]: F[K] extends LanesField ? never : K }[keyof F];

/** A block's stored content: each text field's template. */
export type EmailBlockContent<F extends FieldMap> = { readonly [K in TextFieldName<F>]: string };

type AttributeValue<A extends EmailBlockAttribute> =
  A extends ChoiceAttribute<infer Value>
    ? Value
    : A extends ToggleAttribute
      ? boolean
      : A extends NumberAttribute
        ? number
        : never;

/** A block's attribute values, each its default where the stored block leaves it out. */
export type EmailBlockAttributes<A extends AttributeMap> = { readonly [K in keyof A]: AttributeValue<A[K]> };

/** What a render reads: each text field's template, which a primitive fills, and a lanes field's lanes, drawn. */
export type EmailBlockFields<F extends FieldMap> = {
  readonly [K in keyof F]: F[K] extends LanesField ? readonly (readonly EmailNode[])[] : string;
};

export interface EmailBlockView<F extends FieldMap, A extends AttributeMap> {
  readonly id: string;
  readonly fields: EmailBlockFields<F>;
  readonly attributes: EmailBlockAttributes<A>;
  /** Where the block renders, for a render that draws a region differently; a stylesheet can select it too. */
  readonly region: Region | 'body';
}

export interface EmailBlockOptions<Type extends string, F extends FieldMap, A extends AttributeMap> {
  /** The stored type: a lower-case letter, then letters and digits; none of the default types. */
  readonly type: Type;
  /** The block's name in the slash menu. */
  readonly label: string;
  /** Its line in the slash menu. */
  readonly description?: string;
  /** Terms the slash menu also finds it by. */
  readonly keywords?: readonly string[];
  readonly fields: F;
  readonly attributes?: A;
  /** The block as primitives; the renderer places it in the block's own row. */
  render(view: EmailBlockView<F, A>, h: EmailPrimitives, ctx: RenderContext): EmailNode | readonly EmailNode[];
  /** A block as `checkEmailRenderer` renders it: a type that holds text names a variable in its fields. */
  readonly sample: {
    readonly fields: EmailBlockContent<F>;
    readonly attributes?: Partial<EmailBlockAttributes<A>>;
    readonly variableTypes: Readonly<Record<string, VariableType>>;
    readonly lanes?: readonly (readonly EmailBlock[])[];
  };
}

/** One field of a product's block as the editor draws it, other than the body and the lanes. */
export interface EmailBlockEditorField {
  readonly name: string;
  readonly kind: 'plainText' | 'link' | 'imageUrl';
  readonly label: string;
  readonly max: number;
}

export type EmailBlockEditorAttribute =
  | {
      readonly name: string;
      readonly label: string;
      readonly kind: 'choice';
      readonly values: readonly { readonly value: string; readonly label: string }[];
      readonly default: string;
    }
  | { readonly name: string; readonly label: string; readonly kind: 'toggle'; readonly default: boolean }
  | {
      readonly name: string;
      readonly label: string;
      readonly kind: 'number';
      readonly min: number;
      readonly max: number;
      readonly default: number;
    };

/**
 * What an editor needs to offer a product's block, free of any editor engine: its node, the field its inline
 * content is, the fields and attributes it edits beside that, its lanes, and its slash menu entry.
 */
export interface EmailBlockEditor {
  readonly type: string;
  /** The editor node the block is, `email_<type>`. */
  readonly node: string;
  readonly label: string;
  readonly description: string;
  readonly keywords: readonly string[];
  /** The rich text field, edited as the node's inline content; null for a block with none. */
  readonly body: { readonly name: string; readonly label: string; readonly max: number } | null;
  readonly fields: readonly EmailBlockEditorField[];
  readonly lanes: { readonly name: string; readonly min: number; readonly max: number } | null;
  readonly attributes: readonly EmailBlockEditorAttribute[];
}

/** A product's block: the renderer's definition of its type, and the editor's description of it. */
export interface EmailBlockDefinition<
  Type extends string = string,
  F extends FieldMap = FieldMap,
  A extends AttributeMap = AttributeMap,
> extends BlockDefinition<Type, Partial<EmailBlockAttributes<A>>, EmailBlockContent<F>> {
  readonly editor: EmailBlockEditor;
}

/** A product block's definition the renderer and the editor cannot both read, named by `reason`. */
export class EmailBlockDefinitionInvalid extends Error {
  constructor(
    readonly type: string,
    readonly reason: string,
  ) {
    super(`Email block ${type}: ${reason}`);
    this.name = 'EmailBlockDefinitionInvalid';
  }
}

const TYPE = /^[a-z][a-zA-Z0-9]*$/;
const NAME = /^[a-zA-Z][a-zA-Z0-9]*$/;
/** The node attributes every email block node already carries. */
const RESERVED = new Set(['id', 'key', 'source']);

function capitalised(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** @throws {EmailBlockDefinitionInvalid} for the first part of `options` the renderer or the editor cannot read */
function assertOptions(options: EmailBlockOptions<string, FieldMap, AttributeMap>): void {
  const refuse = (reason: string): never => {
    throw new EmailBlockDefinitionInvalid(options.type, reason);
  };
  if (!TYPE.test(options.type)) refuse('the type must be a lower-case letter, then letters and digits');
  if (Object.hasOwn(defaultBlocks, options.type)) refuse('the type is a default block type');
  const fields = Object.entries(options.fields);
  const attributes = Object.entries(options.attributes ?? {});
  for (const [name] of [...fields, ...attributes]) {
    if (!NAME.test(name) || RESERVED.has(name)) refuse(`"${name}" cannot name a field or an attribute`);
    if (Object.hasOwn(options.fields, name) && Object.hasOwn(options.attributes ?? {}, name)) {
      refuse(`"${name}" names both a field and an attribute`);
    }
  }
  if (fields.filter(([, field]) => field.kind === 'richText').length > 1)
    refuse('it holds more than one rich text field');
  if (fields.filter(([, field]) => field.kind === 'lanes').length > 1) refuse('it holds more than one lanes field');
  // The editor node holds either the body's inline content or the lanes, never both.
  if (fields.some(([, field]) => field.kind === 'lanes') && fields.some(([, field]) => field.kind === 'richText')) {
    refuse('a lanes block holds no rich text field');
  }
  for (const [name, field] of fields) {
    if (field.kind === 'lanes' && field.max > MAX_LANES) refuse(`"${name}" holds at most ${MAX_LANES} lanes`);
    if (field.kind === 'lanes' && !(field.min >= 1 && field.min <= field.max))
      refuse(`"${name}" needs 1 <= min <= max`);
    if (field.kind !== 'lanes' && !(field.max >= 1)) refuse(`"${name}" needs a max of at least 1`);
  }
  for (const [name, attribute] of attributes) {
    if (attribute.kind === 'choice') {
      if (attribute.values.length === 0 || new Set(attribute.values).size !== attribute.values.length) {
        refuse(`"${name}" needs distinct values`);
      }
      if (!attribute.values.includes(attribute.default)) refuse(`"${name}" defaults to a value it does not offer`);
    }
    if (attribute.kind === 'number' && !(attribute.min <= attribute.default && attribute.default <= attribute.max)) {
      refuse(`"${name}" defaults outside its range`);
    }
  }
}

/** An address a link field may open with: a literal web or mail one, or a variable, whose type the profile checks. */
const LINK_START = /^(?:https?:\/\/|mailto:|\{\{)/i;
/** An address an image field may open with: a literal web one, or a variable. */
const IMAGE_START = /^(?:https?:\/\/|\{\{)/i;

/**
 * The body holds text, as a paragraph does; another field may be left empty, as the editor exports it while the
 * author has not filled it.
 */
function textSchema(field: Exclude<EmailBlockField, LanesField>): z.ZodType<string> {
  if (field.kind === 'richText') {
    // Refused where it is saved rather than drawn as a literal `**`.
    return z
      .string()
      .min(1)
      .max(field.max)
      .refine((value) => parseInlineMarkup(value).ok, { message: 'malformed inline markup' });
  }
  const line = z
    .string()
    .max(field.max)
    .refine((value) => !/[\r\n]/.test(value), { message: 'one line' });
  if (field.kind === 'plainText') return line;
  const start = field.kind === 'link' ? LINK_START : IMAGE_START;
  return line.refine((value) => value === '' || start.test(value.trim()), { message: 'an address a client opens' });
}

function attributeSchema(attribute: EmailBlockAttribute): z.ZodType<string | boolean | number> {
  if (attribute.kind === 'choice') return z.enum(attribute.values as [string, ...string[]]);
  if (attribute.kind === 'toggle') return z.boolean();
  return z.number().min(attribute.min).max(attribute.max);
}

function editorOf(options: EmailBlockOptions<string, FieldMap, AttributeMap>): EmailBlockEditor {
  const fields = Object.entries(options.fields);
  const body = fields.find(([, field]) => field.kind === 'richText');
  const lanesField = fields.find(([, field]) => field.kind === 'lanes');
  return {
    type: options.type,
    node: `email_${options.type}`,
    label: options.label,
    description: options.description ?? '',
    keywords: options.keywords ?? [],
    body:
      body === undefined
        ? null
        : { name: body[0], label: body[1].label ?? capitalised(body[0]), max: (body[1] as { max: number }).max },
    fields: fields.flatMap(([name, field]) =>
      field.kind === 'plainText' || field.kind === 'link' || field.kind === 'imageUrl'
        ? [{ name, kind: field.kind, label: field.label ?? capitalised(name), max: field.max }]
        : [],
    ),
    lanes:
      lanesField === undefined || lanesField[1].kind !== 'lanes'
        ? null
        : { name: lanesField[0], min: lanesField[1].min, max: lanesField[1].max },
    attributes: Object.entries(options.attributes ?? {}).map(([name, attribute]): EmailBlockEditorAttribute => {
      const label = attribute.label ?? capitalised(name);
      if (attribute.kind === 'choice') {
        return {
          name,
          label,
          kind: 'choice',
          default: attribute.default,
          values: attribute.values.map((value) => ({
            value,
            label:
              (attribute.valueLabels as Partial<Record<string, string>> | undefined)?.[value] ?? capitalised(value),
          })),
        };
      }
      if (attribute.kind === 'toggle') return { name, label, kind: 'toggle', default: attribute.default };
      return { name, label, kind: 'number', min: attribute.min, max: attribute.max, default: attribute.default };
    }),
  };
}

/**
 * A product's own email block from one definition: the renderer's strict and lenient reads, what it
 * translates, its render over primitives and its sample, and the description an editor builds its node, its
 * slash item and its block menu from. Hand it to `createEmailRenderer`'s `extraBlocks` and to the editor.
 *
 * @throws {EmailBlockDefinitionInvalid} for a type that is not a lower-case word or is a default type, a field or
 * attribute named `id`, `key` or `source` or named twice, two rich text or two lanes fields, lanes beside rich text,
 * or a default outside its attribute's values
 */
export function defineEmailBlock<
  const Type extends string,
  const F extends FieldMap,
  const A extends AttributeMap = Record<never, never>,
>(options: EmailBlockOptions<Type, F, A>): EmailBlockDefinition<Type, F, A> {
  assertOptions(options as unknown as EmailBlockOptions<string, FieldMap, AttributeMap>);
  const fields = Object.entries(options.fields);
  const textFields = fields.filter(
    (entry): entry is [string, Exclude<EmailBlockField, LanesField>] => entry[1].kind !== 'lanes',
  );
  const lanesEntry = fields.find((entry): entry is [string, LanesField] => entry[1].kind === 'lanes');
  const lanesName = lanesEntry?.[0];
  const attributes = Object.entries(options.attributes ?? {});

  // The schemas are built from the field and attribute maps at run time, so zod infers no more than a record;
  // each is asserted to the shape the maps' types spell where it is handed out.
  type Content = EmailBlockContent<F>;
  type Stored = Partial<EmailBlockAttributes<A>>;
  const content = z.object(Object.fromEntries(textFields.map(([name, field]) => [name, textSchema(field)]))).strict();
  const lenientContent = z.object(Object.fromEntries(textFields.map(([name]) => [name, z.string().catch('')])));
  const emptyContent = Object.fromEntries(textFields.map(([name]) => [name, ''])) as Content;
  const stored = z
    .object(Object.fromEntries(attributes.map(([name, attribute]) => [name, attributeSchema(attribute).optional()])))
    .strict();
  const lenientStored = z.object(
    Object.fromEntries(
      attributes.map(([name, attribute]) => [name, attributeSchema(attribute).optional().catch(undefined)]),
    ),
  );
  const defaults = Object.fromEntries(attributes.map(([name, attribute]) => [name, attribute.default]));

  return {
    type: options.type,
    attributes: stored as unknown as z.ZodType<Stored>,
    content: content as unknown as z.ZodType<Content>,
    readAttributes: (raw) => readOr(lenientStored as unknown as z.ZodType<Stored>, raw, {} as Stored),
    readContent: (raw) => readOr(lenientContent as unknown as z.ZodType<Content>, raw, emptyContent),
    holdsText: textFields.some(([, field]) => field.kind === 'richText' || field.kind === 'plainText'),
    holdsLanes: lanesName !== undefined,
    async translate(source, translateOne) {
      const translated: Record<string, string> = { ...source };
      // In order rather than at once: a provider limits translations per minute.
      for (const [name, field] of textFields) {
        if (field.kind === 'richText' || field.kind === 'plainText') {
          translated[name] = await translateOne((source as Record<string, string>)[name]);
        }
      }
      return translated as Content;
    },
    render(block, ctx) {
      const given = Object.fromEntries(Object.entries(block.attributes).filter(([, value]) => value !== undefined));
      const drawnLanes =
        lanesEntry === undefined
          ? {}
          : {
              [lanesEntry[0]]: Array.from({ length: Math.min(ctx.laneCount, lanesEntry[1].max) }, (_lane, index) =>
                ctx.lane(index),
              ),
            };
      return options.render(
        {
          id: block.id,
          fields: { ...block.content, ...drawnLanes } as unknown as EmailBlockFields<F>,
          attributes: { ...defaults, ...given } as EmailBlockAttributes<A>,
          region: ctx.region,
        },
        ctx.h,
        ctx,
      );
    },
    sample: {
      attributes: options.sample.attributes ?? {},
      content: options.sample.fields,
      variableTypes: options.sample.variableTypes,
      ...(options.sample.lanes === undefined ? {} : { lanes: options.sample.lanes }),
    },
    editor: editorOf(options as unknown as EmailBlockOptions<string, FieldMap, AttributeMap>),
  };
}
