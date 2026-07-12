import type { Meta, StoryObj } from '@storybook/react-vite';
import type { EditorFeature } from '@zeroxsolutions/editor/document/core/index';
import { Viewer } from '@zeroxsolutions/editor/document/react/viewer';
import { ViewerLive } from '@zeroxsolutions/editor/document/react/viewer-live';
import { standardKit } from '@zeroxsolutions/editor/document/features/standard/index';
import { callout } from '@zeroxsolutions/editor/document/features/callout/index';
import { toggle } from '@zeroxsolutions/editor/document/features/toggle/index';
import { link } from '@zeroxsolutions/editor/document/features/link/index';
import { codeBlock } from '@zeroxsolutions/editor/document/features/code-block/index';
import { math } from '@zeroxsolutions/editor/document/features/math/index';
import { mermaid } from '@zeroxsolutions/editor/document/features/mermaid/index';
import { table } from '@zeroxsolutions/editor/document/features/table/index';
import { featureBlocksDoc, sampleDoc } from './sample-doc';

// Must cover every node/mark the sample docs use, or the engine-backed
// `<ViewerLive/>` rejects the whole document (e.g. `sampleDoc`'s `link` mark) and
// renders blank. `standardKit` deliberately disables `link`, so the dedicated
// `link()` feature has to be listed here explicitly.
const viewerFeatures = (): EditorFeature[] => [
  standardKit(),
  callout(),
  toggle(),
  link(),
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
  title: 'Document Editor/Viewer',
  // Anchor the surface at the top of the canvas (no Storybook centering) so the
  // static and live viewers frame their content identically. The default centered
  // layout offsets each story by its own height, and the live viewer is taller
  // (its Mermaid renders as a live diagram, not static source) — which read as the
  // two frames "not matching" even though the content column is the same.
  parameters: { layout: 'fullscreen' },
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

/** Read-only live editor (`ViewerLive`) — interactive rendering, not editable.
 *  Uses the feature-block document so the difference from the static Viewer is
 *  visible: the Mermaid block renders as a live **diagram** here (vs the static
 *  source in `StaticFeatureBlocks`), and the toggle stays collapsible. */
export const Live: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-3">
      <ViewerLive content={featureBlocksDoc} features={viewerFeatures()} />
    </div>
  ),
};
