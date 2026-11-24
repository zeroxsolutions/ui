/**
 * The kinds of field and attribute a product's own email block declares. A field holds text the author writes,
 * stored in the block's content; an attribute holds a choice the author makes, stored in its attributes.
 */
import { BLOCK_TEXT_MAX_LENGTH, BUTTON_HREF_MAX_LENGTH } from './blocks/shared.js';

interface Labelled {
  /** The name the editor shows; the field's own name, capitalised, when absent. */
  readonly label?: string;
}

/** Inline markup with variables: the block's editable body. A block holds at most one. */
export interface RichTextField extends Labelled {
  readonly kind: 'richText';
  readonly max: number;
}

interface Requirable {
  /** Whether a write refuses the field empty or left out; false when absent. */
  readonly required?: boolean;
}

/** One line of plain text with variables. */
export interface PlainTextField extends Labelled {
  readonly kind: 'plainText';
  readonly max: number;
  readonly required: boolean;
}

/** A link: a literal `https:`, `http:` or `mailto:` address, or one that opens with a url variable. */
export interface LinkField extends Labelled {
  readonly kind: 'link';
  readonly max: number;
  readonly required: boolean;
}

/** An image's address: `https:` or `http:`, or a url variable. */
export interface ImageUrlField extends Labelled {
  readonly kind: 'imageUrl';
  readonly max: number;
  readonly required: boolean;
}

/** A field one item of an items field holds. */
export type ItemField = PlainTextField | LinkField | ImageUrlField;

/** The most items an items field holds. */
export const ITEMS_MAX = 20;

/** A list of like items, each holding the same plain, link and image fields, as a row of social links does. */
export interface ItemsField<
  Fields extends Readonly<Record<string, ItemField>> = Readonly<Record<string, ItemField>>,
> extends Labelled {
  readonly kind: 'items';
  readonly fields: Fields;
  readonly min: number;
  readonly max: number;
}

/** Lanes of other blocks side by side, as a columns block holds them. A block holds at most one. */
export interface LanesField extends Labelled {
  readonly kind: 'lanes';
  readonly min: number;
  readonly max: number;
}

export type EmailBlockField = RichTextField | PlainTextField | LinkField | ImageUrlField | LanesField | ItemsField;

/** `max` counts the stored string, markers included; at most 5000. */
export function richText(options: { readonly max?: number } & Labelled = {}): RichTextField {
  return { kind: 'richText', max: options.max ?? BLOCK_TEXT_MAX_LENGTH, ...labelOf(options) };
}

/** `max` is in characters; at most 5000. */
export function plainText(options: { readonly max?: number } & Labelled & Requirable = {}): PlainTextField {
  return {
    kind: 'plainText',
    max: options.max ?? BLOCK_TEXT_MAX_LENGTH,
    required: options.required ?? false,
    ...labelOf(options),
  };
}

export function link(options: Labelled & Requirable = {}): LinkField {
  return { kind: 'link', max: BUTTON_HREF_MAX_LENGTH, required: options.required ?? false, ...labelOf(options) };
}

export function imageUrl(options: Labelled & Requirable = {}): ImageUrlField {
  return { kind: 'imageUrl', max: BUTTON_HREF_MAX_LENGTH, required: options.required ?? false, ...labelOf(options) };
}

/** `min` defaults to 0; `0 <= min <= max <= ITEMS_MAX`. Each item is stored as an object of `fields`' text. */
export function items<const Fields extends Readonly<Record<string, ItemField>>>(
  options: { readonly fields: Fields; readonly min?: number; readonly max: number } & Labelled,
): ItemsField<Fields> {
  return { kind: 'items', fields: options.fields, min: options.min ?? 0, max: options.max, ...labelOf(options) };
}

/** `min` at least 1, `max` at most 4. */
export function lanes(options: { readonly min: number; readonly max: number } & Labelled): LanesField {
  return { kind: 'lanes', min: options.min, max: options.max, ...labelOf(options) };
}

/** One of `values`; `valueLabels` names each in the editor, the value capitalised where absent. */
export interface ChoiceAttribute<Value extends string = string> extends Labelled {
  readonly kind: 'choice';
  readonly values: readonly Value[];
  readonly default: Value;
  readonly valueLabels?: Readonly<Partial<Record<Value, string>>>;
}

export interface ToggleAttribute extends Labelled {
  readonly kind: 'toggle';
  readonly default: boolean;
}

export interface NumberAttribute extends Labelled {
  readonly kind: 'number';
  readonly min: number;
  readonly max: number;
  readonly default: number;
}

export type EmailBlockAttribute = ChoiceAttribute | ToggleAttribute | NumberAttribute;

export function choice<const Value extends string>(
  values: readonly Value[],
  defaultValue: Value,
  options: Labelled & { readonly valueLabels?: Readonly<Partial<Record<Value, string>>> } = {},
): ChoiceAttribute<Value> {
  return {
    kind: 'choice',
    values,
    default: defaultValue,
    ...labelOf(options),
    ...(options.valueLabels === undefined ? {} : { valueLabels: options.valueLabels }),
  };
}

export function toggle(defaultValue: boolean, options: Labelled = {}): ToggleAttribute {
  return { kind: 'toggle', default: defaultValue, ...labelOf(options) };
}

export function number(
  options: { readonly min: number; readonly max: number; readonly default: number } & Labelled,
): NumberAttribute {
  return { kind: 'number', min: options.min, max: options.max, default: options.default, ...labelOf(options) };
}

function labelOf(options: Labelled): Labelled {
  return options.label === undefined ? {} : { label: options.label };
}
