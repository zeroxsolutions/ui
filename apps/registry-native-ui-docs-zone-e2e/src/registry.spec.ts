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
        'code-input',
        'password-strength',
        'unsaved-changes-toolbar',
        'tab-bar',
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
