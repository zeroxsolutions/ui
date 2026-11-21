import { EditorError, type NodeSpec } from '@zeroxsolutions/editor-core/document/core/index';
import { emailNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';

/** The attributes every email block view draws itself from; each is absent on a block that does not carry it. */
export interface EmailBlockStyle {
  align?: 'left' | 'center' | 'right' | null;
  spaceAfter?: 'small' | 'medium' | 'large' | null;
}

const ALIGN_CLASSES = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;
const JUSTIFY_CLASSES = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const;
const SPACE_CLASSES = { small: 'mb-2', medium: 'mb-4', large: 'mb-8' } as const;

/** The classes an email block's `align` and `spaceAfter` read as; `medium` is the house default space. */
export function blockClasses({ align, spaceAfter }: EmailBlockStyle): string {
  return [align ? ALIGN_CLASSES[align] : '', SPACE_CLASSES[spaceAfter ?? 'medium']].join(' ').trim();
}

/** Where a block's own row places its content under `align`. */
export function justifyClass(align: EmailBlockStyle['align']): string {
  return JUSTIFY_CLASSES[align ?? 'left'];
}

/** The email profile's spec for `name`, so a view keeps the name and attributes the codecs read. */
export function emailSpec(name: string): NodeSpec {
  const spec = emailNodeSpecs.nodes.find((node) => node.name === name);
  if (!spec) {
    throw new EditorError('editor.email.no_node_spec', `The email profile declares no "${name}" node`);
  }
  return spec;
}
