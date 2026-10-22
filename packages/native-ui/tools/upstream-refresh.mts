/**
 * Overwrites `styles/upstream/` with shadcn's style sheets and colours at one shadcn-ui/ui commit, the
 * one given as the first argument or else the head of `main`, and with the names of the `registry:ui` and
 * `registry:hook` items upstream's site lists today.
 */
import { writeFile } from 'node:fs/promises';

/** Each upstream file the build reads, by its path in shadcn-ui/ui and the snapshot it overwrites. */
const SNAPSHOTS = [
  { upstreamPath: 'apps/v4/registry/styles/style-vega.css', snapshot: '../styles/upstream/style-vega.css' },
  { upstreamPath: 'apps/v4/registry/styles/style-nova.css', snapshot: '../styles/upstream/style-nova.css' },
  // The file https://ui.shadcn.com/r/colors/neutral.json serves, taken at the same commit as the style.
  { upstreamPath: 'apps/v4/public/r/colors/neutral.json', snapshot: '../styles/upstream/colors-neutral.json' },
  // The site's stylesheet, whose `@theme inline` block derives the radius scale from `--radius`.
  { upstreamPath: 'apps/v4/app/globals.css', snapshot: '../styles/upstream/globals.css' },
] as const;

// Upstream builds this file when it deploys the site and does not commit it, so it cannot be read at a
// commit; it is the list as the site serves it on the day of the refresh.
const UPSTREAM_REGISTRY = 'https://ui.shadcn.com/r/styles/base-vega/registry.json';
const ITEM_LIST = '../styles/upstream/registry-ui-items.json';
const HOOK_LIST = '../styles/upstream/registry-hook-items.json';

async function fetchOk(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`fetching ${url} answered ${response.status}`);
  }
  return response;
}

async function headOfMain(): Promise<string> {
  const response = await fetchOk('https://api.github.com/repos/shadcn-ui/ui/commits/main', {
    headers: { Accept: 'application/vnd.github.sha' },
  });
  return (await response.text()).trim();
}

async function main(): Promise<void> {
  const commit = process.argv[2] ?? (await headOfMain());
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`usage: upstream-refresh [40-character shadcn-ui/ui commit sha], not ${commit}`);
  }
  for (const { upstreamPath, snapshot } of SNAPSHOTS) {
    const response = await fetchOk(`https://raw.githubusercontent.com/shadcn-ui/ui/${commit}/${upstreamPath}`);
    await writeFile(new URL(snapshot, import.meta.url), Buffer.from(await response.arrayBuffer()));
  }

  const registry = (await (await fetchOk(UPSTREAM_REGISTRY)).json()) as {
    items: { name: string; type: string }[];
  };
  const namesOf = (type: string) => registry.items.filter((item) => item.type === type).map((item) => item.name);
  const names = namesOf('registry:ui');
  const hooks = namesOf('registry:hook');
  await writeFile(new URL(ITEM_LIST, import.meta.url), `${JSON.stringify(names.sort(), null, 2)}\n`);
  await writeFile(new URL(HOOK_LIST, import.meta.url), `${JSON.stringify(hooks.sort(), null, 2)}\n`);

  console.log(
    `styles/upstream: shadcn-ui/ui ${commit}, ${names.length} registry:ui items, ${hooks.length} registry:hook items`,
  );
}

await main();
