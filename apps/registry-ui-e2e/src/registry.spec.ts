import { expect, test } from './test/fixtures';

interface RegistryIndex {
  name: string;
  items: { name: string }[];
}

interface RegistryItem {
  name: string;
  files?: { path: string; content?: string }[];
  registryDependencies?: string[];
}

/** Every base style zui publishes under, as the design names them. */
const BASE_STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'];

test('the registry serves every item it lists under each base style, each file with its content', async ({
  request,
}) => {
  // Every item under every style, fetched from a cold worker on a shared runner, outruns the default deadline.
  test.setTimeout(120_000);
  const problems: string[] = [];
  for (const style of BASE_STYLES) {
    const root = `/r/styles/base-${style}`;
    const index = await request.get(`${root}/registry.json`);
    expect(index.status(), `${root}/registry.json`).toBe(200);
    const registry = (await index.json()) as RegistryIndex;
    expect(registry.name).toBe('zui');
    expect(registry.items.length).toBeGreaterThan(0);

    await Promise.all(
      registry.items.map(async ({ name }) => {
        const response = await request.get(`${root}/${name}.json`);
        if (response.status() !== 200) {
          problems.push(`${style}/${name}: ${response.status()}`);
          return;
        }
        const item = (await response.json()) as RegistryItem;
        if (!item.files?.length) problems.push(`${style}/${name}: no files`);
        for (const file of item.files ?? [])
          if (!file.content) problems.push(`${style}/${name}: ${file.path} has no content`);
      }),
    );
  }
  expect(problems).toEqual([]);
});

test('the old item and index paths redirect once to base-nova', async ({ request }) => {
  for (const [from, to] of [
    ['/r/status-indicator.json', '/r/styles/base-nova/status-indicator.json'],
    ['/r/registry.json', '/r/styles/base-nova/registry.json'],
  ]) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(new URL(response.headers()['location'], 'http://x').pathname).toBe(to);
  }
});

test('serves the react native items for each engine in vega and nova', async ({ request }) => {
  for (const nativeStyle of ['nativewind-vega', 'uniwind-vega', 'nativewind-nova', 'uniwind-nova']) {
    const root = `/r/styles/${nativeStyle}`;
    const index = await request.get(`${root}/registry.json`);
    expect(index.status(), `${root}/registry.json`).toBe(200);
    const registry = (await index.json()) as RegistryIndex;
    expect(registry.name).toBe('zui');
    expect(registry.items.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'button',
        'icon',
        'text',
        'switch',
        'tabs',
        'spinner',
        'input-group',
        'input-otp',
        'password-input',
        'password-strength',
      ]),
    );

    const response = await request.get(`${root}/button.json`);
    expect(response.status(), `${root}/button.json`).toBe(200);
    const button = (await response.json()) as RegistryItem;
    expect(button.files?.length).toBeGreaterThan(0);
    for (const file of button.files ?? []) expect(file.content, file.path).toBeTruthy();
    expect(button.registryDependencies).toContain('@zui/text');
  }
});
