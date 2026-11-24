import type { ReactNode } from 'react';

import { ComponentPreview, ComponentPreviewStage } from './component-preview';
import { RegistryExample } from './registry-example';
import { Index } from '../../../../registry/bases/base-ui/examples/__index__';

import { ExamplePreviewStage } from './example-preview-stage';
import { ExampleSource } from './example-source';

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
  /**
   * The demo's page of its own, which a button on the stage opens in a new tab and the stage frames at another
   * device or theme; none, no button and no device or theme bar.
   */
  viewHref?: string;
}

/** A docs page's `<ComponentPreview name>`: the demo live above its source. Throws for a name the index lacks, so the page fails its build. */
function ExamplePreview({ name, viewHref, ...source }: ExamplePreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  const demo = <RegistryExample name={name} />;
  return (
    <ComponentPreview className="mt-4 mb-12">
      {viewHref ? (
        <ExamplePreviewStage name={name} viewHref={viewHref}>
          {demo}
        </ExamplePreviewStage>
      ) : (
        <ComponentPreviewStage>{demo}</ComponentPreviewStage>
      )}
      <ExampleSource name={name} {...source} />
    </ComponentPreview>
  );
}

export { ExamplePreview };
