import type { Meta, StoryObj } from '@storybook/react-vite';
import { BellIcon } from 'lucide-react';

import { Marker, MarkerContent, MarkerIcon } from '@zeroxsolutions/ui/marker';

/**
 * `Marker` is an inline label/divider row built on Base UI's `useRender`. It
 * renders a full-width flex row of muted text used to introduce or separate
 * sections of content. The `variant` prop sets the presentation: `default` is a
 * plain label, `separator` flanks its content with horizontal rules, and
 * `border` adds a bottom border. `MarkerIcon` adds a leading icon and
 * `MarkerContent` holds the label text (centering it in the `separator` case).
 */
const meta: Meta<typeof Marker> = {
  title: 'Primitives/Marker',
  component: Marker,
};
export default meta;

type Story = StoryObj<typeof Marker>;

/**
 * The `default` variant: a plain section label with a leading `MarkerIcon`.
 */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Marker>
        <MarkerIcon>
          <BellIcon />
        </MarkerIcon>
        <MarkerContent>Notifications</MarkerContent>
      </Marker>
    </div>
  ),
};

/**
 * The `separator` variant: a centered "Today" date marker whose
 * `MarkerContent` is flanked by horizontal rules — common above grouped
 * timeline or chat entries.
 */
export const Separator: Story = {
  render: () => (
    <div className="w-80">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    </div>
  ),
};

/**
 * The `border` variant: a heading with a bottom border that underlines a
 * section of content.
 */
export const Border: Story = {
  render: () => (
    <div className="w-80">
      <Marker variant="border">
        <MarkerContent>Recent activity</MarkerContent>
      </Marker>
    </div>
  ),
};
