import registry from '@zeroxsolutions/native-ui/registry.json';

/** A block the native registry publishes, as the native blocks page lists it. */
export interface NativeBlock {
  /** Its registry item's name, the same under every engine and style; its demo is `<name>-demo`. */
  name: string;
  title: string;
  description: string;
}

/** Every block the native registry publishes, in `registry.json`'s order. */
export const nativeBlocks: NativeBlock[] = registry.items.flatMap((item) =>
  item.type === 'registry:block' ? [{ name: item.name, title: item.title, description: item.description }] : [],
);
