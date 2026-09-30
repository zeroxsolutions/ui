'use client';

import type { ReactNode } from 'react';

import { Components } from '@/registry/bases/base-ui/examples/__components__';

/**
 * Renders the demo the examples index holds under `name`. The demos and the components they compose
 * use hooks and carry no client directive, since the registry ships without one, so their lazy
 * imports have to sit on this side of the client boundary.
 */
function ComponentPreviewDemo({ name }: { name: string }): ReactNode {
  const Demo = Components[name];

  return <Demo />;
}

export { ComponentPreviewDemo };
