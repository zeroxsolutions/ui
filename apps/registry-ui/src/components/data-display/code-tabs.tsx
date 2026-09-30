'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useConfig, type Config } from '@/hooks/use-config';
import { Tabs } from '@/registry/bases/base-ui/ui/tabs';

/**
 * An item page's `Command` / `Manual` tabs, upstream's `CodeTabs`: the reader's choice is remembered
 * across pages, as the package manager is.
 */
function CodeTabs({ children }: ComponentProps<typeof Tabs>): ReactNode {
  const [config, setConfig] = useConfig();

  return (
    <Tabs
      value={config.installationType}
      onValueChange={(value) => setConfig({ ...config, installationType: value as Config['installationType'] })}
      className="relative mt-6 w-full *:data-[slot=tabs-list]:gap-6"
    >
      {children}
    </Tabs>
  );
}

export { CodeTabs };
