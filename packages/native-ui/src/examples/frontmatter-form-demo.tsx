import { useState, type ReactNode } from 'react';

import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  type FrontmatterFormValue,
} from '@/components/data-entry/frontmatter-form';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

/** A skill's frontmatter: a name and its one-line description, each bound to an Input. */
function FrontmatterFormDemo(): ReactNode {
  const [value, setValue] = useState<FrontmatterFormValue>({
    name: 'pdf-toolkit',
    description: 'Fill and flatten PDF forms.',
  });

  return (
    <FrontmatterForm value={value} onValueChange={setValue} className="w-full max-w-sm">
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input aria-label="Name" placeholder="my-skill" />} />
        <FieldDescription>Lowercase, dash-separated.</FieldDescription>
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
      <FrontmatterFormField name="description">
        <FrontmatterFormFieldLabel>Description</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input aria-label="Description" />} />
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
    </FrontmatterForm>
  );
}

export { FrontmatterFormDemo };
