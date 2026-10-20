'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
  type UnsavedChangesToolbarState,
} from '@/registry/bases/base-ui/components/feedback/unsaved-changes-toolbar';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

const SAVE_DELAY_MS = 1200;

const MESSAGE: Record<UnsavedChangesToolbarState, string> = {
  default: 'You have unsaved changes.',
  saving: 'Saving your changes...',
  error: "Couldn't save your changes.",
  attention: 'Save or reset your changes before you leave.',
};

const SAVE_LABEL: Record<UnsavedChangesToolbarState, string> = {
  default: 'Save changes',
  saving: 'Saving...',
  error: 'Try again',
  attention: 'Save changes',
};

/**
 * A profile name, with the toolbar shown while it differs from the saved one. The first save fails, as
 * if the network dropped, so the error state shows; trying again saves. Leaving with the change unsaved
 * asks for attention instead. The preview contains the toolbar, which otherwise floats at the
 * viewport's bottom edge.
 */
function UnsavedChangesToolbarDemo(): ReactNode {
  const [saved, setSaved] = useState('Ada Lovelace');
  const [name, setName] = useState(saved);
  const [state, setState] = useState<UnsavedChangesToolbarState>('default');
  const [hasFailed, setHasFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function save(): void {
    setState('saving');
    timer.current = setTimeout(() => {
      if (!hasFailed) {
        setHasFailed(true);
        setState('error');
        return;
      }
      setSaved(name);
      setState('default');
    }, SAVE_DELAY_MS);
  }

  function reset(): void {
    setName(saved);
    setState('default');
  }

  const isDirty = name !== saved;
  return (
    <div className="flex h-64 w-full max-w-xl flex-col gap-4 contain-layout">
      <Field className="max-w-64">
        <FieldLabel htmlFor="preview-display-name">Display name</FieldLabel>
        <Input
          id="preview-display-name"
          value={name}
          readOnly={state === 'saving'}
          onChange={(event) => {
            setName(event.target.value);
            setState('default');
          }}
        />
      </Field>
      <Button
        variant="outline"
        className="self-start"
        onClick={() => isDirty && state !== 'saving' && setState('attention')}
      >
        Back to settings
      </Button>
      {isDirty && (
        <UnsavedChangesToolbar state={state}>
          <UnsavedChangesToolbarMessage>{MESSAGE[state]}</UnsavedChangesToolbarMessage>
          <UnsavedChangesToolbarActions>
            <UnsavedChangesToolbarReset onClick={reset}>Reset</UnsavedChangesToolbarReset>
            <UnsavedChangesToolbarSave onClick={save}>{SAVE_LABEL[state]}</UnsavedChangesToolbarSave>
          </UnsavedChangesToolbarActions>
        </UnsavedChangesToolbar>
      )}
    </div>
  );
}

export { UnsavedChangesToolbarDemo };
