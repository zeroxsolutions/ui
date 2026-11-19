import registry from '@zeroxsolutions/native-ui/registry.json';
import { iconSets, type IconSet } from '@zeroxsolutions/ui/site/lib/icon-sets';

/**
 * Every animated icon the native registry publishes, by set, read from `registry.json` at build. A server module:
 * a client component that imported it would ship the whole registry to the browser.
 */
export const nativeIconSets: IconSet[] = iconSets(registry.items);
