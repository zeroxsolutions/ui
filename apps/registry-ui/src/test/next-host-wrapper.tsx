import { HostProvider } from '@zeroxsolutions/ui/host';
import type { ReactNode } from 'react';

import { useNextHost } from '@/providers/next-host';

/**
 * The host `AppProviders` hands the site components, for a spec rendering one. The spec mocks
 * `next/navigation`, `useRouter` included, since the host reads the router as it renders.
 */
function NextHostWrapper({ children }: { children: ReactNode }): ReactNode {
  return <HostProvider host={useNextHost()}>{children}</HostProvider>;
}

export { NextHostWrapper };
