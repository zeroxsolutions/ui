import type { ZodType } from 'zod';
import { CommandArgumentError, UnknownCommandError } from '../errors.js';

/**
 * A command resolved to an executor. Both feature commands (bound to the façade)
 * and built-in primitives (bound to the engine) are normalized to this shape, so
 * the registry stays a generic **validate-then-dispatch** layer with no engine
 * dependency (see the `document-editor-core` command spec).
 */
export interface ResolvedCommand<A = unknown> {
  /** Optional Zod schema; when present, args are validated before `run`. */
  args?: ZodType<A>;
  /** Execute; returns whether the command applied. */
  run(args: A): boolean;
  /** Dry-run predicate for `can` (no mutation). Defaults to "applicable". */
  can?(args: A): boolean;
}

/**
 * Holds every dispatchable command by name. Validation runs at the dispatch
 * boundary: invalid arguments throw a `CommandArgumentError` **before** the
 * executor runs, so the document is never mutated on bad input.
 */
export class CommandRegistry {
  private readonly commands = new Map<string, ResolvedCommand>();

  register<A>(name: string, command: ResolvedCommand<A>): void {
    this.commands.set(name, command as ResolvedCommand);
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }

  names(): string[] {
    return [...this.commands.keys()];
  }

  /** Validate + execute. Throws `UnknownCommandError` for an unregistered name
   *  and `CommandArgumentError` for arguments that violate the schema. */
  dispatch(name: string, rawArgs?: unknown): boolean {
    const command = this.commands.get(name);
    if (!command) throw new UnknownCommandError(name);
    const args = this.validate(name, command, rawArgs);
    return command.run(args);
  }

  /** Whether the command exists and could run now. Invalid args → `false`
   *  (never throws), so chrome can safely probe button states. */
  can(name: string, rawArgs?: unknown): boolean {
    const command = this.commands.get(name);
    if (!command) return false;
    let args: unknown;
    try {
      args = this.validate(name, command, rawArgs);
    } catch {
      return false;
    }
    return command.can ? command.can(args) : true;
  }

  private validate(name: string, command: ResolvedCommand, rawArgs: unknown): unknown {
    if (!command.args) return rawArgs;
    const result = command.args.safeParse(rawArgs);
    if (!result.success) {
      throw new CommandArgumentError(name, result.error.issues, `Invalid arguments for command "${name}".`);
    }
    return result.data;
  }
}
