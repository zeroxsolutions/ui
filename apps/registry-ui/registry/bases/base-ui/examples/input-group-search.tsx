import { SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';

/** A search field: a leading magnifier addon beside the control, composed from upstream parts. */
function InputGroupSearch(): ReactNode {
  return (
    <InputGroup className="w-64">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput type="search" placeholder="Search files" />
    </InputGroup>
  );
}

export { InputGroupSearch };
