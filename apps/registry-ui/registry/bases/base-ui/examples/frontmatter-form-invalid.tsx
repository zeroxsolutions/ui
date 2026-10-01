'use client';

import { useState, type ReactNode } from 'react';

import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  type FrontmatterFormValue,
} from '@/registry/bases/base-ui/components/data-entry/frontmatter-form';
import { FieldDescription } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

/** A skill's frontmatter with its name left blank, so the name field's data-invalid and its FrontmatterFormFieldError both show; typing a name clears it. */
function FrontmatterFormInvalidDemo(): ReactNode {
  const [value, setValue] = useState<FrontmatterFormValue>({
    name: '',
    description: 'Fill and flatten PDF forms.',
  });

  return (
    <FrontmatterForm
      value={value}
      onValueChange={setValue}
      errors={value.name ? {} : { name: 'A name is required.' }}
      className="w-full max-w-sm"
    >
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input placeholder="my-skill" />} />
        <FieldDescription>Lowercase, dash-separated.</FieldDescription>
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
      <FrontmatterFormField name="description">
        <FrontmatterFormFieldLabel>Description</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input />} />
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
    </FrontmatterForm>
  );
}

export { FrontmatterFormInvalidDemo };
