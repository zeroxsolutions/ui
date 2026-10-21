import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Search, X } from 'lucide-react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRef } from 'react';
import type { TextInputInstance } from 'react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { parseSlotMap } from '../../build/slot-map';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { translateClasses } from '../../build/translate';
import { Icon } from './icon';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from './input-group';
import { Text } from './text';

const SNAPSHOT_PATH = join(__dirname, '../../../styles/upstream/style-vega.css');

// React Native's jest mock gives every TextInput one shared `focus` mock, so its calls carry over between tests.
afterEach(() => {
  jest.clearAllMocks();
});

function classesOf(testID: string, style: 'vega' | 'nova' = 'vega'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
}

describe('InputGroup', () => {
  it('takes the focus border while its input holds focus and gives it back on blur', async () => {
    const onFocus = jest.fn();
    await render(
      <InputGroup testID="group">
        <InputGroupInput testID="field" onFocus={onFocus} />
      </InputGroup>,
    );

    await fireEvent(screen.getByTestId('field'), 'focus');
    expect(classesOf('group')).toContain('border-ring');
    expect(onFocus).toHaveBeenCalledTimes(1);

    await fireEvent(screen.getByTestId('field'), 'blur');
    expect(classesOf('group')).not.toContain('border-ring');
  });

  it('draws the destructive border around the whole group while its input is invalid, focused or not', async () => {
    await render(
      <InputGroup testID="group">
        <InputGroupInput testID="field" aria-invalid />
      </InputGroup>,
    );
    expect(classesOf('group')).toContain('border-destructive');

    await fireEvent(screen.getByTestId('field'), 'focus');
    expect(classesOf('group')).toContain('border-destructive');
    expect(classesOf('group')).not.toContain('border-ring');
  });

  it('dims its addons and announces its input disabled when the input is not editable', async () => {
    await render(
      <InputGroup testID="group">
        <InputGroupAddon testID="addon">
          <Icon as={Search} />
        </InputGroupAddon>
        <InputGroupInput testID="field" editable={false} />
      </InputGroup>,
    );

    expect(screen.getByTestId('field').props['aria-disabled']).toBe(true);
    expect(classesOf('addon')).toContain('opacity-50');
    expect(classesOf('group', 'nova')).toContain('opacity-50');
  });

  it('draws its input without a border of its own, inside the border of the group', async () => {
    await render(
      <InputGroup testID="group">
        <InputGroupInput testID="field" />
      </InputGroup>,
    );

    expect(classesOf('field')).toContain('border-0');
    expect(classesOf('group')).toContain('border');
  });

  it('puts a start addon before the input and an end addon after it, wherever the caller wrote them', async () => {
    await render(
      <InputGroup>
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Domain" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    expect(screen.getAllByText(/^(https:\/\/|\.com)$/).map((text) => text.props.children)).toEqual([
      'https://',
      '.com',
    ]);
  });

  it('stacks into a column with a block addon, the input spanning its width', async () => {
    await render(
      <InputGroup testID="group">
        <InputGroupInput testID="field" />
        <InputGroupAddon align="block-end">
          <InputGroupText>120 characters left</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    expect(classesOf('group')).toEqual(expect.arrayContaining(['flex-col', 'h-auto']));
    expect(classesOf('field')).toContain('w-full');
    expect(classesOf('field')).not.toContain('flex-1');
  });

  it('focuses its input when an addon is pressed, and hands the caller the input', async () => {
    const ref = createRef<TextInputInstance>();
    await render(
      <InputGroup>
        <InputGroupAddon testID="addon">
          <Icon as={Search} />
        </InputGroupAddon>
        <InputGroupInput ref={ref} />
      </InputGroup>,
    );
    if (!ref.current) throw new Error('InputGroupInput gave the caller no input');
    const focus = jest.spyOn(ref.current, 'focus');

    await fireEvent.press(screen.getByTestId('addon'));

    expect(focus).toHaveBeenCalledTimes(1);
  });
});

describe('InputGroupButton', () => {
  it('is a ghost button announced by its name that calls onPress without focusing the input', async () => {
    const onPress = jest.fn();
    const ref = createRef<TextInputInstance>();
    await render(
      <InputGroup>
        <InputGroupInput ref={ref} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear" onPress={onPress}>
            <Icon as={X} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    if (!ref.current) throw new Error('InputGroupInput gave the caller no input');
    const focus = jest.spyOn(ref.current, 'focus');

    await userEvent.setup().press(screen.getByRole('button', { name: 'Clear' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(focus).not.toHaveBeenCalled();
    expect(emittedClasses(screen.getByRole('button').props.className)).toContain('size-6');
  });

  it('draws an icon in its default xs size at 14px', async () => {
    // The spec renders the source, whose icon class is still the slot token, so the token is
    // registered with the size the build translates it to.
    const [xsIconSize] = translateClasses(
      parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8')).get('cn-input-group-button-size-xs') ?? [],
      'nativewind',
      'icon',
    ).classes;
    expect(xsIconSize).toBe('size-3.5');
    registerCSS('.cn-input-group-button-size-xs\\/icon { width: 14px; height: 14px; }');
    await render(
      <InputGroupButton>
        <Icon as={X} accessible role="img" aria-label="Clear" />
        <Text>Clear</Text>
      </InputGroupButton>,
    );

    expect(screen.getByRole('img', { name: 'Clear' }).props).toEqual(
      expect.objectContaining({ width: 14, height: 14 }),
    );
  });
});
