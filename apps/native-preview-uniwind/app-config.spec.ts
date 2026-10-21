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
