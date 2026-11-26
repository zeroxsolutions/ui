import { useId, type ReactNode } from 'react';
import { AudioLinesIcon } from '@/registry/bases/base-ui/icons/lucide/audio-lines-icon';
import { ClapperboardIcon } from '@/registry/bases/base-ui/icons/lucide/clapperboard-icon';
import { media as mediaBlock } from '@zeroxsolutions/editor-core/blocks/library/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';
import { BlockAddressField } from '../../blocks/block-address-field';
import { sourceAddress } from '../../blocks/block-address';
import { fileSizeText } from '@zeroxsolutions/editor-core/blocks/library/index';
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

export interface MediaOptions extends BlockUploadOptions {
  /** The host's words for the empty block's field and the caption's. */
  words?: {
    readonly videoField?: string;
    readonly videoPlaceholder?: string;
    readonly audioField?: string;
    readonly audioPlaceholder?: string;
    readonly caption?: string;
  };
}

type MediaViewProps = BlockViewPropsOf<typeof mediaBlock>;

/** The address of a media block an upload fills. */
const MEDIA_SLOT = 'src';

/** The files a media block of `kind` takes. */
const acceptOf = (kind: string): string => (kind === 'audio' ? 'audio/*' : 'video/*');

/** The caption under the player: its text in the Viewer, a field the author writes it in in the editor. */
function MediaCaption({
  caption,
  editable,
  label,
  update,
}: {
  caption: string;
  editable: boolean;
  label: string;
  update: MediaViewProps['update'];
}): ReactNode {
  const id = useId();
  if (!editable) {
    return caption === '' ? null : (
      <figcaption data-slot="media-caption" className="text-muted-foreground mt-2 text-center text-sm">
        {caption}
      </figcaption>
    );
  }
  return (
    <figcaption data-slot="media-caption" className="mt-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        value={caption}
        placeholder={label}
        onChange={(event) => update({ caption: event.currentTarget.value })}
        className="text-muted-foreground placeholder:text-muted-foreground/60 w-full bg-transparent text-center text-sm outline-none"
      />
    </figcaption>
  );
}

/**
 * The video and audio block: a player with its controls, and a caption under it. Given `upload`, the empty block
 * uploads a video or a sound beside taking a link, and a video or audio file pasted or dropped into the editor
 * becomes a media block of its kind that uploads it.
 */
export function media(options: MediaOptions = {}): EditorFeature {
  const words = {
    videoField: options.words?.videoField ?? 'Video link',
    videoPlaceholder: options.words?.videoPlaceholder ?? 'Paste a video link',
    audioField: options.words?.audioField ?? 'Audio link',
    audioPlaceholder: options.words?.audioPlaceholder ?? 'Paste an audio link',
    caption: options.words?.caption ?? 'Add a caption',
  };

  const requestOf = (kind: string): UploadRequest | null =>
    blockUploadRequest(options, { accept: acceptOf(kind), preview: false, land: (_attrs, url) => ({ src: url }) });

  function MediaView({ fields, attributes, editable, update, place }: MediaViewProps): ReactNode {
    const audio = attributes.kind === 'audio';
    const upload = useBlockUpload(editable ? place : null, MEDIA_SLOT, requestOf(attributes.kind));
    const entry = upload?.entry ?? null;
    const messages = uploadMessagesOf(options.messages);
    if (upload && entry) {
      return (
        <figure data-slot="media-upload" contentEditable={false} className="not-prose my-4 flex flex-col gap-2">
          <div className="cn-editor-block bg-muted flex items-center justify-center gap-2 px-3 py-6 text-sm opacity-50">
            {audio ? <AudioLinesIcon size={18} aria-hidden /> : <ClapperboardIcon size={18} aria-hidden />}
            <span className="min-w-0 truncate">{entry.file.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs">{fileSizeText(entry.file.size)}</span>
          </div>
          <UploadStatus entry={entry} messages={messages} onCancel={upload.cancel} onRetry={upload.retry} />
        </figure>
      );
    }
    if (fields.src === '') {
      if (!editable) return null;
      return (
        <div data-slot="media-source" contentEditable={false} className="not-prose my-2">
          <UploadTabs upload={upload} messages={messages}>
            <BlockAddressField
              label={audio ? words.audioField : words.videoField}
              placeholder={audio ? words.audioPlaceholder : words.videoPlaceholder}
              className="my-0"
              onCommit={(src) => update({ src })}
            />
          </UploadTabs>
        </div>
      );
    }
    const src = sourceAddress(fields.src);
    return (
      <figure data-slot="media" data-kind={attributes.kind} contentEditable={false} className="not-prose my-4">
        {audio ? (
          <audio controls preload="metadata" src={src} className="w-full" />
        ) : (
          <video
            controls
            preload="metadata"
            src={src}
            poster={sourceAddress(fields.poster)}
            className="cn-editor-block aspect-video w-full bg-black"
          />
        )}
        <MediaCaption caption={fields.caption} editable={editable} label={words.caption} update={update} />
      </figure>
    );
  }

  const feature = blockFeature(mediaBlock, { view: MediaView, icon: ClapperboardIcon, insert: { kind: 'video' } });
  const taker: UploadTaker = {
    accept: 'video/*,audio/*',
    slot: MEDIA_SLOT,
    node: (engine, file) =>
      engine.schema.nodes[mediaBlock.editor.node]?.create({
        kind: file.type.startsWith('audio/') ? 'audio' : 'video',
      }) ?? null,
    request: (file) => requestOf(file.type.startsWith('audio/') ? 'audio' : 'video') as UploadRequest,
  };
  return {
    ...feature,
    ...(options.upload ? { advanced: { engineExtensions: [uploadsExtension('media', taker)] } } : {}),
    slash: [
      ...(feature.slash ?? []),
      {
        id: 'block-media-audio',
        title: 'Audio',
        description: 'An audio player',
        icon: AudioLinesIcon,
        group: 'Blocks',
        keywords: ['audio', 'sound', 'music', 'podcast', 'media'],
        command: 'insertBlock:media',
        args: { attributes: { kind: 'audio' } },
      },
    ],
  };
}
