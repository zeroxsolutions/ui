import * as React from 'react';
import { Search } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/registry/bases/base-ui/ui/input-group';

/**
 * A search field — the `input-group` composition (leading magnifier + control)
 * packaged as one reusable component so call-sites never hand-roll the icon
 * alignment. `className` sizes the group; remaining props go to the input.
 *
 * Named modifier-first (`SearchInput`), per component-conventions: a new input
 * variant takes the `<Modifier>Input` form; noun-first is reserved for inherited
 * names (`InputOTP`, `InputGroup`).
 */
function SearchInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput type="search" {...props} />
    </InputGroup>
  );
}

export { SearchInput };
