/** The four variable shapes the data-fields panel offers. A `url` variable may only ever fill a button's href. */
export const VARIABLE_TYPES = ['string', 'duration', 'url', 'email'] as const;

/** One declared variable's type, which a variable row's own column holds. */
export type VariableType = (typeof VARIABLE_TYPES)[number];
