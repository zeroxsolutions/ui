import { createStaticRoute } from '@zeroxsolutions/routing';

/**
 * The native docs' introduction, which the native zone answers on the same host, written again here with
 * the value of `@zeroxsolutions/native-ui-docs-web`'s `routes`, which this zone may not import; a link
 * built from it is a plain anchor.
 */
export const nativeDocsRoute = createStaticRoute('/native/docs', () => '/native/docs');
