/**
 * @jest-environment node
 */
import { getConfig } from 'expo/config';
import { Updates } from 'expo/config-plugins';

describe('the app config', () => {
  it.each(['ios', 'android'] as const)(
    'publishes %s updates for the runtime Expo Go of its SDK asks for, exposdk:<sdk>',
    async (platform) => {
      const { exp } = getConfig(__dirname);

      expect(exp.sdkVersion).toMatch(/^\d+\.0\.0$/);
      await expect(Updates.getRuntimeVersionAsync(__dirname, exp, platform)).resolves.toBe(`exposdk:${exp.sdkVersion}`);
    },
  );
});

describe('the style an update names', () => {
  const previous = process.env.PREVIEW_STYLE;

  afterEach(() => {
    if (previous === undefined) delete process.env.PREVIEW_STYLE;
    else process.env.PREVIEW_STYLE = previous;
  });

  it('is PREVIEW_STYLE, in the manifest every update of the one export carries', () => {
    process.env.PREVIEW_STYLE = 'lyra';

    expect(getConfig(__dirname).exp.extra?.previewStyle).toBe('lyra');
  });

  it('throws at publish time on a style the native registries are not built in', () => {
    process.env.PREVIEW_STYLE = 'base-nova';

    expect(() => getConfig(__dirname)).toThrow('PREVIEW_STYLE is base-nova');
  });
});
