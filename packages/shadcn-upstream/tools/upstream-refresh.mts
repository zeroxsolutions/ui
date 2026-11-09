/**
 * Overwrites `snapshot/` with shadcn's style sheets and colours at one shadcn-ui/ui commit, the one given
 * as the first argument or else the head of `main`, with the names of the `registry:ui` and
 * `registry:hook` items upstream's site lists today, and with upstream's base items at that commit and
 * the `cn-` tokens each writes.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';

/** Each upstream file the build reads, by its path in shadcn-ui/ui and the snapshot it overwrites. */
const SNAPSHOTS = [
  ...(['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const).map((style) => ({
    upstreamPath: `apps/v4/registry/styles/style-${style}.css`,
    snapshot: `../snapshot/style-${style}.css`,
  })),
  // The file https://ui.shadcn.com/r/colors/neutral.json serves, taken at the same commit as the style.
  { upstreamPath: 'apps/v4/public/r/colors/neutral.json', snapshot: '../snapshot/colors-neutral.json' },
  // The site's stylesheet, whose `@theme inline` block derives the radius scale from `--radius`.
  { upstreamPath: 'apps/v4/app/globals.css', snapshot: '../snapshot/globals.css' },
];

// Upstream builds this file when it deploys the site and does not commit it, so it cannot be read at a
// commit; it is the list as the site serves it on the day of the refresh.
const UPSTREAM_REGISTRY = 'https://ui.shadcn.com/r/styles/base-vega/registry.json';
const ITEM_LIST = '../snapshot/registry-ui-items.json';
const HOOK_LIST = '../snapshot/registry-hook-items.json';
const BASE_ITEMS = 'apps/v4/registry/bases/base/ui/';
const BASE_ITEM_SLOTS = '../snapshot/base-item-slots.json';
const BASE_SOURCES = '../snapshot/bases/base/ui/';

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

/**
 * Saves each `bases/base/ui/<name>.tsx` at `commit` under `snapshot/bases/base/ui/`, in place of the
 * previous ones, and returns the `cn-` tokens each writes, sorted, by `<name>`.
 */
async function baseItems(commit: string): Promise<Record<string, string[]>> {
  const tree = (await (
    await fetchOk(`https://api.github.com/repos/shadcn-ui/ui/git/trees/${commit}?recursive=1`)
  ).json()) as { tree: { path: string }[]; truncated: boolean };
  if (tree.truncated) throw new Error(`the tree of shadcn-ui/ui ${commit} came back truncated`);
  const paths = tree.tree
    .map((entry) => entry.path)
    .filter((path) => path.startsWith(BASE_ITEMS) && /^[^/]+\.tsx$/.test(path.slice(BASE_ITEMS.length)))
    .sort();
  const directory = new URL(BASE_SOURCES, import.meta.url);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  const slots: Record<string, string[]> = {};
  for (const path of paths) {
    const source = await (await fetchOk(`https://raw.githubusercontent.com/shadcn-ui/ui/${commit}/${path}`)).text();
    const name = path.slice(BASE_ITEMS.length);
    await writeFile(new URL(name, directory), source);
    slots[name.slice(0, -'.tsx'.length)] = [...new Set(source.match(/\bcn-[a-z0-9-]+/g) ?? [])].sort();
  }
  return slots;
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
  const slots = await baseItems(commit);
  await writeFile(new URL(BASE_ITEM_SLOTS, import.meta.url), `${JSON.stringify(slots, null, 2)}\n`);

  console.log(
    `snapshot: shadcn-ui/ui ${commit}, ${names.length} registry:ui items, ${hooks.length} registry:hook items, ${Object.keys(slots).length} base items`,
  );
}

await main();
