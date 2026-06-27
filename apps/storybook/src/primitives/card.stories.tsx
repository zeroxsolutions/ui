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

/**
 * `Card` is a composable container that groups related content on a bordered,
 * rounded surface. It pairs with slot subcomponents — `CardHeader`, `CardTitle`,
 * `CardDescription`, `CardAction`, `CardContent`, and `CardFooter` — that manage
 * spacing and layout, including a header grid that positions an action opposite
 * the title.
 */
const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

/** Minimal card composed of a header (title plus description) and body content. */
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

/** Adds a `CardAction` aligned to the header's title row and a `CardFooter` with a full-width button. */
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
