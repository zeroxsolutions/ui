import { writeFile } from 'node:fs/promises';

/** Each upstream file the build reads, by its path in shadcn-ui/ui and the snapshot it overwrites. */
const SNAPSHOTS = [
  { upstreamPath: 'apps/v4/registry/styles/style-vega.css', snapshot: '../styles/upstream/style-vega.css' },
  // The file https://ui.shadcn.com/r/colors/neutral.json serves, taken at the same commit as the style.
  { upstreamPath: 'apps/v4/public/r/colors/neutral.json', snapshot: '../styles/upstream/colors-neutral.json' },
  // The site's stylesheet, whose `@theme inline` block derives the radius scale from `--radius`.
  { upstreamPath: 'apps/v4/app/globals.css', snapshot: '../styles/upstream/globals.css' },
] as const;

async function main(): Promise<void> {
  const commit = process.argv[2];
  if (!commit || !/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error('usage: sync-upstream-styles <40-character shadcn-ui/ui commit sha>');
  }
  for (const { upstreamPath, snapshot } of SNAPSHOTS) {
    const url = `https://raw.githubusercontent.com/shadcn-ui/ui/${commit}/${upstreamPath}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`fetching ${url} answered ${response.status}`);
    }
    await writeFile(new URL(snapshot, import.meta.url), Buffer.from(await response.arrayBuffer()));
  }
}

await main();
