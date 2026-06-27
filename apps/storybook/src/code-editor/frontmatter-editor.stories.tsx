import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import {
  FrontmatterEditor,
  FrontmatterField,
  FrontmatterFieldControl,
  FrontmatterFieldDescription,
  FrontmatterFieldError,
  FrontmatterFieldLabel,
  type FrontmatterValue,
} from '@zeroxsolutions/ui/frontmatter-editor';
import { Input } from '@zeroxsolutions/ui/input';
import { Textarea } from '@zeroxsolutions/ui/textarea';

/**
 * `FrontmatterEditor` is a compound editor for frontmatter (YAML metadata): the
 * Root holds the document and field setters in context, and the consumer
 * composes one `FrontmatterField` per key with its own label, hint, control, and
 * validation. It is controlled via `value` + `onValueChange`, with `errors`
 * supplied by the consumer's own validator. The stories pair it with `Input` and
 * `Textarea` controls to edit string fields.
 */
const meta: Meta<typeof FrontmatterEditor> = {
  title: 'Code Editor/FrontmatterEditor',
  component: FrontmatterEditor,
};
export default meta;

type Story = StoryObj<typeof FrontmatterEditor>;

/**
 * Composes a three-field skill-metadata form (`name`, `description`, `license`)
 * from `Input` and `Textarea` controls. Validation is the consumer's: the render
 * computes `errors` (mirroring the skill harness rules) and feeds them to the
 * Root, which surfaces each message on its field.
 */
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
            <FrontmatterFieldControl
              render={<Input placeholder="my-skill" />}
            />
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
