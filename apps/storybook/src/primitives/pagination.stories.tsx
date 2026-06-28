import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@zeroxsolutions/ui/components/ui/pagination';

/**
 * `Pagination` renders an accessible `<nav>` landmark for paging through
 * results, composed from `PaginationContent`, `PaginationItem`,
 * `PaginationLink`, `PaginationPrevious`, `PaginationNext`, and
 * `PaginationEllipsis`. Mark the current page with `isActive` on its
 * `PaginationLink`; the component wires up `aria-current` and previous/next
 * labeling but leaves page-state logic to the caller.
 */
const meta: Meta<typeof Pagination> = {
  title: 'Primitives/Pagination',
  component: Pagination,
};
export default meta;

type Story = StoryObj<typeof Pagination>;

/**
 * Full pager with previous/next controls, page 2 marked active via `isActive`,
 * and an ellipsis collapsing the gap before the last page.
 */
export const Default: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">10</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};
