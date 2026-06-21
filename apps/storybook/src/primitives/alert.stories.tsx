import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert, AlertTitle, AlertDescription, AlertAction, Button } from '@chiselart/ui';
import { CircleAlertIcon, TriangleAlertIcon } from 'lucide-react';

const meta: Meta<typeof Alert> = {
  title: 'Primitives/Alert',
  component: Alert,
};
export default meta;

type Story = StoryObj<typeof Alert>;

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

export const WithAction: Story = {
  render: () => (
    <Alert className="w-[480px]">
      <CircleAlertIcon />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>A new version of the app is ready to install.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Update
        </Button>
      </AlertAction>
    </Alert>
  ),
};
