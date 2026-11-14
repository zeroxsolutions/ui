import type { ReactNode } from 'react';

import {
  ComponentPreview,
  ComponentPreviewCaption,
  ComponentPreviewStage,
} from '@zeroxsolutions/ui/site/components/data-display/component-preview';
import { RegistryExample } from '@zeroxsolutions/ui/site/components/data-display/registry-example';
import { HomePageCode } from '@zeroxsolutions/ui/site/components/data-display/home-page-code';
import { HomeGrid } from '@zeroxsolutions/ui/site/components/general/home-grid';
import { HomeShader } from '@zeroxsolutions/ui/site/components/general/home-shader';
import { HostLink } from '@zeroxsolutions/ui/site/components/navigation/host-link';
import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import { buttonVariants } from '@zeroxsolutions/ui/registry/bases/base-ui/ui/button';

import registryData from '@zeroxsolutions/ui/registry.json';

import { publishedItems } from '../lib/published-items';
import { componentRoute, componentsRoute, docsPageRoute } from '../routes';

/** The items the home page shows live, by registry name; each renders its `<name>-demo`. */
const HOME_ITEMS = ['chat-message', 'code-card', 'file-tree', 'tag-input', 'password-input', 'status-indicator'];

/** The item the home page shows live across its full width, under its own heading. */
const HOME_FEATURED_ITEM = 'ai-provider-picker';

/** The shadcn CLI command that installs one registry item through the app's `@zui` registry entry. */
function homePageInstallCommand(name: string): string {
  return `pnpm dlx shadcn@latest add @zui/${name}`;
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
  {
    title: 'Add the @zui registry to components.json',
    language: 'json',
    code: '"registries": {\n  "@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"\n}',
  },
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

interface HomePageProps {
  /** `href`, a docs URL a route built, where the docs have a page there; `undefined` where none is written yet. */
  writtenDocsPage(href: string): string | undefined;
}

/**
 * The registry's home page: the hero, a few components live, one wide component live, and how an item installs.
 * Throws where a docs page it links to is not written, so the link fails the build.
 */
function HomePage({ writtenDocsPage }: HomePageProps): ReactNode {
  const docsPageHref = (href: string): string => {
    const written = writtenDocsPage(href);
    if (!written) throw new Error(`HomePage: no docs page at "${href}"`);
    return written;
  };
  const items = HOME_ITEMS.map((name) => {
    const item = publishedItems.find((entry) => entry.name === name);
    if (!item) throw new Error(`HomePage: "${name}" is not a published item`);
    return { ...item, url: writtenDocsPage(componentRoute.build({ base: DEFAULT_COMPONENT_BASE, name })) };
  });
  const featured = publishedItems.find((entry) => entry.name === HOME_FEATURED_ITEM);
  if (!featured) throw new Error(`HomePage: "${HOME_FEATURED_ITEM}" is not a published item`);

  return (
    <div className="flex flex-col gap-24 pb-24">
      <section className="relative isolate">
        <HomeShader />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
          <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards text-4xl font-semibold tracking-tight text-balance delay-0 duration-200 ease-out motion-reduce:animate-none">
            Composed React components for shadcn, on Base UI.
          </h1>
          <p className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards text-muted-foreground text-lg text-pretty delay-75 duration-200 ease-out motion-reduce:animate-none">
            Add the @zui registry to components.json, then install any item with the shadcn CLI. The code it writes is
            yours.
          </p>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex flex-wrap justify-center gap-3 delay-150 duration-200 ease-out motion-reduce:animate-none">
            <HostLink
              href={docsPageHref(componentsRoute.build({ base: DEFAULT_COMPONENT_BASE }))}
              className={buttonVariants()}
            >
              Browse components
            </HostLink>
            <HostLink
              href={docsPageHref(docsPageRoute.build({ slug: 'installation' }))}
              className={buttonVariants({ variant: 'outline' })}
            >
              Get started
            </HostLink>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards w-full text-left delay-200 duration-200 ease-out motion-reduce:animate-none">
            <HomePageCode code={homePageInstallCommand('status-indicator')} language="bash" />
          </div>
        </div>
      </section>

      <section aria-labelledby="home-items" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <h2 id="home-items" className="text-2xl font-semibold tracking-tight">
          Components
        </h2>
        <HomeGrid>
          {items.map((item) => (
            <ComponentPreview key={item.name}>
              <ComponentPreviewStage>
                <RegistryExample name={`${item.name}-demo`} />
              </ComponentPreviewStage>
              <ComponentPreviewCaption>
                {item.url ? (
                  <HostLink href={item.url} className="underline underline-offset-4">
                    {item.title}
                  </HostLink>
                ) : (
                  <span>{item.title}</span>
                )}
              </ComponentPreviewCaption>
            </ComponentPreview>
          ))}
        </HomeGrid>
      </section>

      <section aria-labelledby="home-featured" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="home-featured" className="text-2xl font-semibold tracking-tight">
            {featured.title}
          </h2>
          <HostLink
            href={docsPageHref(componentRoute.build({ base: DEFAULT_COMPONENT_BASE, name: featured.name }))}
            className={buttonVariants({ variant: 'link' })}
          >
            See the component
          </HostLink>
        </div>
        <ComponentPreview>
          <ComponentPreviewStage className="h-auto">
            <RegistryExample name={`${featured.name}-demo`} />
          </ComponentPreviewStage>
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

export { HomePage };
