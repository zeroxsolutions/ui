import type { Meta, StoryObj } from '@storybook/react-vite';
import type { EditorFeature } from '@zeroxsolutions/editor/document/core/index';
import { Viewer } from '@zeroxsolutions/editor/document/react/viewer';
import { ViewerLive } from '@zeroxsolutions/editor/document/react/viewer-live';
import { standardKit } from '@zeroxsolutions/editor/document/features/standard/index';
import { callout } from '@zeroxsolutions/editor/document/features/callout/index';
import { toggle } from '@zeroxsolutions/editor/document/features/toggle/index';
import { codeBlock } from '@zeroxsolutions/editor/document/features/code-block/index';
import { math } from '@zeroxsolutions/editor/document/features/math/index';
import { mermaid } from '@zeroxsolutions/editor/document/features/mermaid/index';
import { table } from '@zeroxsolutions/editor/document/features/table/index';
import { featureBlocksDoc, sampleDoc } from './sample-doc';

const viewerFeatures = (): EditorFeature[] => [
  standardKit(),
  callout(),
  toggle(),
  codeBlock(),
  math(),
  mermaid(),
  table(),
];

/**
 * The two read surfaces. `<Viewer/>` is the **static, SSR-safe** renderer — it
 * renders document JSON through the feature codecs with no editing engine in its
 * module graph. `<ViewerLive/>` is a read-only live editor for interactive
 * (non-editable) content.
 */
const meta: Meta = {
  title: 'Editor/Viewer',
};
export default meta;

type Story = StoryObj;

/** Static Viewer — renders JSON to React via codecs, engine-free. */
export const Static: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-3">
      <Viewer doc={sampleDoc} features={viewerFeatures()} />
    </div>
  ),
};

/** Static Viewer over the richer feature-block document. */
export const StaticFeatureBlocks: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-3">
      <Viewer doc={featureBlocksDoc} features={viewerFeatures()} />
    </div>
  ),
};

/** Read-only live editor (`ViewerLive`) — interactive rendering, not editable. */
export const Live: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-3">
      <ViewerLive content={sampleDoc} features={viewerFeatures()} />
    </div>
  ),
};
