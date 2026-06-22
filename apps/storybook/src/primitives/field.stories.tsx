import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from '@chiselart/ui/field';
import { Input } from '@chiselart/ui/input';

const meta: Meta<typeof Field> = {
  title: 'Primitives/Field',
  component: Field,
};
export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="field-email">Email</FieldLabel>
      <Input id="field-email" type="email" placeholder="you@example.com" />
      <FieldDescription>We'll never share your email with anyone.</FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field className="w-80" data-invalid="true">
      <FieldLabel htmlFor="field-username">Username</FieldLabel>
      <Input id="field-username" defaultValue="ab" aria-invalid="true" />
      <FieldError>Username must be at least 3 characters.</FieldError>
    </Field>
  ),
};

export const FieldSetGroup: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldLegend>Account details</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="set-name">Full name</FieldLabel>
          <Input id="set-name" placeholder="Ada Lovelace" />
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel htmlFor="set-email">Email</FieldLabel>
          <Input id="set-email" type="email" placeholder="you@example.com" />
          <FieldDescription>Used for sign-in and notifications.</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
