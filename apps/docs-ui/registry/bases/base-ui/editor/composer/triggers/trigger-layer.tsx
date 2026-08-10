'use client';

import { useMemo } from 'react';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { TriggerMenu } from './trigger-menu.js';
import { validateTriggerRegistry, type TriggerToken } from '@zeroxsolutions/editor-core/composer/triggers/trigger-token';

/**
 * Mounts one `TriggerMenu` per registered pill-bearing token and validates the
 * registry once (coherent tokens, no char/kind collision) so a misconfigured
 * registry fails loudly rather than silently shadowing a trigger. Insertion
 * tokens (`:emoji:`) carry no pill menu here - their grid menu ships with the
 * emoji follow-up change - so they are skipped.
 */
export interface TriggerLayerProps {
  editor: IEditor;
  triggers: readonly TriggerToken[];
}

export function TriggerLayer({ editor, triggers }: TriggerLayerProps) {
  const pillTokens = useMemo(() => {
    validateTriggerRegistry(triggers);
    return triggers.filter((token) => token.archetype !== 'insertion');
  }, [triggers]);

  return (
    <>
      {pillTokens.map((token) => (
        <TriggerMenu key={token.kind} editor={editor} token={token} />
      ))}
    </>
  );
}
