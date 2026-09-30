import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { docsRoute } from '@/routes/app-routes';

/** What every unknown path answers, with its 404: a docs path the content lacks and any other. */
export default function NotFound(): ReactNode {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">No page is published at this address.</p>
      <Link href={docsRoute.build()} className={buttonVariants({ variant: 'outline' })}>
        Go to the docs
      </Link>
    </main>
  );
}
