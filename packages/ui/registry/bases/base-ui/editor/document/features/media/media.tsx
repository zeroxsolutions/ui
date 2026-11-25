import { useId, type ReactNode } from 'react';
import { AudioLinesIcon } from '@/registry/bases/base-ui/icons/lucide/audio-lines-icon';
import { ClapperboardIcon } from '@/registry/bases/base-ui/icons/lucide/clapperboard-icon';
import { media as mediaBlock } from '@zeroxsolutions/editor-core/blocks/library/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';
import { BlockAddressField } from '../../blocks/block-address-field';
import { sourceAddress } from '../../blocks/block-address';

export interface MediaOptions {
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

/** The video and audio block: a player with its controls, and a caption under it. */
export function media(options: MediaOptions = {}): EditorFeature {
  const words = {
    videoField: options.words?.videoField ?? 'Video link',
    videoPlaceholder: options.words?.videoPlaceholder ?? 'Paste a video link',
    audioField: options.words?.audioField ?? 'Audio link',
    audioPlaceholder: options.words?.audioPlaceholder ?? 'Paste an audio link',
    caption: options.words?.caption ?? 'Add a caption',
  };

  function MediaView({ fields, attributes, editable, update }: MediaViewProps): ReactNode {
    const audio = attributes.kind === 'audio';
    if (fields.src === '') {
      if (!editable) return null;
      return (
        <BlockAddressField
          label={audio ? words.audioField : words.videoField}
          placeholder={audio ? words.audioPlaceholder : words.videoPlaceholder}
          onCommit={(src) => update({ src })}
        />
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
  return {
    ...feature,
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
