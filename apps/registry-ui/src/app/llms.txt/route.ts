import { docsLlms } from '@/lib/source';
import { nativeLlmsRoute } from '@/routes/native-paths';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

/** `index` with its first heading, which fumadocs names `Docs` for every tree, replaced by `title`. */
function titled(index: string, title: string): string {
  return index.replace(/^# .*/, `# ${title}`);
}

/** The web pages, and a link to the native zone's own index of the native pages. */
export async function GET(): Promise<Response> {
  const web = titled(await docsLlms.index(), 'Web docs');
  return new Response(`${web}\n\n# Native docs\n\n- [Native docs and components](${nativeLlmsRoute.build()})`);
}
