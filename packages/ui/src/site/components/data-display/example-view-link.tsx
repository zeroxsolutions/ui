'use client';

import type { ReactNode } from 'react';

import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';
import { Maximize2Icon } from '../../../../registry/bases/base-ui/icons/lucide/maximize-2-icon';
import { buttonVariants } from '../../../../registry/bases/base-ui/ui/button';

interface ExampleViewLinkProps {
  /** The demo's name, which the link's label names. */
  name: string;
  /** The demo's page of its own. */
  href: string;
}

/** The button over a preview's stage that opens the demo's page in a new tab; its icon plays while the pointer or the focus is on it. */
function ExampleViewLink({ name, href }: ExampleViewLinkProps): ReactNode {
  const icon = useAnimatedIcon();

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${name} in a new tab`}
      title="Open in a new tab"
      className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
      {...icon.handlers}
    >
      <Maximize2Icon ref={icon.ref} aria-hidden />
    </a>
  );
}

export { ExampleViewLink };
