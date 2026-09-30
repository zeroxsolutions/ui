import { ClaudeMark } from '@zeroxsolutions/icons/brands/claude';
import { GeminiMark } from '@zeroxsolutions/icons/brands/gemini';
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import type { ReactNode } from 'react';

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** A brand mark in three of its variants and a file-type icon, each beside the element that draws it. */
function IconsDemo(): ReactNode {
  return (
    <ItemGroup className="w-full max-w-sm">
      <Item>
        <ItemMedia>
          <OpenaiMark size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>OpenAI, the base mark</ItemTitle>
          <ItemDescription>{'<OpenaiMark size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <GeminiMark.Color size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Gemini, in colour</ItemTitle>
          <ItemDescription>{'<GeminiMark.Color size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <ClaudeMark.Avatar size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Claude, as an avatar</ItemTitle>
          <ItemDescription>{'<ClaudeMark.Avatar size={24} />'}</ItemDescription>
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
