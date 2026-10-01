import Link from 'next/link';
import type { ReactNode } from 'react';

import { HomeShader } from './_components/general/home-shader';
import { BlockFrame } from '@/components/data-display/block-frame';
import {
  ComponentPreview,
  ComponentPreviewCaption,
  ComponentPreviewStage,
} from '@/components/data-display/component-preview';
import { RegistryExample } from '@/components/data-display/registry-example';
import {
  SourceCodeBlock,
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';
import { publishedBlocks, publishedItems, registryHomepage } from '@/lib/registry';
import { docsPageUrl, source } from '@/lib/source';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { blocksRoute } from '@/routes/app-routes';

import registryData from '../../../registry.json';

/** The items the home page shows live, by registry name; each renders its `<name>-demo`. */
const HOME_ITEMS = ['chat-message', 'code-block', 'file-tree', 'tag-input', 'password-input', 'status-indicator'];

/** The shadcn CLI command that installs one registry item from its URL. */
function homePageInstallCommand(name: string): string {
  return `pnpm dlx shadcn@latest add ${new URL(`/r/${name}.json`, registryHomepage).href}`;
}

/** The paths an item's files land at in a consuming app. A component keeps its path below the
 * source prefix; the CLI writes a `registry:lib` file into the app's `lib` alias by its file name,
 * as the item's manual install step says. */
function homePageInstallFilePaths(name: string): string[] {
  const item = registryData.items.find((entry) => entry.name === name);
  if (!item) throw new Error(`HomePage: "${name}" is not in registry.json`);
  return item.files.map((file) =>
    file.type === 'registry:lib'
      ? `lib/${file.path.split('/').at(-1)}`
      : file.path.replace('registry/bases/base-ui/', ''),
  );
}

const INSTALL_STEPS = [
  { title: 'Add an item with the shadcn CLI', language: 'bash', code: homePageInstallCommand('status-indicator') },
  {
    title: 'The CLI writes it into your app',
    language: 'text',
    code: homePageInstallFilePaths('status-indicator').join('\n'),
  },
  {
    title: 'Import it and compose',
    language: 'tsx',
    code: 'import { StatusIndicator } from \'@/components/feedback/status-indicator\';\n\n<div className="flex items-center gap-2">\n  <StatusIndicator tone="online" />\n  <span>Online</span>\n</div>',
  },
];

/** A short source block: its language, a copy button and the code, which the block highlights itself
 * on the client, as the Code Block demo above it does (this page is no MDX). */
function HomePageCode({ code, language }: { code: string; language: string }): ReactNode {
  return (
    <SourceCodeBlock code={code} language={language}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
        </SourceCodeBlockTitle>
        <SourceCodeBlockActions>
          <SourceCodeBlockCopy />
        </SourceCodeBlockActions>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </SourceCodeBlock>
  );
}

export default function HomePage(): ReactNode {
  const items = HOME_ITEMS.map((name) => {
    const item = publishedItems.find((entry) => entry.name === name);
    if (!item) throw new Error(`HomePage: "${name}" is not a published item`);
    const page = source.getPage(['components', name]);
    return { ...item, url: page?.url };
  });
  const block = publishedBlocks.find((entry) => entry.name === 'ai-provider-picker');
  if (!block) throw new Error('HomePage: "ai-provider-picker" is not a published block');

  return (
    <div className="flex flex-col gap-24 pb-24">
      <section className="relative isolate">
        <HomeShader />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Composed React components for shadcn, on Base UI.
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Install any item with the shadcn CLI from its URL. The code it writes is yours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={docsPageUrl(['components'])} className={buttonVariants()}>
              Browse components
            </Link>
            <Link href={docsPageUrl(['installation'])} className={buttonVariants({ variant: 'outline' })}>
              Get started
            </Link>
          </div>
          <div className="w-full text-left">
            <HomePageCode code={homePageInstallCommand('status-indicator')} language="bash" />
          </div>
        </div>
      </section>

      <section aria-labelledby="home-items" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <h2 id="home-items" className="text-2xl font-semibold tracking-tight">
          Components
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ComponentPreview key={item.name}>
              <ComponentPreviewStage>
                <RegistryExample name={`${item.name}-demo`} />
              </ComponentPreviewStage>
              <ComponentPreviewCaption>
                {item.url ? (
                  <Link href={item.url} className="underline underline-offset-4">
                    {item.title}
                  </Link>
                ) : (
                  <span>{item.title}</span>
                )}
              </ComponentPreviewCaption>
            </ComponentPreview>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-blocks" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="home-blocks" className="text-2xl font-semibold tracking-tight">
            Blocks
          </h2>
          <Link href={blocksRoute.build()} className={buttonVariants({ variant: 'link' })}>
            See the blocks
          </Link>
        </div>
        <ComponentPreview>
          <BlockFrame name={block.name} title={block.title} />
        </ComponentPreview>
      </section>

      <section aria-labelledby="home-install" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6">
        <h2 id="home-install" className="text-2xl font-semibold tracking-tight">
          How it installs
        </h2>
        <ol className="flex flex-col gap-6">
          {INSTALL_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <h3 className="font-medium">
                {index + 1}. {step.title}
              </h3>
              <HomePageCode code={step.code} language={step.language} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
