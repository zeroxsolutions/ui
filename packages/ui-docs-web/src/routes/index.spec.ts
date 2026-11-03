// @vitest-environment node
import type { StaticRoute } from '@zeroxsolutions/routing';
import { describe, expect, it } from 'vitest';

import * as webRoutes from './index';

describe('web routes', () => {
  const routes = Object.values(webRoutes);
  const staticRoutes = routes.filter((route): route is StaticRoute => route.build.length === 0);

  // The pathname and the builder are two independent values, so nothing else pairs them.
  it.each(staticRoutes)('$pathname builds and matches its own pathname', (route) => {
    expect(route.build()).toBe(route.pathname);
    expect(route.matcher(route.pathname)).toBeTruthy();
  });

  it('builds a view path its own pattern reads the name back from', () => {
    expect(webRoutes.viewRoute.matcher(webRoutes.viewRoute.build({ name: 'ai-provider-picker' }))).toMatchObject({
      params: { name: 'ai-provider-picker' },
    });
  });

  it('builds the components index under a base, and reads the base back', () => {
    const built = webRoutes.componentsRoute.build({ base: 'base' });

    expect(built).toBe('/docs/components/base');
    expect(webRoutes.componentsRoute.matcher(built)).toMatchObject({ params: { base: 'base' } });
  });

  it('builds a component page under its base, and reads the base and the name back', () => {
    const built = webRoutes.componentRoute.build({ base: 'base', name: 'status-indicator' });

    expect(built).toBe('/docs/components/base/status-indicator');
    expect(webRoutes.componentRoute.matcher(built)).toMatchObject({
      params: { base: 'base', name: 'status-indicator' },
    });
  });

  it('builds the blocks page under a base, and reads the base back', () => {
    const built = webRoutes.blocksRoute.build({ base: 'base' });

    expect(built).toBe('/blocks/base');
    expect(webRoutes.blocksRoute.matcher(built)).toMatchObject({ params: { base: 'base' } });
  });

  it('builds a web docs page from its slug, and reads the segments back', () => {
    const built = webRoutes.docsPageRoute.build({ slug: 'blocks/ai-provider-picker' });

    expect(built).toBe('/docs/blocks/ai-provider-picker');
    expect(webRoutes.docsPageRoute.matcher(built)).toMatchObject({
      params: { slug: ['blocks', 'ai-provider-picker'] },
    });
  });

  it('builds a share-image path its own pattern reads the slug back from', () => {
    const built = webRoutes.docsShareImageRoute.build({ slug: 'components/button/image.png' });

    expect(built).toBe('/og/docs/components/button/image.png');
    expect(webRoutes.docsShareImageRoute.matcher(built)).toMatchObject({
      params: { slug: ['components', 'button', 'image.png'] },
    });
  });
});
