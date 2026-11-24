import { useEffect, useRef, type ReactNode } from 'react';
import { BookmarkIcon } from '@/registry/bases/base-ui/icons/lucide/bookmark-icon';
import { bookmark as bookmarkBlock } from '@zeroxsolutions/editor-core/blocks/library/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';
import { BlockAddressField } from '../../blocks/block-address-field';
import { linkAddress, sourceAddress } from '../../blocks/block-address';

/** What the host read from a linked page; a part it could not read is left out or empty. */
export interface LinkPreview {
  readonly title?: string;
  readonly description?: string;
  readonly image?: string;
}

export interface BookmarkOptions {
  /**
   * Reads a page's preview when the author gives a bookmark its address, once; the bookmark shows the address
   * alone until it answers, and keeps showing it when it throws. A call that reaches the page goes through the
   * host, which decides what it may fetch.
   */
  readLink?(url: string): Promise<LinkPreview>;
  /** The empty bookmark's field: its name and its placeholder. Default: `Link` and `Paste a link`. */
  words?: { readonly field?: string; readonly placeholder?: string };
}

type BookmarkViewProps = BlockViewPropsOf<typeof bookmarkBlock>;

/** The card a bookmark draws once it has an address, the same in the editor and the Viewer. */
function BookmarkCard({ fields, editable }: Pick<BookmarkViewProps, 'fields' | 'editable'>): ReactNode {
  const href = linkAddress(fields.url);
  const image = sourceAddress(fields.image);
  return (
    <a
      data-slot="bookmark"
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      contentEditable={false}
      // In the editor a press selects the block; the Viewer's reader follows the link.
      onClick={editable ? (event) => event.preventDefault() : undefined}
      className="cn-editor-block not-prose hover:bg-muted/50 my-4 flex overflow-hidden border text-inherit no-underline transition-colors"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <span data-slot="bookmark-title" className="truncate text-sm font-medium">
          {fields.title === '' ? fields.url : fields.title}
        </span>
        {fields.description !== '' && (
          <span data-slot="bookmark-description" className="text-muted-foreground line-clamp-2 text-xs">
            {fields.description}
          </span>
        )}
        <span data-slot="bookmark-url" className="text-muted-foreground truncate text-xs">
          {fields.url}
        </span>
      </span>
      {image !== undefined && (
        <img
          data-slot="bookmark-image"
          src={image}
          alt=""
          className="hidden w-1/3 max-w-60 shrink-0 border-l object-cover sm:block"
        />
      )}
    </a>
  );
}

/**
 * The bookmark block: a link drawn as a card with the page's title, description and image, which `readLink`
 * reads when the author pastes the address.
 */
export function bookmark(options: BookmarkOptions = {}): EditorFeature {
  const { readLink } = options;
  const field = options.words?.field ?? 'Link';
  const placeholder = options.words?.placeholder ?? 'Paste a link';

  function BookmarkView({ fields, editable, update }: BookmarkViewProps): ReactNode {
    const mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);
    if (fields.url !== '') return <BookmarkCard fields={fields} editable={editable} />;
    if (!editable) return null;
    const read = async (url: string): Promise<void> => {
      if (readLink === undefined || linkAddress(url) === undefined) return;
      try {
        const preview = await readLink(url);
        if (!mounted.current) return;
        update({
          title: preview.title?.trim() ?? '',
          description: preview.description?.trim() ?? '',
          image: sourceAddress(preview.image ?? '') ?? '',
        });
      } catch {
        // A page the host could not read keeps the bookmark showing its address.
      }
    };
    return (
      <BlockAddressField
        label={field}
        placeholder={placeholder}
        onCommit={(url) => {
          update({ url });
          void read(url);
        }}
      />
    );
  }

  return blockFeature(bookmarkBlock, { view: BookmarkView, icon: BookmarkIcon });
}
