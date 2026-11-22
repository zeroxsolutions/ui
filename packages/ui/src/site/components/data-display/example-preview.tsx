import type { ReactNode } from 'react';

import { ComponentPreview, ComponentPreviewStage } from './component-preview';
import { RegistryExample } from './registry-example';
import { Index } from '../../../../registry/bases/base-ui/examples/__index__';

import { ExampleSource } from './example-source';
import { ExampleViewLink } from './example-view-link';

interface ExamplePreviewProps {
  /** A demo name in the examples index. */
  name: string;
  /**
   * The demo's source, its language and its lines, packed by `packHighlightLines`, which `rehypeDocsCode`
   * sets as the page compiles.
   */
  code?: string;
  language?: string;
  lines?: string;
  /** The demo's page of its own, which a button on the stage opens in a new tab; none, no button. */
  viewHref?: string;
}

/** A docs page's `<ComponentPreview name>`: the demo live above its source. Throws for a name the index lacks, so the page fails its build. */
function ExamplePreview({ name, viewHref, ...source }: ExamplePreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  return (
    <ComponentPreview className="mt-4 mb-12">
      <div className="relative">
        <ComponentPreviewStage>
          <RegistryExample name={name} />
        </ComponentPreviewStage>
        {viewHref ? <ExampleViewLink name={name} href={viewHref} /> : null}
      </div>
      <ExampleSource name={name} {...source} />
    </ComponentPreview>
  );
}

export { ExamplePreview };
