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

const meta: Meta = {
  title: 'Primitives/Form',
};
export default meta;

type Story = StoryObj;

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
                  <Input placeholder="zeroxsolutions" {...field} />
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
