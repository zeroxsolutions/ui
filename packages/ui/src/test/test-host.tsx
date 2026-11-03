import type { ComponentProps, ReactNode } from 'react';

import { type Host, HostProvider } from '../host/host-provider';

interface TestHostProps {
  /** The path `usePathname` answers; `/` when omitted. */
  pathname?: string;
  /** The query `useSearchParams` answers, without its `?`; empty when omitted. */
  search?: string;
  /** Called with each `push`; a spec passes a mock to read where the component navigated. */
  push?: (href: string) => void;
  /** Called with each `replace`. */
  replace?: (href: string) => void;
  children: ReactNode;
}

// Cancels the click as a client-side router does; jsdom implements no navigation and reports an error for one.
function TestLink({ href, onClick, ...props }: ComponentProps<'a'> & { href: string }): ReactNode {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
      {...props}
    />
  );
}

/**
 * A `HostProvider` for a spec: its link is an anchor that never navigates, and its router answers the path and query
 * given here and hands each navigation to `push` or `replace`.
 */
function TestHost({
  pathname = '/',
  search = '',
  push = () => {},
  replace = () => {},
  children,
}: TestHostProps): ReactNode {
  const host: Host = {
    Link: TestLink,
    usePathname: () => pathname,
    useSearchParams: () => new URLSearchParams(search),
    push,
    replace,
  };
  return <HostProvider host={host}>{children}</HostProvider>;
}

export { TestHost };
