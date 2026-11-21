/**
 * A send's variables with every value a template does not declare non-sensitive replaced by null.
 *
 * An allow-list. A name absent from `nonSensitiveVariables`, a secret or a variable its template no
 * longer declares, keeps its key and loses its value, so a trace still shows what the send was given.
 */
export function redactVariables<Value>(
  variables: Readonly<Record<string, Value>>,
  nonSensitiveVariables: ReadonlySet<string>,
): Record<string, Value | null> {
  return Object.fromEntries(
    Object.entries(variables).map(([name, value]) => [name, nonSensitiveVariables.has(name) ? value : null]),
  );
}
