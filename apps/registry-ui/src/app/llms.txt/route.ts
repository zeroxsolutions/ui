import { nativeComponentsLlms, nativeDocsLlms } from '@/lib/native-source';
import { docsLlms } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

/** `index` with its first heading, which fumadocs names `Docs` for every tree, replaced by `title`. */
function titled(index: string, title: string): string {
  return index.replace(/^# .*/, `# ${title}`);
}

export async function GET(): Promise<Response> {
  const indexes = await Promise.all([
    docsLlms.index().then((index) => titled(index, 'Web docs')),
    nativeDocsLlms.index().then((index) => titled(index, 'Native docs')),
    nativeComponentsLlms.index().then((index) => titled(index, 'Native components')),
  ]);
  return new Response(indexes.join('\n\n'));
}
