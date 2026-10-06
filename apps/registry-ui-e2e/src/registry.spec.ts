import { expect, test } from './test/fixtures';

interface RegistryIndex {
  name: string;
  items: { name: string }[];
}

interface RegistryItem {
  name: string;
  files?: { path: string; content?: string }[];
}

test('the registry serves every item it lists, each file with its content', async ({ request }) => {
  // 90 items fetched from a cold worker on a shared runner outrun the default deadline.
  test.setTimeout(60_000);
  const index = await request.get('/r/registry.json');
  expect(index.status()).toBe(200);
  const registry = (await index.json()) as RegistryIndex;
  expect(registry.name).toBe('zeroxsolutions-ui');
  expect(registry.items.length).toBeGreaterThan(0);

  const problems: string[] = [];
  for (const { name } of registry.items) {
    const response = await request.get(`/r/${name}.json`);
    if (response.status() !== 200) {
      problems.push(`${name}: ${response.status()}`);
      continue;
    }
    const item = (await response.json()) as RegistryItem;
    if (!item.files?.length) problems.push(`${name}: no files`);
    for (const file of item.files ?? []) if (!file.content) problems.push(`${name}: ${file.path} has no content`);
  }
  expect(problems).toEqual([]);
});
