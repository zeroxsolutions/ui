import type { COMPONENT_BASES } from '@/constants/component-bases';

/** One of the bases a web component is documented on, as its path segment: `base` is Base UI. */
export type ComponentBase = (typeof COMPONENT_BASES)[number];
