import type { VariableType } from '../variables/variable-type.js';
import type { Variables } from '../variables/variables.js';
import type { EmailBlock } from './block.js';

/** The two lists of blocks a layout frames around the body. */
export const REGIONS = ['header', 'footer'] as const;
export type Region = (typeof REGIONS)[number];

/**
 * One region's blocks and the values they print. A region never reads the body's values, so a send's
 * one-time code cannot reach a footer, and a region and a template may name the same variable.
 */
export interface RegionInput {
  readonly blocks: readonly EmailBlock[];
  readonly variables: Variables;
  readonly variableTypes: Readonly<Record<string, VariableType>>;
}
