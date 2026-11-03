import { useState, type ReactNode } from 'react';

import { NumberField, NumberFieldInput } from '@/registry/bases/base-ui/components/data-entry/number-field';
import { InputGroupAddon, InputGroupText } from '@/registry/bases/base-ui/ui/input-group';

const SHAPES = ['Rectangle', 'Ellipse', 'Line'] as const;

/** Three selected shapes with differing widths: the field shows its placeholder until one width is set for all. */
function NumberFieldMixedDemo(): ReactNode {
  const [widths, setWidths] = useState<number[]>([120, 180, 64]);
  const mixed = widths.some((width) => width !== widths[0]);

  return (
    <div className="flex flex-col gap-3">
      <ul className="text-muted-foreground flex flex-col gap-0.5 text-sm">
        {SHAPES.map((shape, index) => (
          <li key={shape} className="flex justify-between gap-4">
            <span>{shape}</span>
            <span className="tabular-nums">{widths[index]}px</span>
          </li>
        ))}
      </ul>
      <NumberField
        value={widths[0] ?? 0}
        onValueChange={(value) => setWidths(widths.map(() => value))}
        mixed={mixed}
        min={0}
        max={1000}
        step={1}
        className="w-32"
      >
        <InputGroupAddon>
          <InputGroupText>W</InputGroupText>
        </InputGroupAddon>
        <NumberFieldInput placeholder="Mixed" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>px</InputGroupText>
        </InputGroupAddon>
      </NumberField>
    </div>
  );
}

export { NumberFieldMixedDemo };
