import { writeFile } from 'node:fs/promises';

const STYLE_FILE_PATH = 'apps/v4/registry/styles/style-vega.css';
const SNAPSHOT_URL = new URL('../styles/upstream/style-vega.css', import.meta.url);

async function main(): Promise<void> {
  const commit = process.argv[2];
  if (!commit || !/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error('usage: sync-upstream-styles <40-character shadcn-ui/ui commit sha>');
  }
  const url = `https://raw.githubusercontent.com/shadcn-ui/ui/${commit}/${STYLE_FILE_PATH}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`fetching ${url} answered ${response.status}`);
  }
  await writeFile(SNAPSHOT_URL, Buffer.from(await response.arrayBuffer()));
}

await main();
