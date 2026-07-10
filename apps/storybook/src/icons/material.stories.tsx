import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';

import { AngularIcon } from '@zeroxsolutions/icons/material/angular';
import { AstroIcon } from '@zeroxsolutions/icons/material/astro';
import { DockerIcon } from '@zeroxsolutions/icons/material/docker';
import { ElixirIcon } from '@zeroxsolutions/icons/material/elixir';
import { EsbuildIcon } from '@zeroxsolutions/icons/material/esbuild';
import { EslintIcon } from '@zeroxsolutions/icons/material/eslint';
import { FigmaIcon } from '@zeroxsolutions/icons/material/figma';
import { FirebaseIcon } from '@zeroxsolutions/icons/material/firebase';
import { GatsbyIcon } from '@zeroxsolutions/icons/material/gatsby';
import { GitIcon } from '@zeroxsolutions/icons/material/git';
import { GoIcon } from '@zeroxsolutions/icons/material/go';
import { GraphqlIcon } from '@zeroxsolutions/icons/material/graphql';
import { HaskellIcon } from '@zeroxsolutions/icons/material/haskell';
import { HtmlIcon } from '@zeroxsolutions/icons/material/html';
import { IonicIcon } from '@zeroxsolutions/icons/material/ionic';
import { JavaIcon } from '@zeroxsolutions/icons/material/java';
import { JavascriptIcon } from '@zeroxsolutions/icons/material/javascript';
import { JsonIcon } from '@zeroxsolutions/icons/material/json';
import { KotlinIcon } from '@zeroxsolutions/icons/material/kotlin';
import { LaravelIcon } from '@zeroxsolutions/icons/material/laravel';
import { LuaIcon } from '@zeroxsolutions/icons/material/lua';
import { MarkdownIcon } from '@zeroxsolutions/icons/material/markdown';
import { MavenIcon } from '@zeroxsolutions/icons/material/maven';
import { MermaidIcon } from '@zeroxsolutions/icons/material/mermaid';
import { NginxIcon } from '@zeroxsolutions/icons/material/nginx';
import { PdfIcon } from '@zeroxsolutions/icons/material/pdf';
import { PlaywrightIcon } from '@zeroxsolutions/icons/material/playwright';
import { PrettierIcon } from '@zeroxsolutions/icons/material/prettier';
import { PythonIcon } from '@zeroxsolutions/icons/material/python';
import { QwikIcon } from '@zeroxsolutions/icons/material/qwik';
import { ReactIcon } from '@zeroxsolutions/icons/material/react';
import { ReduxStoreIcon } from '@zeroxsolutions/icons/material/redux-store';
import { RustIcon } from '@zeroxsolutions/icons/material/rust';
import { SassIcon } from '@zeroxsolutions/icons/material/sass';
import { StorybookIcon } from '@zeroxsolutions/icons/material/storybook';
import { SvelteIcon } from '@zeroxsolutions/icons/material/svelte';
import { SwiftIcon } from '@zeroxsolutions/icons/material/swift';
import { TailwindcssIcon } from '@zeroxsolutions/icons/material/tailwindcss';
import { TerraformIcon } from '@zeroxsolutions/icons/material/terraform';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import { VimIcon } from '@zeroxsolutions/icons/material/vim';
import { VueIcon } from '@zeroxsolutions/icons/material/vue';
import { WebpackIcon } from '@zeroxsolutions/icons/material/webpack';
import { ZigIcon } from '@zeroxsolutions/icons/material/zig';

// .Light-bearing icons (a light-background theme variant exposed as a sub-component).
import { BunIcon } from '@zeroxsolutions/icons/material/bun';
import { DenoIcon } from '@zeroxsolutions/icons/material/deno';
import { NextIcon } from '@zeroxsolutions/icons/material/next';
import { PnpmIcon } from '@zeroxsolutions/icons/material/pnpm';
import { TurborepoIcon } from '@zeroxsolutions/icons/material/turborepo';
import { VercelIcon } from '@zeroxsolutions/icons/material/vercel';

