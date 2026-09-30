'use client';

import { useRef, type ReactNode } from 'react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { PanelRow, PanelRowAction } from '@/registry/bases/base-ui/components/layout/panel-row';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { LockIcon, type LockIconHandle } from '@/registry/bases/base-ui/ui/lock';

/** A two-column `PanelFieldGroup` in a `PanelRow` with a trailing lock action. */
function PanelRowDemo(): ReactNode {
  const iconRef = useRef<LockIconHandle>(null);

  return (
    <PanelRow className="w-full">
      <PanelFieldGroup cols={2}>
        <Field>
          <FieldLabel htmlFor="preview-x">X</FieldLabel>
          <Input id="preview-x" defaultValue="100" />
        </Field>
        <Field>
          <FieldLabel htmlFor="preview-y">Y</FieldLabel>
          <Input id="preview-y" defaultValue="200" />
        </Field>
      </PanelFieldGroup>
      <PanelRowAction>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Lock aspect ratio"
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
          onFocus={() => iconRef.current?.startAnimation()}
          onBlur={() => iconRef.current?.stopAnimation()}
        >
          <LockIcon ref={iconRef} aria-hidden />
        </Button>
      </PanelRowAction>
    </PanelRow>
  );
}

export { PanelRowDemo };
