import { demos } from '@zeroxsolutions/native-ui/examples';
import type { ComponentType } from 'react';

/**
 * The demo named `name`, from the list the web export draws.
 * @param name - a demo's name, such as `button-demo`, as a link carries it
 * @returns the demo, or `undefined` for a name the list lacks, including one every object inherits
 */
function findDemo(name: string): ComponentType | undefined {
  return Object.hasOwn(demos, name) ? demos[name] : undefined;
}

export { findDemo };
