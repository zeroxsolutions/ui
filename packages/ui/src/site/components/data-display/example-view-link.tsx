'use client';

import type { ReactNode } from 'react';

import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';
import { Maximize2Icon } from '../../../../registry/bases/base-ui/icons/lucide/maximize-2-icon';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { buttonVariants } from '../../../../registry/bases/base-ui/ui/button';

interface ExampleViewLinkProps {
  /** The demo's name, which the link's label names. */
  name: string;
  /** The demo's page of its own. */
  href: string;
}

/** The button on a preview's stage that opens the demo's page in a new tab; its icon plays while the pointer or the focus is on it. */
function ExampleViewLink({ name, href }: ExampleViewLinkProps): ReactNode {
  const icon = useAnimatedIcon();

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${name} in a new tab`}
      title="Open in a new tab"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
        'bg-background/80 absolute top-2 right-2 backdrop-blur-sm',
      )}
      {...icon.handlers}
    >
      <Maximize2Icon ref={icon.ref} aria-hidden />
    </a>
  );
}

export { ExampleViewLink };
