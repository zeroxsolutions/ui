import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ComponentPreview, ComponentPreviewCaption } from '@/components/data-display/component-preview';
import { DEFAULT_NATIVE_ENGINE } from '@/constants/native-engines';
import { canonicalNativeComponentsSource } from '@/lib/native-source';
import { registryHomepage } from '@/lib/registry';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { nativeComponentsRoute, nativeDocsPageRoute } from '@/routes/app-routes';

import { HomePageCode } from '../_components/data-display/home-page-code';
import { HomeGrid } from '../_components/general/home-grid';
import { HomeShader } from '../_components/general/home-shader';
import { EngineTab, EngineTabs } from './_components/data-display/engine-tabs';
import { NativePreviewFrame } from './_components/data-display/native-preview-frame';
import { NativeRegistryEntry } from './_components/data-display/native-registry-entry';
import { NativeEngineLink } from './_components/navigation/native-engine-link';

export const metadata: Metadata = {
  title: 'Native',
  description: 'Composed React Native components for shadcn, on NativeWind or Uniwind.',
};

/** The components the native home page draws live, by registry name; each draws its `<name>-demo`. */
const NATIVE_HOME_ITEMS = ['button', 'card', 'input-otp', 'switch', 'password-input', 'tab-bar'];

/** The item the hero and the install steps add. */
const NATIVE_HOME_INSTALL_ITEM = 'password-input';

const NATIVE_HOME_INSTALL_COMMAND = `pnpm dlx shadcn@latest add @zui/${NATIVE_HOME_INSTALL_ITEM}`;

export default function NativeHomePage(): ReactNode {
  const items = NATIVE_HOME_ITEMS.map((name) => {
    const page = canonicalNativeComponentsSource.getPage([name]);
    if (!page) throw new Error(`NativeHomePage: "${name}" has no native component page`);
    return { name, title: page.data.title, url: page.url };
  });

  return (
    <div className="flex flex-col gap-24 pb-24">
      <section className="relative isolate">
        <HomeShader />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
          <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards text-4xl font-semibold tracking-tight text-balance delay-0 duration-200 ease-out motion-reduce:animate-none">
            Composed React Native components for shadcn, on NativeWind or Uniwind.
          </h1>
          <p className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards text-muted-foreground text-lg text-pretty delay-75 duration-200 ease-out motion-reduce:animate-none">
            Add the @zui registry to your Expo app&apos;s components.json, then install any item with the shadcn CLI.
            The code it writes is yours.
          </p>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex flex-wrap justify-center gap-3 delay-150 duration-200 ease-out motion-reduce:animate-none">
            <NativeEngineLink
              href={nativeComponentsRoute.build({
                engine: DEFAULT_NATIVE_ENGINE,
              })}
              className={buttonVariants()}
            >
              Browse components
            </NativeEngineLink>
            <NativeEngineLink
              href={nativeDocsPageRoute.build({ slug: 'installation' })}
              className={buttonVariants({ variant: 'outline' })}
            >
              Get started
            </NativeEngineLink>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards w-full text-left delay-200 duration-200 ease-out motion-reduce:animate-none">
            <HomePageCode code={NATIVE_HOME_INSTALL_COMMAND} language="bash" />
          </div>
        </div>
      </section>

      <section aria-labelledby="native-home-items" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <h2 id="native-home-items" className="text-2xl font-semibold tracking-tight">
          Components
        </h2>
        <HomeGrid>
          {items.map((item) => (
            <ComponentPreview key={item.name} className="h-full">
              {/* Takes the row's height, so every caption in a row sits on one line. */}
              <div className="flex-1">
                <NativePreviewFrame engine={DEFAULT_NATIVE_ENGINE} demo={`${item.name}-demo`} />
              </div>
              <ComponentPreviewCaption>
                <NativeEngineLink href={item.url} className="underline underline-offset-4">
                  {item.title}
                </NativeEngineLink>
              </ComponentPreviewCaption>
            </ComponentPreview>
          ))}
        </HomeGrid>
      </section>

      <section aria-labelledby="native-home-install" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6">
        <h2 id="native-home-install" className="text-2xl font-semibold tracking-tight">
          How it installs
        </h2>
        <ol className="flex flex-col gap-6">
          <li className="flex flex-col gap-3">
            <h3 className="font-medium">1. Add the @zui registry to components.json</h3>
            <EngineTabs>
              <EngineTab engine="nativewind">
                <NativeRegistryEntry engine="nativewind" origin={registryHomepage} />
              </EngineTab>
              <EngineTab engine="uniwind">
                <NativeRegistryEntry engine="uniwind" origin={registryHomepage} />
              </EngineTab>
            </EngineTabs>
          </li>
          <li className="flex flex-col gap-3">
            <h3 className="font-medium">2. Add an item with the shadcn CLI</h3>
            <HomePageCode code={NATIVE_HOME_INSTALL_COMMAND} language="bash" />
          </li>
          <li className="flex flex-col gap-3">
            <h3 className="font-medium">3. The CLI writes it into your app</h3>
            <HomePageCode code="components/data-entry/password-input.tsx" language="text" />
          </li>
          <li className="flex flex-col gap-3">
            <h3 className="font-medium">4. Import it and compose</h3>
            <HomePageCode
              code={[
                "import { PasswordInput, PasswordInputInput, PasswordInputToggle } from '@/components/data-entry/password-input';",
                "import { InputGroupAddon } from '@/components/ui/input-group';",
                '',
                '<PasswordInput>',
                '  <PasswordInputInput aria-label="Password" autoComplete="current-password" />',
                '  <InputGroupAddon align="inline-end">',
                '    <PasswordInputToggle />',
                '  </InputGroupAddon>',
                '</PasswordInput>',
              ].join('\n')}
              language="tsx"
            />
          </li>
        </ol>
      </section>
    </div>
  );
}
