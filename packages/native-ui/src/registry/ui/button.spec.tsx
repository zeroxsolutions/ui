import { render, screen, userEvent } from '@testing-library/react-native';
import { Check } from 'lucide-react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerCSS } from 'react-native-css-interop/test';
import { parseSlotMap } from '../../build/slot-map';
import { translateClasses } from '../../build/translate';
import { Button, buttonTextVariants } from './button';
import { Icon } from './icon';
import { Text } from './text';

const SNAPSHOT_PATH = join(__dirname, '../../../styles/upstream/style-vega.css');
const SIZE_CLASS = /^size-([\d.]+)$/;

/**
 * The specs render the source, whose classes are still slot tokens, so each `cn-<slot>/icon` token
 * is registered with the size its slot translates to, and each `size-N` with Tailwind's N * 4px.
 */
function registerIconSizes(): void {
  const rules: string[] = [];
  for (const step of [3, 4, 5]) {
    rules.push(`.size-${step} { width: ${step * 4}px; height: ${step * 4}px; }`);
  }
  for (const [slot, classes] of parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'))) {
    const [, step] = SIZE_CLASS.exec(translateClasses(classes, 'nativewind', 'icon').classes.join(' ')) ?? [];
    if (step) rules.push(`.${slot}\\/icon { width: ${Number(step) * 4}px; height: ${Number(step) * 4}px; }`);
  }
  registerCSS(rules.join(' '));
}

describe('Button', () => {
  it('is a button that runs onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('announces disabled and does not run onPress when disabled', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <Button disabled onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });

    await user.press(button);

    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('hands its Text the text classes of its variant', async () => {
    await render(
      <Button variant="outline">
        <Text>Save</Text>
      </Button>,
    );

    const classes = screen.getByText('Save').props.className.split(' ');

    expect(classes).toEqual(expect.arrayContaining(buttonTextVariants({ variant: 'outline' }).split(' ')));
  });

  describe('with an Icon inside', () => {
    beforeEach(registerIconSizes);

    it.each([
      ['default', 16],
      ['xs', 12],
      ['icon-xs', 12],
    ] as const)("draws the icon at Vega's size for size %s", async (size, pixels) => {
      await render(
        <Button size={size} accessibilityLabel="Save">
          <Icon as={Check} accessible role="img" aria-label="Saved" />
        </Button>,
      );

      const { width, height } = screen.getByRole('img', { name: 'Saved' }).props;
      expect({ width, height }).toEqual({ width: pixels, height: pixels });
    });

    it('keeps the size class the icon names itself', async () => {
      await render(
        <Button accessibilityLabel="Save">
          <Icon as={Check} className="size-5" accessible role="img" aria-label="Saved" />
        </Button>,
      );

      const { width, height } = screen.getByRole('img', { name: 'Saved' }).props;
      expect({ width, height }).toEqual({ width: 20, height: 20 });
    });
  });
});
