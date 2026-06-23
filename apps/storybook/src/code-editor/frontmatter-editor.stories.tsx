import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  FrontmatterEditor,
  FrontmatterField,
  FrontmatterFieldControl,
  FrontmatterFieldDescription,
  FrontmatterFieldError,
  FrontmatterFieldLabel,
  type FrontmatterValue,
} from '@chiselart/ui/frontmatter-editor';
import { Input } from '@chiselart/ui/input';
import { Textarea } from '@chiselart/ui/textarea';

const meta: Meta<typeof FrontmatterEditor> = {
  title: 'Code Editor/FrontmatterEditor',
  component: FrontmatterEditor,
};
export default meta;

type Story = StoryObj<typeof FrontmatterEditor>;

export const SkillMetadata: Story = {
  render: () => {
    const [value, setValue] = React.useState<FrontmatterValue>({
      name: 'pdf-toolkit',
      description: '',
    });

    // Validation is the consumer's — these rules mirror the skill harness.
    const errors: Record<string, string> = {};
    const name = String(value.name ?? '');
    if (!name) errors.name = 'Name is required.';
    else if (!/^[a-z0-9-]+$/.test(name))
      errors.name = 'Use lowercase letters, digits, and hyphens only.';
    if (!String(value.description ?? '').trim())
      errors.description = 'Description is required.';

    return (
      <div className="w-[28rem] rounded-lg border p-6">
        <FrontmatterEditor
          value={value}
          onValueChange={setValue}
          errors={errors}
        >
          <FrontmatterField name="name">
            <FrontmatterFieldLabel>Name</FrontmatterFieldLabel>
            <FrontmatterFieldControl render={<Input placeholder="my-skill" />} />
            <FrontmatterFieldError />
          </FrontmatterField>

          <FrontmatterField name="description">
            <FrontmatterFieldLabel>Description</FrontmatterFieldLabel>
            <FrontmatterFieldControl
              render={
                <Textarea placeholder="What the skill does and when to use it" />
              }
            />
            <FrontmatterFieldDescription>
              Shown to the model to decide when to invoke the skill.
            </FrontmatterFieldDescription>
            <FrontmatterFieldError />
          </FrontmatterField>

          <FrontmatterField name="license">
            <FrontmatterFieldLabel>License</FrontmatterFieldLabel>
            <FrontmatterFieldControl render={<Input placeholder="MIT" />} />
          </FrontmatterField>
        </FrontmatterEditor>
      </div>
    );
  },
};
