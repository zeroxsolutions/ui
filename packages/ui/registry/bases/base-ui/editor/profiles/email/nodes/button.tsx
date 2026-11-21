import { MousePointerClickIcon } from '@/registry/bases/base-ui/icons/lucide/mouse-pointer-click-icon';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { selectBlockOf } from '../kit-context';
import { UrlVariablePicker, type DeclarationSource } from '../url-variable-picker';
import { blockClasses, emailSpec, justifyClass, type EmailBlockStyle } from './block-style';

interface EmailButtonAttrs extends EmailBlockStyle {
  label?: string | null;
  href?: string | null;
  width?: 'inline' | 'full' | null;
}

const HREF_TOKEN = /^\{\{(\w+)\}\}$/;

export const emailButtonSlashItem: SlashItem = {
  id: 'email-button',
  title: 'Button',
  description: 'A button that opens a link variable',
  icon: MousePointerClickIcon,
  group: 'Email',
  keywords: ['button', 'cta', 'link'],
  command: 'insertEmailBlock',
  args: { kind: 'button' },
};

/**
 * The button block. Its label is an attribute, edited in a field, so it carries no mark; its href is chosen
 * from the `url` variables only.
 */
export function emailButtonNode(declarations: DeclarationSource): NodeSpec {
  function EmailButtonView({ attrs, updateAttrs, editable, editor }: NodeViewProps<EmailButtonAttrs>) {
    const variable = HREF_TOKEN.exec(attrs.href ?? '')?.[1] ?? attrs.href ?? null;
    const full = attrs.width === 'full';
    return (
      <div
        data-slot="email-button"
        data-width={attrs.width ?? 'inline'}
        contentEditable={false}
        // Its fields take the focus without moving the selection; the block menu acts on the selected block.
        onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
        className={cn('flex flex-col gap-2', blockClasses(attrs))}
      >
        <div className={cn('flex', justifyClass(attrs.align))}>
          <span className={cn(buttonVariants({ variant: 'default' }), full && 'w-full')}>
            <input
              aria-label="Button label"
              placeholder="Button label"
              value={attrs.label ?? ''}
              readOnly={!editable}
              onChange={(event) => updateAttrs({ label: event.target.value })}
              className="field-sizing-content min-w-16 bg-transparent text-center outline-none placeholder:text-current/60"
            />
          </span>
        </div>
        <div className={cn('flex', justifyClass(attrs.align))}>
          <UrlVariablePicker
            declarations={declarations}
            value={variable}
            label="Button link"
            disabled={!editable}
            onValueChange={(name) => updateAttrs({ href: `{{${name}}}` })}
          />
        </div>
      </div>
    );
  }
  return { ...emailSpec('emailButton'), render: EmailButtonView };
}
