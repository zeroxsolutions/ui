import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@zeroxsolutions/ui/alert';
import { Button } from '@zeroxsolutions/ui/button';
import { CircleAlertIcon, TriangleAlertIcon } from 'lucide-react';

/**
 * `Alert` is a static, inline callout that surfaces a short, important message
 * within the page flow without interrupting the user. Compose an optional
 * leading icon with `AlertTitle` and `AlertDescription`; the `destructive`
 * variant recolors it to signal errors, and `AlertAction` anchors a control to
 * the top-right corner. It carries `role="alert"` so assistive technologies
 * announce its contents.
 */
const meta: Meta<typeof Alert> = {
  title: 'Primitives/Alert',
  component: Alert,
};
export default meta;

type Story = StoryObj<typeof Alert>;

/** Default informational variant: a leading icon, title, and supporting description. */
export const Default: Story = {
  render: () => (
    <Alert className="w-[480px]">
      <CircleAlertIcon />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Your changes have been saved and will sync across your devices shortly.
      </AlertDescription>
    </Alert>
  ),
};

/** `destructive` variant that recolors the icon and text to signal an error state. */
export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[480px]">
      <TriangleAlertIcon />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        We could not reach the server. Check your connection and try again.
      </AlertDescription>
    </Alert>
  ),
};

/** Adds an `AlertAction` slot that pins a button to the alert's top-right corner. */
export const WithAction: Story = {
  render: () => (
    <Alert className="w-[480px]">
      <CircleAlertIcon />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>
        A new version of the app is ready to install.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Update
        </Button>
      </AlertAction>
    </Alert>
  ),
};
