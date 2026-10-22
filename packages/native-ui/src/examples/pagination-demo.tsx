import { useState, type ReactNode } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';

const PAGE_COUNT = 10;

function PaginationDemo(): ReactNode {
  const [page, setPage] = useState(2);
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page === 1} onPress={() => setPage(page - 1)} />
        </PaginationItem>
        {[1, 2, 3].map((number) => (
          <PaginationItem key={number}>
            <PaginationLink isActive={number === page} onPress={() => setPage(number)}>
              <Text>{number}</Text>
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive={page === PAGE_COUNT} onPress={() => setPage(PAGE_COUNT)}>
            <Text>{PAGE_COUNT}</Text>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext disabled={page === PAGE_COUNT} onPress={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export { PaginationDemo };
