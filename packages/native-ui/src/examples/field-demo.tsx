import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';

function FieldDemo(): ReactNode {
  const [email, setEmail] = useState('ana@');
  const [updates, setUpdates] = useState(true);
  const invalid = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  return (
    <FieldSet>
      <FieldLegend>Account</FieldLegend>
      <FieldDescription>How we reach you about your orders.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel nativeID="field-demo-name">Full name</FieldLabel>
          <Input aria-labelledby="field-demo-name" placeholder="Ana Silva" />
        </Field>
        <Field invalid={invalid}>
          <FieldLabel nativeID="field-demo-email">Email</FieldLabel>
          <Input
            aria-labelledby="field-demo-email"
            aria-invalid={invalid}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {invalid ? (
            <FieldError>Enter an email such as ana@example.com.</FieldError>
          ) : (
            <FieldDescription>We never share it.</FieldDescription>
          )}
        </Field>
        <FieldSeparator>Notifications</FieldSeparator>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel onPress={() => setUpdates(!updates)}>Order updates</FieldLabel>
            <FieldDescription>A message when an order ships.</FieldDescription>
          </FieldContent>
          <Switch checked={updates} onCheckedChange={setUpdates} aria-label="Order updates" />
        </Field>
        <Field orientation="horizontal">
          <Button>
            <Text>Save</Text>
          </Button>
          <Button variant="outline">
            <Text>Cancel</Text>
          </Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export { FieldDemo };
