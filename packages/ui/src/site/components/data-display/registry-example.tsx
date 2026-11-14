'use client';

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

const RegistryExamplesContext = createContext<Record<string, ComponentType>>({});

/**
 * Holds the demos an app renders, by the name the examples index gives them. Each app hands in the
 * generated map it wants, so an app that renders no editor demo never bundles one.
 */
function RegistryExamplesProvider({
  components,
  children,
}: {
  components: Record<string, ComponentType>;
  children: ReactNode;
}): ReactNode {
  return <RegistryExamplesContext value={components}>{children}</RegistryExamplesContext>;
}

/**
 * Renders the demo the provider holds under `name`. The demos and the components they compose use
 * hooks and carry no client directive, since the registry ships without one, so their lazy imports
 * sit on the client side of the boundary, in the map the provider was given.
 */
function RegistryExample({ name }: { name: string }): ReactNode {
  const Demo = useContext(RegistryExamplesContext)[name];
  if (!Demo) throw new Error(`No example named "${name}"`);

  return <Demo />;
}

export { RegistryExample, RegistryExamplesProvider };
