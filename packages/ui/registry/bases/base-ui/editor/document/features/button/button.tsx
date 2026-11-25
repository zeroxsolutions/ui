import { useId, type ReactNode } from 'react';
import { z } from 'zod';
import { MousePointerClickIcon } from '@/registry/bases/base-ui/icons/lucide/mouse-pointer-click-icon';
import { Button, buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { buttonNodeSpec } from '@zeroxsolutions/editor-core/profiles/index';
import type { ReactNodeCodec } from '../../../react-types';
import { blockClasses, justifyClass, type BlockStyle } from './block-style';

interface ButtonAttrs extends BlockStyle {
  label?: string | null;
  href?: string | null;
  width?: 'inline' | 'full' | null;
}

/** What a host's own label field is handed: the label, where to send an edit, and whether it may change. */
export interface ButtonLabelFieldProps {
  value: string;
  onValueChange(value: string): void;
  readOnly: boolean;
  editor: IEditor;
}

export interface ButtonOptions {
  /** The label's field inside the button; a plain text field when absent. The email editor's holds variables. */
  labelField?: (props: ButtonLabelFieldProps) => ReactNode;
  /** Whether the view offers a field for the link. Default true; the email editor sets a link in its own popover. */
  linkField?: boolean;
}

/** An address a reader's browser opens as a page or a mail; anything else, a script's included, links nowhere. */
const OPENED = /^(?:https?:|mailto:)/i;

function openedHref(href: string | null | undefined): string | null {
  const trimmed = (href ?? '').trim();
  return OPENED.test(trimmed) ? trimmed : null;
}

const escapedHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The label as Markdown text on one line: each character Markdown reads as syntax, an autolink's or raw HTML's
 * `<` among them, is escaped, and a line break, which could open a block, is a space.
 */
const escapedMarkdown = (value: string): string =>
  value.replace(/\s+/g, ' ').replace(/[\\`*_{}[\]()#+\-.!<>|~&]/g, (character) => `\\${character}`);

/** The stored label as text; a stored value of another kind draws as no label. */
const labelOf = (attrs: ButtonAttrs): string => (typeof attrs.label === 'string' ? attrs.label : '');

const ALIGNS = ['left', 'center', 'right'] as const;
const SPACES = ['small', 'medium', 'large'] as const;
const WIDTHS = ['inline', 'full'] as const;

function oneOf<const T extends string>(values: readonly T[], value: string | null): T | undefined {
  return values.find((candidate) => candidate === value);
}

/** The frame the view and the Viewer share: the block's row, and the button drawn in the design system's look. */
function ButtonShell({ attrs, children }: { attrs: ButtonAttrs; children: ReactNode }) {
  return (
    <div
      data-slot="link-button"
      data-width={attrs.width ?? 'inline'}
      className={cn('flex items-center gap-2', justifyClass(attrs.align), blockClasses(attrs))}
    >
      {children}
    </div>
  );
}

function ButtonLinkPopover({ href, onHrefChange }: { href: string; onHrefChange(href: string): void }) {
  const id = useId();
  return (
    // Stopping the pointer keeps opening the popover from moving the editor's selection mid-edit.
    <span onMouseDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <Popover>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              Link
            </Button>
          }
        />
        <PopoverContent align="start" className="w-72 gap-3">
          <Field>
            <FieldLabel htmlFor={id}>Link</FieldLabel>
            <Input
              id={id}
              type="url"
              placeholder="https://"
              defaultValue={href}
              onBlur={(event) => onHrefChange(event.target.value.trim())}
            />
          </Field>
        </PopoverContent>
      </Popover>
    </span>
  );
}

function buttonView(options: ButtonOptions) {
  return function ButtonView({ attrs, updateAttrs, editable, editor }: NodeViewProps<ButtonAttrs>) {
    const label = labelOf(attrs);
    const onValueChange = (value: string) => updateAttrs({ label: value });
    return (
      <ButtonShell attrs={attrs}>
        <div
          contentEditable={false}
          className={cn(buttonVariants({ variant: 'default' }), attrs.width === 'full' && 'w-full')}
        >
          {options.labelField ? (
            options.labelField({ value: label, onValueChange, readOnly: !editable, editor })
          ) : (
            <input
              aria-label="Button label"
              placeholder="Button label"
              value={label}
              readOnly={!editable}
              onChange={(event) => onValueChange(event.target.value)}
              className="field-sizing-content min-w-16 bg-transparent text-center outline-none placeholder:text-current/60"
            />
          )}
        </div>
        {editable && options.linkField !== false && (
          <ButtonLinkPopover href={attrs.href ?? ''} onHrefChange={(href) => updateAttrs({ href })} />
        )}
      </ButtonShell>
    );
  };
}

const buttonCodec: ReactNodeCodec<ButtonAttrs> = {
  node: 'button',
  toHTML: (node) => {
    const attrs = node.attrs ?? {};
    const data = (['align', 'width'] as const)
      .filter((name) => attrs[name])
      .map((name) => ` data-${name}="${escapedHtml(String(attrs[name]))}"`)
      .join('');
    const space = attrs.spaceAfter ? ` data-space-after="${escapedHtml(attrs.spaceAfter)}"` : '';
    const href = openedHref(attrs.href);
    const link = href === null ? '<a>' : `<a href="${escapedHtml(href)}">`;
    return `<div data-button${data}${space}>${link}${escapedHtml(labelOf(attrs))}</a></div>`;
  },
  toMarkdown: (node) => {
    const label = escapedMarkdown(labelOf(node.attrs ?? {}));
    const href = openedHref(node.attrs?.href);
    if (href === null) return label;
    // A space, a bracket, a parenthesis or a backslash would end the destination early, or escape its end.
    const destination = href.replace(
      /[\s()<>\\]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
    );
    return `[${label}](${destination})`;
  },
  toReact: (node) => {
    const attrs = node.attrs ?? {};
    const href = openedHref(attrs.href);
    const look = cn(buttonVariants({ variant: 'default' }), attrs.width === 'full' && 'w-full');
    return (
      <ButtonShell attrs={attrs}>
        {href === null ? (
          <span className={look}>{labelOf(attrs)}</span>
        ) : (
          <a href={href} className={look}>
            {labelOf(attrs)}
          </a>
        )}
      </ButtonShell>
    );
  },
  fromHTML: (element) => {
    if (!element.hasAttribute('data-button')) return null;
    const link = element.querySelector('a');
    const attrs = {
      label: (link ?? element).textContent ?? '',
      href: openedHref(link?.getAttribute('href')) ?? undefined,
      align: oneOf(ALIGNS, element.getAttribute('data-align')),
      width: oneOf(WIDTHS, element.getAttribute('data-width')),
      spaceAfter: oneOf(SPACES, element.getAttribute('data-space-after')),
    };
    return {
      type: 'button',
      attrs: Object.fromEntries(Object.entries(attrs).filter(([, value]) => value !== undefined)),
    };
  },
  // A `[label](href)` line reads back as a paragraph's link; HTML is the button's two-way path.
  fromMarkdown: () => null,
};

/**
 * A link drawn as a button: its label edited in place, its link in a popover. HTML keeps it whole; Markdown
 * writes it as a link on its own line, which reads back as a paragraph. A link a browser would not open as a
 * page or a mail, `javascript:` among them, is never written into HTML, Markdown or the Viewer.
 */
export function button(options: ButtonOptions = {}): EditorFeature {
  return defineFeature({
    id: 'button',
    nodes: [{ ...buttonNodeSpec, render: buttonView(options) }],
    codecs: [buttonCodec as NodeCodec],
    commands: {
      insertButton: {
        args: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'button',
              ...(args?.label === undefined && args?.href === undefined
                ? {}
                : { attrs: { label: args.label ?? '', href: args.href ?? '' } }),
            },
          }),
      },
    },
    slash: [
      {
        id: 'button',
        icon: MousePointerClickIcon,
        title: 'Button',
        description: 'A link drawn as a button',
        group: 'Blocks',
        keywords: ['button', 'cta', 'link'],
        command: 'insertButton',
      },
    ],
  });
}
