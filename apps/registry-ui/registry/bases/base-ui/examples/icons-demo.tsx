import { BrandMark } from '@zeroxsolutions/icons/brand-mark';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import type { ReactNode } from 'react';

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** A brand mark in three of its variants and a file-type icon, each beside the element that draws it. */
function IconsDemo(): ReactNode {
  return (
    <ItemGroup className="w-full max-w-sm">
      <Item>
        <ItemMedia>
          <BrandMark name="openai" variant="mono" size={24} label="OpenAI" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>OpenAI, in the text colour</ItemTitle>
          <ItemDescription>{'<BrandMark name="openai" variant="mono" size={24} label="OpenAI" />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <BrandMark name="gemini" size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Gemini, in its own colours</ItemTitle>
          <ItemDescription>{'<BrandMark name="gemini" size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <BrandMark name="claude" variant="avatar" size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Claude, as an avatar</ItemTitle>
          <ItemDescription>{'<BrandMark name="claude" variant="avatar" size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <TypescriptIcon size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>A TypeScript file</ItemTitle>
          <ItemDescription>{'<TypescriptIcon size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export { IconsDemo };
