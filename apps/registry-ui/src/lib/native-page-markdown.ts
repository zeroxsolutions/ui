import { asMarkdown } from 'fumadocs-core/server';
import { Children, isValidElement, type ReactNode } from 'react';

import { DEFAULT_NATIVE_ENGINE, NATIVE_ENGINE_LABELS } from '@/constants/native-engines';
import { nativeComponentsJson, nativeInstallCommands } from '@/lib/native-install';
import type { nativeDocsSource } from '@/lib/native-source';
import { pageMarkdownDocument } from '@/lib/page-markdown';
import { withNativeEngine } from '@/lib/platform-nav';
import { registryHomepage } from '@/lib/registry';
import type { NativeEngine } from '@/types/native-engine';
import type { PlatformStyle } from '@/types/platform';

/** What a native page's Markdown is rendered for: the engine its path names, absent on a docs page, and the style. */
export interface NativeMarkdownOf {
  engine?: NativeEngine;
  style: PlatformStyle<'native'>;
}

type NativeDocsPage = NonNullable<ReturnType<typeof nativeDocsSource.getPage>>;

/** A native docs or component page, as far as its Markdown reads it; every native collection compiles its Markdown alike. */
export interface NativeMarkdownPage {
  url: string;
  data: Pick<NativeDocsPage['data'], 'title' | 'getText'>;
}

interface EngineTabProps {
  engine: NativeEngine;
  children?: ReactNode;
}

/** A Markdown link to a native component page, its href captured. */
const NATIVE_COMPONENT_LINK = /\]\((\/native\/components\/[^)\s]*)\)/g;

/**
 * The Markdown form of each MDX component a page in `content/native` uses, as `nativeMdxComponents`
 * renders it to HTML for the same `engine`. Each one calls `asMarkdown()`, without which
 * `renderToMarkdown` prints the component back as its JSX.
 */
function nativeMarkdownComponents({ engine, style }: NativeMarkdownOf) {
  const install = { engine: engine ?? DEFAULT_NATIVE_ENGINE, style, origin: registryHomepage };

  return {
    EngineTab: ({ children }: EngineTabProps): ReactNode => {
      asMarkdown();
      return children;
    },
    // Read under an engine, only its part; on a docs page, every engine's part under its name.
    EngineTabs: ({ children }: { children?: ReactNode }): ReactNode => {
      asMarkdown();
      const panels = Children.toArray(children).flatMap((child) =>
        isValidElement<EngineTabProps>(child) && child.props.engine ? [child.props] : [],
      );
      if (engine) return ['\n', panels.find((panel) => panel.engine === engine)?.children, '\n\n'];
      return panels.map((panel) => [`\n**${NATIVE_ENGINE_LABELS[panel.engine]}**\n\n`, panel.children, '\n\n']);
    },
    InstallCommand: ({ name }: { name: string }): ReactNode => {
      asMarkdown();
      const commands = nativeInstallCommands(name, install);
      return [
        `\n\`\`\`bash\n${commands.registry}\n\`\`\`\n\n`,
        'Or by its URL, for an app without the `@zui` entry in `components.json`:\n\n',
        `\`\`\`bash\n${commands.url}\n\`\`\`\n\n`,
      ];
    },
    ComponentsJson: (props: { engine: NativeEngine }): ReactNode => {
      asMarkdown();
      return `\n\`\`\`json title="components.json"\n${nativeComponentsJson({ ...install, engine: props.engine })}\n\`\`\`\n\n`;
    },
    // `code` is the demo's source, which `remarkNativeDemoSource` gives the element as the page compiles.
    NativePreview: ({ name, code }: { name: string; code?: string }): ReactNode => {
      asMarkdown();
      if (code === undefined) throw new Error(`NativePreview: "${name}" has no source; only a native page reads it`);
      return `\n\`\`\`tsx title="${name}.tsx"\n${code}\n\`\`\`\n\n`;
    },
  };
}

/**
 * A native page as Markdown, for Copy page, its `.md` URL and `llms.txt`: its title and URL over its
 * body with each MDX component in its Markdown form for `of`, and, read under an engine, its links to
 * other component pages moved onto that engine. Throws for a `NativePreview` whose page compiled
 * without its demo's source.
 */
export async function nativePageMarkdown(page: NativeMarkdownPage, of: NativeMarkdownOf): Promise<string> {
  const markdown = pageMarkdownDocument(
    page,
    await page.data.getText('processed', { components: nativeMarkdownComponents(of) }),
  );
  const { engine } = of;
  if (!engine) return markdown;
  return markdown.replace(NATIVE_COMPONENT_LINK, (_link, href: string) => `](${withNativeEngine(href, engine)})`);
}
