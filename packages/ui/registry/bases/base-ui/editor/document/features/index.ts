/**
 * L1–L3 feature blocks, each a self-contained `defineFeature` bundling its
 * node/mark, commands, codec, view, and UI contributions (see
 * `editor-feature-api`). Each also has a per-feature subpath entry (`./*`) so a
 * heavy block (table, code-block, mermaid, math) is imported lazily and kept out
 * of the core bundle; this barrel is the eager convenience surface.
 */
export { standardKit } from './standard/index';
export { callout } from './callout/index';
export { toggle } from './toggle/index';
export { link } from './link/index';
export { image } from './image/index';
export { table } from './table/index';
export { codeBlock } from './code-block/index';
export { mermaid } from './mermaid/index';
export { math } from './math/index';
export { mention } from './mention/index';
export { embed } from './embed/index';
