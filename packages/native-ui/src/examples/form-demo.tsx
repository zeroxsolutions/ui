import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';

interface BugReport {
  title: string;
  description: string;
}

function FormDemo(): ReactNode {
  const form = useForm<BugReport>({ defaultValues: { title: '', description: '' } });

  function onSubmit(data: BugReport) {
    toast('You submitted the following values:', { description: JSON.stringify(data, null, 2) });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Bug Report</CardTitle>
        <CardDescription>Help us improve by reporting bugs you encounter.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Controller
            name="title"
            control={form.control}
            rules={{
              minLength: { value: 5, message: 'Bug title must be at least 5 characters.' },
              maxLength: { value: 32, message: 'Bug title must be at most 32 characters.' },
              required: 'Bug title must be at least 5 characters.',
            }}
            render={({ field, fieldState }) => (
              <Field invalid={fieldState.invalid}>
                <FieldLabel nativeID="form-demo-title" onPress={() => form.setFocus('title')}>
                  Bug Title
                </FieldLabel>
                <Input
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  aria-label="Bug Title"
                  aria-labelledby="form-demo-title"
                  aria-invalid={fieldState.invalid}
                  placeholder="Login button not working on mobile"
                  autoComplete="off"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            rules={{
              minLength: { value: 20, message: 'Description must be at least 20 characters.' },
              maxLength: { value: 100, message: 'Description must be at most 100 characters.' },
              required: 'Description must be at least 20 characters.',
            }}
            render={({ field, fieldState }) => (
              <Field invalid={fieldState.invalid}>
                <FieldLabel nativeID="form-demo-description" onPress={() => form.setFocus('description')}>
                  Description
                </FieldLabel>
                <Textarea
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  aria-label="Description"
                  aria-labelledby="form-demo-description"
                  aria-invalid={fieldState.invalid}
                  placeholder="I'm having an issue with the login button on mobile."
                  className="min-h-24"
                />
                <FieldDescription>{`${field.value.length}/100 characters`}</FieldDescription>
                <FieldDescription>
                  Include steps to reproduce, expected behavior, and what actually happened.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button variant="outline" onPress={() => form.reset()}>
            <Text>Reset</Text>
          </Button>
          <Button onPress={() => void form.handleSubmit(onSubmit)()}>
            <Text>Submit</Text>
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

export { FormDemo };
