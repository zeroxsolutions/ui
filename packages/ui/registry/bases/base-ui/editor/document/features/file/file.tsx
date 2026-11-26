import type { ReactNode } from 'react';
import { useAnimatedIcon } from '@/registry/bases/base-ui/hooks/use-animated-icon';
import { FileTextIcon } from '@/registry/bases/base-ui/icons/lucide/file-text-icon';
import { file as fileBlock, FILE_SIZE_MAX, fileSizeText } from '@zeroxsolutions/editor-core/blocks/library/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';
import { BlockAddressField } from '../../blocks/block-address-field';
import { linkAddress } from '../../blocks/block-address';
import {
  blockUploadRequest,
  uploadMessagesOf,
  uploadsExtension,
  UploadStatus,
  UploadTabs,
  useBlockUpload,
  type BlockUploadOptions,
  type UploadRequest,
  type UploadTaker,
} from '../../uploads/index';

export interface FileOptions extends BlockUploadOptions {
  /** The empty file block's field: its name and its placeholder. Default: `File link` and `Paste a file link`. */
  words?: { readonly field?: string; readonly placeholder?: string };
}

type FileViewProps = BlockViewPropsOf<typeof fileBlock>;

/** The address of a file block an upload fills. */
const FILE_SLOT = 'href';

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
  name,
  size,
  href,
  editable,
  dimmed = false,
}: {
  name: string;
  size: number;
  href: string | undefined;
  editable: boolean;
  /** Drawn faint, as a file still uploading is, and linking nowhere. */
  dimmed?: boolean;
}): ReactNode {
  const icon = useAnimatedIcon();
  const sizeText = fileSizeText(size);
  return (
    <a
      data-slot="file"
      data-dimmed={dimmed || undefined}
      href={href}
      download
      contentEditable={false}
      // In the editor a press selects the block; the Viewer's reader downloads the file.
      onClick={editable ? (event) => event.preventDefault() : undefined}
      {...icon.handlers}
      className="cn-editor-block not-prose hover:bg-muted/50 my-2 flex items-center gap-2 px-2 py-1.5 text-inherit no-underline transition-colors data-dimmed:opacity-50"
    >
      <FileTextIcon ref={icon.ref} aria-hidden size={18} className="text-muted-foreground shrink-0" />
      <span data-slot="file-name" className="min-w-0 truncate text-sm">
        {name}
      </span>
      {sizeText !== '' && (
        <span data-slot="file-size" className="text-muted-foreground shrink-0 text-xs">
          {sizeText}
        </span>
      )}
    </a>
  );
}

/**
 * The file block: a file to download, drawn as a row with its icon, name and size. Given `upload`, the empty block
 * uploads a file beside taking a link, and a file pasted or dropped into the editor that no other block takes
 * becomes a file block that uploads it; the file's name and size fill the block's.
 */
export function file(options: FileOptions = {}): EditorFeature {
  const field = options.words?.field ?? 'File link';
  const placeholder = options.words?.placeholder ?? 'Paste a file link';
  const requestOf = (): UploadRequest | null =>
    blockUploadRequest(options, {
      accept: '',
      preview: false,
      land: (_attrs, url, uploaded) => ({
        href: url,
        name: uploaded.name,
        size: Math.min(uploaded.size, FILE_SIZE_MAX),
      }),
    });

  function FileView({ fields, attributes, editable, update, place }: FileViewProps): ReactNode {
    const upload = useBlockUpload(place, FILE_SLOT, requestOf());
    const entry = upload?.entry ?? null;
    if (upload && entry) {
      const messages = uploadMessagesOf(options.messages);
      return (
        <div data-slot="file-upload" contentEditable={false} className="not-prose my-2 flex flex-col gap-1">
          <FileRow name={entry.file.name} size={entry.file.size} href={undefined} editable dimmed />
          <UploadStatus
            entry={entry}
            messages={messages}
            onCancel={upload.cancel}
            onRetry={upload.retry}
            readOnly={!editable}
          />
        </div>
      );
    }
    if (fields.href !== '') {
      return (
        <FileRow
          name={fields.name === '' ? fields.href : fields.name}
          size={attributes.size}
          href={linkAddress(fields.href)}
          editable={editable}
        />
      );
    }
    if (!editable) return null;
    return (
      <div data-slot="file-source" contentEditable={false} className="not-prose my-2">
        <UploadTabs upload={upload} messages={uploadMessagesOf(options.messages)}>
          <BlockAddressField
            label={field}
            placeholder={placeholder}
            className="my-0"
            onCommit={(href) => update({ href, ...(fields.name === '' ? { name: nameOf(href) } : {}) })}
          />
        </UploadTabs>
      </div>
    );
  }

  const feature = blockFeature(fileBlock, { view: FileView, icon: FileTextIcon });
  if (!options.upload) return feature;
  const taker: UploadTaker = {
    accept: '',
    slot: FILE_SLOT,
    node: (engine) => engine.schema.nodes[fileBlock.editor.node]?.create() ?? null,
    request: () => requestOf() as UploadRequest,
  };
  return { ...feature, advanced: { engineExtensions: [uploadsExtension('file', taker)] } };
}
