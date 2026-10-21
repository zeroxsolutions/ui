'use client';

import type { ReactNode } from 'react';

import { NATIVE_ENGINE_LABELS, NATIVE_ENGINES } from '@/constants/native-engines';
import { rememberEngine, useRememberedEngine } from '@/hooks/use-remembered-choice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import type { NativeEngine } from '@/types/native-engine';

interface EngineTabsChooserProps {
  panels: { engine: NativeEngine; content: ReactNode }[];
}

/** A tab per engine, open on the engine the reader last read; picking one remembers it. */
function EngineTabsChooser({ panels }: EngineTabsChooserProps): ReactNode {
  const engine = useRememberedEngine();

  return (
    <Tabs
      data-slot="engine-tabs"
      value={engine}
      onValueChange={(value) => {
        const picked = NATIVE_ENGINES.find((option) => option === value);
        if (picked) rememberEngine(picked);
      }}
      className="mt-6"
    >
      <TabsList variant="line">
        {panels.map((panel) => (
          <TabsTrigger key={panel.engine} value={panel.engine}>
            {NATIVE_ENGINE_LABELS[panel.engine]}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((panel) => (
        <TabsContent key={panel.engine} value={panel.engine}>
          {panel.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { EngineTabsChooser };
