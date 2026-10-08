/**
 * Editor error types. Every error carries a stable machine `code` so a host can
 * branch on it. These are plain lib errors (this is a frontend package, not a
 * gateway) — no wire/JSON:API coupling.
 */
export class EditorError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'EditorError';
  }
}

/** A command was dispatched with arguments that violate its schema. Thrown at
 *  the dispatch boundary *before* any mutation, so the document is untouched. */
export class CommandArgumentError extends EditorError {
  constructor(
    readonly command: string,
    readonly issues: unknown,
    message: string,
  ) {
    super('editor.command.invalid_arguments', message);
    this.name = 'CommandArgumentError';
  }
}

/** A command name was dispatched that no feature (or built-in) registered. */
export class UnknownCommandError extends EditorError {
  constructor(readonly command: string) {
    super('editor.command.unknown', `Unknown command: "${command}"`);
    this.name = 'UnknownCommandError';
  }
}

/** A feature declared a `dependsOn` that was not registered. */
export class MissingFeatureDependencyError extends EditorError {
  constructor(
    readonly feature: string,
    readonly missing: string,
  ) {
    super(
      'editor.feature.missing_dependency',
      `Feature "${feature}" depends on "${missing}", which is not registered.`,
    );
    this.name = 'MissingFeatureDependencyError';
  }
}

/** Two features (or a feature and a built-in) claimed the same id/name. */
export class DuplicateRegistrationError extends EditorError {
  constructor(
    readonly kind: 'feature' | 'node' | 'mark' | 'command',
    readonly id: string,
  ) {
    super('editor.registration.duplicate', `Duplicate ${kind} registration for "${id}".`);
    this.name = 'DuplicateRegistrationError';
  }
}
