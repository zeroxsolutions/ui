'use client';

import type { ComponentProps, ReactNode } from 'react';

import { type Host, useHost } from '../../../host/host-provider';

/**
 * The host's link, for a server component, which cannot call `useHost` itself. Takes what the host's link
 * takes; throws outside a `HostProvider`.
 */
function HostLink(props: ComponentProps<Host['Link']>): ReactNode {
  const { Link } = useHost();
  return <Link {...props} />;
}

export { HostLink };
