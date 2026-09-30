import { docsLlms } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

export async function GET(): Promise<Response> {
  return new Response(await docsLlms.full());
}
