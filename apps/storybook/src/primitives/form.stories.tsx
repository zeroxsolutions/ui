import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@zeroxsolutions/ui/form';
import { Input } from '@zeroxsolutions/ui/input';

/**
 * `Form` adapts react-hook-form to the field primitives: `Form` re-exports the
 * library's `FormProvider`, `FormField` binds a `Controller` to a named field,
 * and `FormItem`/`FormLabel`/`FormControl`/`FormMessage` wire matching `id`,
 * `aria-describedby`, and `aria-invalid` attributes plus validation text. Use it
 * to build controlled forms where labels, descriptions, and errors stay
 * accessibly linked to their input.
 */
const meta: Meta = {
  title: 'Primitives/Form',
};
export default meta;

type Story = StoryObj;

/**
 * A single required field wired through `FormField`; submitting while empty
 * surfaces the `required` rule message via `FormMessage`.
 */
export const Default: Story = {
  render: () => {
    const form = useForm<{ username: string }>({
      defaultValues: { username: '' },
    });
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => {})} className="w-72 space-y-6">
          <FormField
            control={form.control}
            name="username"
            rules={{ required: 'Username is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="yourusername" {...field} />
                </FormControl>
                <FormDescription>Your public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
};
