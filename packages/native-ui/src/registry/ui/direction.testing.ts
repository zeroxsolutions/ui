/**
 * Helpers the specs of items that read the text direction share: whether part of what an item draws is
 * mirrored, as an arrow is in text read right to left.
 */
import { StyleSheet } from 'react-native';

/** A rendered element as the queries hand it back, by the parts this walk reads. */
interface Drawn {
  props: Record<string, unknown>;
  children: ReadonlyArray<Drawn | string>;
}

function isMirrored(element: Drawn): boolean {
  const transform = (StyleSheet.flatten(element.props.style as never) as { transform?: unknown } | undefined)
    ?.transform;
  return Array.isArray(transform) && transform.some((step: Record<string, unknown>) => step.scaleX === -1);
}

/** Whether `element`, or anything drawn inside it, is mirrored side to side. */
function holdsMirrored(element: Drawn): boolean {
  return isMirrored(element) || element.children.some((child) => typeof child !== 'string' && holdsMirrored(child));
}

export { holdsMirrored };
