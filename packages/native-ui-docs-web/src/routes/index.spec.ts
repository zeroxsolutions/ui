// @vitest-environment node
import type { StaticRoute } from '@zeroxsolutions/routing';
import { describe, expect, it } from 'vitest';

import * as nativeRoutes from './index';

describe('native routes', () => {
  const routes = Object.values(nativeRoutes);
  const staticRoutes = routes.filter((route): route is StaticRoute => route.build.length === 0);

  // The pathname and the builder are two independent values, so nothing else pairs them.
  it.each(staticRoutes)('$pathname builds and matches its own pathname', (route) => {
    expect(route.build()).toBe(route.pathname);
    expect(route.matcher(route.pathname)).toBeTruthy();
  });

  it('builds a native docs page from its slug, and reads the segments back', () => {
    const built = nativeRoutes.nativeDocsPageRoute.build({ slug: 'installation' });

    expect(built).toBe('/native/docs/installation');
    expect(nativeRoutes.nativeDocsPageRoute.matcher(built)).toMatchObject({ params: { slug: ['installation'] } });
  });

  it('builds the native components index and the blocks page under an engine, and reads the engine back', () => {
    const components = nativeRoutes.nativeComponentsRoute.build({ engine: 'uniwind' });
    const blocks = nativeRoutes.nativeBlocksRoute.build({ engine: 'uniwind' });

    expect(components).toBe('/native/components/uniwind');
    expect(blocks).toBe('/native/blocks/uniwind');
    expect(nativeRoutes.nativeComponentsRoute.matcher(components)).toMatchObject({ params: { engine: 'uniwind' } });
    expect(nativeRoutes.nativeBlocksRoute.matcher(blocks)).toMatchObject({ params: { engine: 'uniwind' } });
  });

  it('builds a native component page under its engine, and reads the engine and the name back', () => {
    const built = nativeRoutes.nativeComponentRoute.build({ engine: 'nativewind', name: 'button' });

    expect(built).toBe('/native/components/nativewind/button');
    expect(nativeRoutes.nativeComponentRoute.matcher(built)).toMatchObject({
      params: { engine: 'nativewind', name: 'button' },
    });
  });

  it('builds a native share-image path its own pattern reads the slug back from', () => {
    const built = nativeRoutes.nativeShareImageRoute.build({ slug: 'components/button/image.png' });

    expect(built).toBe('/og/native/components/button/image.png');
    expect(nativeRoutes.nativeShareImageRoute.matcher(built)).toMatchObject({
      params: { slug: ['components', 'button', 'image.png'] },
    });
  });
});
