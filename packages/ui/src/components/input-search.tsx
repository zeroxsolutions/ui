import * as React from "react"
import { Search } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * A search field — the `input-group` composition (leading magnifier + control)
 * packaged as one reusable component so call-sites never hand-roll the icon
 * alignment. `className` sizes the group; remaining props go to the input.
 */
function InputSearch({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput type="search" {...props} />
    </InputGroup>
  )
}

export { InputSearch }
