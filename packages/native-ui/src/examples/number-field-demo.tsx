import { useState, type ReactNode } from 'react';

import { NumberField, NumberFieldInput } from '@/components/data-entry/number-field';
import { InputGroupAddon, InputGroupText } from '@/components/ui/input-group';

/** A width field: arithmetic input, clamped and stepped. */
function NumberFieldDemo(): ReactNode {
  const [width, setWidth] = useState(320);

  return (
    <NumberField value={width} onValueChange={setWidth} min={0} max={1000} step={1} className="w-32">
      <InputGroupAddon>
        <InputGroupText>W</InputGroupText>
      </InputGroupAddon>
      <NumberFieldInput aria-label="Width" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>px</InputGroupText>
      </InputGroupAddon>
    </NumberField>
  );
}

export { NumberFieldDemo };
