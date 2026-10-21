import { nativeComponentsLlms, nativeDocsLlms } from '@/lib/native-source';
import { docsLlms } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

export async function GET(): Promise<Response> {
  const pages = await Promise.all([docsLlms.full(), nativeDocsLlms.full(), nativeComponentsLlms.full()]);
  return new Response(pages.join('\n\n'));
}
