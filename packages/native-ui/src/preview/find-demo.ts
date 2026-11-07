import type { ComponentType } from 'react';

import { demos as lumaDemos } from '@styles/luma/examples';
import { demos as lyraDemos } from '@styles/lyra/examples';
import { demos as maiaDemos } from '@styles/maia/examples';
import { demos as miraDemos } from '@styles/mira/examples';
import { demos as novaDemos } from '@styles/nova/examples';
import { demos as rheaDemos } from '@styles/rhea/examples';
import { demos as seraDemos } from '@styles/sera/examples';
import { demos as vegaDemos } from '@styles/vega/examples';

import type { PreviewStyle } from './preview-url';

/** Each style's demos, which import that style's items through their own `@/`. */
const DEMOS: Readonly<Record<PreviewStyle, Readonly<Record<string, ComponentType>>>> = {
  vega: vegaDemos,
  luma: lumaDemos,
  lyra: lyraDemos,
  maia: maiaDemos,
  mira: miraDemos,
  nova: novaDemos,
  rhea: rheaDemos,
  sera: seraDemos,
};

/**
 * The demo named `name`, drawn in `style`.
 * @param name - a demo's name, such as `button-demo`, as a link carries it
 * @returns the demo, or `undefined` for a name the list lacks, including one every object inherits
 */
function findDemo(style: PreviewStyle, name: string): ComponentType | undefined {
  const demos = DEMOS[style];
  return Object.hasOwn(demos, name) ? demos[name] : undefined;
}

/** The names of the demos every style draws, in the order the list shows them. */
const DEMO_NAMES: readonly string[] = Object.keys(vegaDemos);

export { DEMO_NAMES, findDemo };