type IconComponent = ComponentType<{ size?: string | number }>;

/**
 * A representative selection of the **587** file-type icons in the `material`
 * category — the MIT-licensed
 * [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
 * set. Each is a full-color component imported from its own subpath
 * (`@zeroxsolutions/icons/material/<name>`) and scaled by a single `size` prop;
 * colors are intrinsic. Icons that ship a light-background artwork expose it as a
 * `.Light` sub-component (see the *Light Variants* story).
 */
const meta: Meta = {
  title: 'Icons/Material',
};
export default meta;

type Story = StoryObj;

const showcase: [string, IconComponent][] = [
  ['typescript', TypescriptIcon],
  ['javascript', JavascriptIcon],
  ['react', ReactIcon],
  ['vue', VueIcon],
  ['angular', AngularIcon],
  ['svelte', SvelteIcon],
  ['astro', AstroIcon],
  ['python', PythonIcon],
  ['rust', RustIcon],
  ['go', GoIcon],
  ['java', JavaIcon],
  ['kotlin', KotlinIcon],
  ['swift', SwiftIcon],
  ['haskell', HaskellIcon],
  ['elixir', ElixirIcon],
  ['lua', LuaIcon],
  ['html', HtmlIcon],
  ['sass', SassIcon],
  ['tailwindcss', TailwindcssIcon],
  ['json', JsonIcon],
  ['markdown', MarkdownIcon],
  ['graphql', GraphqlIcon],
  ['docker', DockerIcon],
  ['terraform', TerraformIcon],
  ['nginx', NginxIcon],
  ['firebase', FirebaseIcon],
  ['git', GitIcon],
  ['maven', MavenIcon],
  ['gatsby', GatsbyIcon],
  ['ionic', IonicIcon],
  ['qwik', QwikIcon],
  ['redux-store', ReduxStoreIcon],
  ['webpack', WebpackIcon],
  ['esbuild', EsbuildIcon],
  ['eslint', EslintIcon],
  ['prettier', PrettierIcon],
  ['playwright', PlaywrightIcon],
  ['storybook', StorybookIcon],
  ['mermaid', MermaidIcon],
  ['figma', FigmaIcon],
  ['vim', VimIcon],
  ['zig', ZigIcon],
  ['pdf', PdfIcon],
];

const lightPairs: [string, IconComponent & { Light?: IconComponent }][] = [
  ['bun', BunIcon],
  ['deno', DenoIcon],
  ['next', NextIcon],
  ['vercel', VercelIcon],
  ['pnpm', PnpmIcon],
  ['turborepo', TurborepoIcon],
];

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 rounded-lg border p-3">
      <div className="flex h-8 items-center justify-center text-3xl">
        {children}
      </div>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/** A labelled grid of representative Material file icons. */
export const Overview: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {showcase.map(([name, Icon]) => (
        <Cell key={name} label={name}>
          <Icon size="1em" />
        </Cell>
      ))}
    </div>
  ),
};

/**
 * Icons that ship a light-background artwork expose it as `Icon.Light`. Default
 * on a dark surface, `.Light` on a light surface — each pair below shows both.
 */
export const LightVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {lightPairs.map(([name, Icon]) => (
        <div key={name} className="flex items-center gap-4">
          <span className="w-24 text-sm font-medium">{name}</span>
          <div className="flex w-28 flex-col items-center gap-1 rounded-lg bg-neutral-900 p-3">
            <span className="text-3xl">
              <Icon size="1em" />
            </span>
            <span className="text-xs text-neutral-400">default</span>
          </div>
          <div className="flex w-28 flex-col items-center gap-1 rounded-lg bg-neutral-100 p-3">
            <span className="text-3xl">
              {Icon.Light ? <Icon.Light size="1em" /> : <Icon size="1em" />}
            </span>
            <span className="text-xs text-neutral-500">.Light</span>
          </div>
        </div>
      ))}
    </div>
  ),
};
