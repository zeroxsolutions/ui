import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@zeroxsolutions/ui/tabs';

/**
 * `Tabs` is a Base UI tab set composed of `Tabs` (root), `TabsList`,
 * `TabsTrigger`, and `TabsContent`, where only the panel matching the active
 * trigger is shown. The active tab is tracked by string value (`defaultValue`
 * for uncontrolled usage), and the trigger row supports a `default` segmented
 * look or a `line` underline look via the `TabsList` `variant` prop.
 */
const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
};
export default meta;

type Story = StoryObj<typeof Tabs>;

/** Default segmented `TabsList` with a muted background and three panels. */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Manage your account settings here.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
      <TabsContent value="team">Invite and manage your team.</TabsContent>
    </Tabs>
  ),
};

/** `line` variant: transparent list with an underline indicator on the active tab. */
export const Line: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-80">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Project overview.</TabsContent>
      <TabsContent value="activity">Recent activity.</TabsContent>
      <TabsContent value="settings">Project settings.</TabsContent>
    </Tabs>
  ),
};
