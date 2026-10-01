import type { ReactNode } from 'react';

import { ComponentPreview, ComponentPreviewStage } from '@/components/data-display/component-preview';
import { RegistryExample } from '@/components/data-display/registry-example';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

import { ExampleSource } from './example-source';

interface ExamplePreviewProps {
  /** A demo name in the examples index. */
  name: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/** A docs page's `<ComponentPreview name>`: the demo live above its source. Throws for a name the index lacks, so the page fails its build. */
function ExamplePreview({ name, ...source }: ExamplePreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  return (
    <ComponentPreview className="mt-4 mb-12">
      <ComponentPreviewStage>
        <RegistryExample name={name} />
      </ComponentPreviewStage>
      <ExampleSource name={name} {...source} />
    </ComponentPreview>
  );
}

export { ExamplePreview };
