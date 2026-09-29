import type { ComponentType } from 'react';

/**
 * How the agent that owns an assistant message is shown: the identity row and
 * the streaming-accent colour. A host app's richer agent record is structurally
 * assignable to it, so the component never imports app state.
 */
interface ChatAgentIdentity {
  name?: string;
  /** Any CSS colour; used for the identity dot and the streaming accent. */
  color?: string;
  /** A brand or avatar glyph rendered in place of the colour dot (e.g. a provider mark). Takes `className` for sizing. */
  icon?: ComponentType<{ className?: string }>;
}

export type { ChatAgentIdentity };
