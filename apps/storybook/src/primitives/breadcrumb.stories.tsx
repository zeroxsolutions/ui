import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@zeroxsolutions/ui/breadcrumb';

/**
 * `Breadcrumb` is a navigation primitive that renders a hierarchical trail
 * showing the current page's location within the site. It is composed from
 * parts: `BreadcrumbList` wraps the ordered items, `BreadcrumbLink` marks
 * navigable ancestors, `BreadcrumbPage` marks the current page, and
 * `BreadcrumbSeparator` / `BreadcrumbEllipsis` divide or collapse the trail.
 */
const meta: Meta<typeof Breadcrumb> = {
  title: 'Primitives/Breadcrumb',
  component: Breadcrumb,
};
export default meta;

type Story = StoryObj<typeof Breadcrumb>;

/** A standard trail of navigable links ending in the non-interactive current page. */
export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Projects</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Cross Platform</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/** Uses `BreadcrumbEllipsis` to collapse intermediate levels when the trail is long. */
export const WithEllipsis: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Settings</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Storage</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};
