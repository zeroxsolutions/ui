'use client';

import type { ReactNode } from 'react';
import { SPACER_HEIGHTS } from '@zeroxsolutions/editor-core/template/email/index';
import type { EmailBlockViewProps } from './email-block-feature';

type SpacerHeight = keyof typeof SPACER_HEIGHTS;

/**
 * A spacer in the email editor: the gap at the height the email draws it, outlined and labelled with its size
 * only while the pointer rests on it or it is selected. Its size is set in the block menu.
 */
export function EmailSpacerView({ block, values, editor, words, messages }: EmailBlockViewProps): ReactNode {
  const attribute = block.attributes.find((candidate) => candidate.name === 'height');
  const height: SpacerHeight =
    typeof values.height === 'string' && Object.hasOwn(SPACER_HEIGHTS, values.height)
      ? (values.height as SpacerHeight)
      : attribute?.kind === 'choice' && Object.hasOwn(SPACER_HEIGHTS, attribute.default)
        ? (attribute.default as SpacerHeight)
        : 'medium';
  const label =
    attribute?.kind === 'choice'
      ? words.value('height', height, attribute.values.find(({ value }) => value === height)?.label ?? height)
      : height;
  const px = SPACER_HEIGHTS[height];
  return (
    <div
      contentEditable={false}
      data-slot="email-spacer"
      data-height={height}
      style={{ height: px }}
      className="group/spacer group-hover/email-block:outline-border [.ProseMirror-selectednode_&]:outline-ring relative outline-1 -outline-offset-1 outline-transparent outline-dashed"
    >
      {editor && (
        <span className="bg-background text-muted-foreground pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 px-1 text-[0.625rem] leading-none opacity-0 group-hover/email-block:opacity-100 [.ProseMirror-selectednode_&]:opacity-100">
          {messages.spacerSize(label, px)}
        </span>
      )}
    </div>
  );
}
