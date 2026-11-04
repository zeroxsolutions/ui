import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants } from '@zeroxsolutions/ui/registry/bases/base-ui/ui/button';
import { nativeDocsRoute } from '@zeroxsolutions/native-ui-docs-web/routes';

/** What every unknown path under this zone's routes answers, with its 404. */
export default function NotFound(): ReactNode {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">No page is published at this address.</p>
      <Link href={nativeDocsRoute.build()} className={buttonVariants({ variant: 'outline' })}>
        Go to the native docs
      </Link>
    </main>
  );
}
