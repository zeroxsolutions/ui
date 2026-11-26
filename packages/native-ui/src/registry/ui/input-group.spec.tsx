import { render, screen, userEvent } from '@testing-library/react-native';
import { Search, X } from 'lucide-react-native';
import { createRef } from 'react';
import type { TextInputInstance } from 'react-native';
import { Icon } from './icon';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';

// React Native's jest mock gives every TextInput one shared `focus` mock, so its calls carry over between tests.
afterEach(() => {
  jest.clearAllMocks();
});

describe('InputGroup', () => {
  it("takes what is typed into its input and still calls the caller's onFocus", async () => {
    const onFocus = jest.fn();
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await render(
      <InputGroup>
        <InputGroupInput aria-label="Search" onFocus={onFocus} onChangeText={onChangeText} />
      </InputGroup>,
    );

    await user.type(screen.getByLabelText('Search'), 'docs');

    expect(onChangeText).toHaveBeenLastCalledWith('docs');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('announces its input disabled when the input is not editable', async () => {
    await render(
      <InputGroup>
        <InputGroupAddon>
          <Icon as={Search} />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" editable={false} />
      </InputGroup>,
    );

    expect(screen.getByLabelText('Search')).toBeDisabled();
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

  it('focuses its input when an addon is pressed, and hands the caller the input', async () => {
    const ref = createRef<TextInputInstance>();
    const user = userEvent.setup();
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

    await user.press(screen.getByTestId('addon'));

    expect(focus).toHaveBeenCalledTimes(1);
  });
});

describe('InputGroupTextarea', () => {
  it('is a multiline field announced disabled when it is not editable', async () => {
    await render(
      <InputGroup>
        <InputGroupTextarea aria-label="Message" editable={false} />
        <InputGroupAddon align="block-end">
          <InputGroupText>52% used</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    expect(screen.getByLabelText('Message')).toHaveProp('multiline', true);
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('is focused by a press on an addon, and hands the caller the field', async () => {
    const ref = createRef<TextInputInstance>();
    const user = userEvent.setup();
    await render(
      <InputGroup>
        <InputGroupTextarea ref={ref} />
        <InputGroupAddon align="block-end" testID="addon">
          <InputGroupText>Send</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );
    if (!ref.current) throw new Error('InputGroupTextarea gave the caller no field');
    const focus = jest.spyOn(ref.current, 'focus');

    await user.press(screen.getByTestId('addon'));

    expect(focus).toHaveBeenCalledTimes(1);
  });
});

describe('InputGroupButton', () => {
  it('is a button announced by its name that calls onPress without focusing the input', async () => {
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
  });
});
