import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@zeroxsolutions/ui/card';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Project settings</CardTitle>
        <CardDescription>Manage how your project behaves.</CardDescription>
      </CardHeader>
      <CardContent>
        Configure visibility, members, and integrations from one place.
      </CardContent>
    </Card>
  ),
};

export const WithActionAndFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Upgrade plan</CardTitle>
        <CardDescription>You are on the free tier.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Manage
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Unlock unlimited projects and priority support.</CardContent>
      <CardFooter>
        <Button className="w-full">Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};
