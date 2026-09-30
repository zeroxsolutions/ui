import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

import { docsRoute } from '@/routes/app-routes';

export const source = loader({
  baseUrl: docsRoute.build(),
  source: docs.toFumadocsSource(),
});
