/** A send's values by variable name; `null` is a value a stored send redacted, and fills as empty. */
export type Variables = Readonly<Record<string, string | null>>;
