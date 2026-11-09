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

test('serves the react native items for each engine in each style', async ({ request }) => {
  const styles = ['vega', 'luma', 'lyra', 'maia', 'mira', 'nova', 'rhea', 'sera'];
  for (const nativeStyle of styles.flatMap((style) => [`nativewind-${style}`, `uniwind-${style}`])) {
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
        'status-indicator',
        'unsaved-indicator',
        'icon-media',
        'icon-label',
        'center',
        'page-container',
        'panel-header',
        'panel-row',
        'panel-field-group',
        'collapsible-card',
        'reasoning-collapsible',
        'copy-button',
        'file-type-icon',
        'font-preview',
        'image-preview',
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
