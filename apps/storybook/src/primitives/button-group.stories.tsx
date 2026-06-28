import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@zeroxsolutions/ui/components/ui/button-group';

/**
 * `ButtonGroup` joins related buttons and controls into a single connected
 * segment, collapsing adjacent borders and radii so they read as one unit. It
 * supports `horizontal` and `vertical` orientation, and accepts inline
 * `ButtonGroupText` labels and `ButtonGroupSeparator` dividers between items.
 */
const meta: Meta<typeof ButtonGroup> = {
  title: 'Primitives/ButtonGroup',
  component: ButtonGroup,
};
export default meta;

type Story = StoryObj<typeof ButtonGroup>;

/** A horizontal row of equally weighted actions merged into one segment. */
export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Bold</Button>
      <Button variant="outline">Italic</Button>
      <Button variant="outline">Underline</Button>
    </ButtonGroup>
  ),
};

/** Combines a `ButtonGroupText` prefix and a `ButtonGroupSeparator`-divided action. */
export const WithTextAndSeparator: Story = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>https://</ButtonGroupText>
      <Button variant="outline">example.com</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Copy</Button>
    </ButtonGroup>
  ),
};

/** Stacks the buttons via `orientation="vertical"`, merging top/bottom edges. */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup>
  ),
};
