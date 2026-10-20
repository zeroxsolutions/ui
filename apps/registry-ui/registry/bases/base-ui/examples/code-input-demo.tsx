'use client';

import { useState, type ReactNode } from 'react';

import { CodeInput } from '@/registry/bases/base-ui/components/data-entry/code-input';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/registry/bases/base-ui/ui/field';

/** A six-digit sign-in code, in two groups of three, above a button that spans the form. */
function CodeInputDemo(): ReactNode {
  const [code, setCode] = useState('');
  return (
    <form className="flex w-full max-w-80 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <Field>
        <FieldLabel htmlFor="preview-code">Verification code</FieldLabel>
        <CodeInput
          id="preview-code"
          aria-describedby="preview-code-description"
          pattern="3-3"
          value={code}
          onChange={setCode}
        />
        <FieldDescription id="preview-code-description">Enter the code we sent to ada@example.com.</FieldDescription>
      </Field>
      <Button type="submit" className="w-full" disabled={code.length < 6}>
        Verify
      </Button>
    </form>
  );
}

export { CodeInputDemo };
