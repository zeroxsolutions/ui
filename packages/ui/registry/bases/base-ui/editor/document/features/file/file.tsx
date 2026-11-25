import type { ReactNode } from 'react';
import { useAnimatedIcon } from '@/registry/bases/base-ui/hooks/use-animated-icon';
import { FileTextIcon } from '@/registry/bases/base-ui/icons/lucide/file-text-icon';
import { file as fileBlock, fileSizeText } from '@zeroxsolutions/editor-core/blocks/library/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';
import { BlockAddressField } from '../../blocks/block-address-field';
import { linkAddress } from '../../blocks/block-address';

export interface FileOptions {
  /** The empty file block's field: its name and its placeholder. Default: `File link` and `Paste a file link`. */
  words?: { readonly field?: string; readonly placeholder?: string };
}

type FileViewProps = BlockViewPropsOf<typeof fileBlock>;

/** The name a file at `href` goes by: the last part of its path, read as text, or the address itself. */
function nameOf(href: string): string {
  try {
    const last = new URL(href).pathname.split('/').filter(Boolean).at(-1);
    return last === undefined ? href : decodeURIComponent(last);
  } catch {
    return href;
  }
}

/** A file's row: its icon, its name and its size, the whole row the link that downloads it. */
function FileRow({
  fields,
  attributes,
  editable,
}: Pick<FileViewProps, 'fields' | 'attributes' | 'editable'>): ReactNode {
  const icon = useAnimatedIcon();
  const size = fileSizeText(attributes.size);
  return (
    <a
      data-slot="file"
      href={linkAddress(fields.href)}
      download
      contentEditable={false}
      // In the editor a press selects the block; the Viewer's reader downloads the file.
      onClick={editable ? (event) => event.preventDefault() : undefined}
      {...icon.handlers}
      className="cn-editor-block not-prose hover:bg-muted/50 my-2 flex items-center gap-2 px-2 py-1.5 text-inherit no-underline transition-colors"
    >
      <FileTextIcon ref={icon.ref} aria-hidden size={18} className="text-muted-foreground shrink-0" />
      <span data-slot="file-name" className="min-w-0 truncate text-sm">
        {fields.name === '' ? fields.href : fields.name}
      </span>
      {size !== '' && (
        <span data-slot="file-size" className="text-muted-foreground shrink-0 text-xs">
          {size}
        </span>
      )}
    </a>
  );
}

/** The file block: a file to download, drawn as a row with its icon, name and size. */
export function file(options: FileOptions = {}): EditorFeature {
  const field = options.words?.field ?? 'File link';
  const placeholder = options.words?.placeholder ?? 'Paste a file link';

  function FileView({ fields, attributes, editable, update }: FileViewProps): ReactNode {
    if (fields.href !== '') return <FileRow fields={fields} attributes={attributes} editable={editable} />;
    if (!editable) return null;
    return (
      <BlockAddressField
        label={field}
        placeholder={placeholder}
        onCommit={(href) => update({ href, ...(fields.name === '' ? { name: nameOf(href) } : {}) })}
      />
    );
  }

  return blockFeature(fileBlock, { view: FileView, icon: FileTextIcon });
}
