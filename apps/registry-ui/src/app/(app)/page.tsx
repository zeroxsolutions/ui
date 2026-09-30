import Link from 'next/link';
import type { ReactNode } from 'react';

import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import { registryHomepage } from '@/lib/registry';
import { docsPageUrl } from '@/lib/source';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { blocksRoute } from '@/routes/app-routes';

const INSTALL = `pnpm dlx shadcn@latest add ${new URL('/r/status-indicator.json', registryHomepage).href}`;

export default function HomePage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">ZeroXSolutions UI</h1>
        <p className="text-muted-foreground text-lg">
          Composed Base UI components and blocks, published as a shadcn registry. Each item is built from shadcn&apos;s
          own primitives, and the shadcn CLI installs it from its URL.
        </p>
      </header>
      {/* Shown plain: this page is no MDX, so `rehypeDocsCode` never highlights it, and one command reads as well unhighlighted. */}
      <SourceCodeBlock code={INSTALL} language="bash" lines={null} />
      <div className="flex flex-wrap gap-3">
        <Link href={docsPageUrl(['components'])} className={buttonVariants()}>
          Browse components
        </Link>
        <Link href={blocksRoute.build()} className={buttonVariants({ variant: 'outline' })}>
          See the blocks
        </Link>
      </div>
    </div>
  );
}
