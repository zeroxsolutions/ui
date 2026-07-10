import type { ZodType } from 'zod';
import type { IEditor } from './editor.js';

/**
 * The command layer (see the `document-editor-core` spec). Every mutation is a
 * named command. A command MAY declare a Zod schema for its arguments; when it
 * does, the arguments are validated at the dispatch boundary and invalid
 * arguments reject the command **without mutating the document**. Zod is a
 * deliberate part of the public contract — it is not the hidden engine.
 */
export interface CommandDescriptor<A = void> {
  /** Optional argument schema. Present → args validated before `run`; the schema
   *  is also the single source of the argument type. */
  args?: ZodType<A>;
  /** Execute the command against the façade. Returns whether it applied. */
  run(editor: IEditor, args: A): boolean;
  /** Optional dry-run predicate for `IEditor.can` (no mutation). */
  can?(editor: IEditor, args: A): boolean;
}

/** A feature's contributed commands, keyed by command name. */
export type CommandMap = Record<string, CommandDescriptor<any>>;
