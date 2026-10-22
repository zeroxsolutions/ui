import { PortalHost } from '@rn-primitives/portal';
import type { ReactElement } from 'react';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, View } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption, type NativeSelectProps } from './native-select';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open list from them.
configure({ defaultIncludeHiddenElements: true });

/** Upstream's example: a fruit picker whose first option asks for a choice, and a disabled option. */
function Fruit(props: Omit<NativeSelectProps, 'children'>) {
  return (
    <>
      <NativeSelect aria-label="Fruit" {...props}>
        <NativeSelectOption value="">Select a fruit</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana">Banana</NativeSelectOption>
        <NativeSelectOption value="grapes" disabled>
          Grapes
        </NativeSelectOption>
      </NativeSelect>
      <PortalHost />
    </>
  );
}

/** Upstream's grouped example, with the vegetables' group disabled. */
function Food() {
  return (
    <>
      <NativeSelect aria-label="Food">
        <NativeSelectOptGroup label="Fruits">
          <NativeSelectOption value="apple">Apple</NativeSelectOption>
          <NativeSelectOption value="banana">Banana</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Vegetables" disabled>
          <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
      <PortalHost />
    </>
  );
}

const trigger = () => screen.getByRole('combobox');
const option = (name: string) => screen.getByRole('option', { name });

describe('NativeSelect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest
      .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
      .mockImplementation((callback) => callback(0, 0, 192, 36, 20, 100));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const finishMotion = () => act(() => jest.advanceTimersByTimeAsync(300));

  async function open(ui: ReactElement) {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(ui);
    await user.press(trigger());
    await finishMotion();
    return user;
  }

  it('is a combobox named by its aria-label, showing its first option until another is chosen', async () => {
    await render(<Fruit />);

    expect(screen.getByRole('combobox', { name: 'Fruit' })).toBeCollapsed();
    expect(screen.getByText('Select a fruit')).toBeOnTheScreen();
  });

  it('opens its options and reports the value of the one chosen, then shows its label', async () => {
    const onValueChange = jest.fn();
    const user = await open(<Fruit onValueChange={onValueChange} />);

    expect(option('Select a fruit')).toBeSelected();
    await user.press(option('Banana'));
    await finishMotion();

    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(trigger()).toBeCollapsed();
    expect(screen.getByText('Banana')).toBeOnTheScreen();
  });

  it('reports an empty value when the option whose value is empty is chosen again', async () => {
    const onValueChange = jest.fn();
    const user = await open(<Fruit defaultValue="apple" onValueChange={onValueChange} />);

    await user.press(option('Select a fruit'));

    expect(onValueChange).toHaveBeenCalledWith('');
  });

  it('shows the label of the value it starts with before it is opened', async () => {
    await render(<Fruit defaultValue="banana" />);

    expect(screen.getByText('Banana')).toBeOnTheScreen();
  });

  it('follows the value its owner holds', async () => {
    await render(<Fruit value="apple" />);

    expect(screen.getByText('Apple')).toBeOnTheScreen();
  });

  it('announces a disabled option as disabled and ignores a press on it', async () => {
    const onValueChange = jest.fn();
    const user = await open(<Fruit onValueChange={onValueChange} />);

    await user.press(option('Grapes'));

    expect(option('Grapes')).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('names each group of options and disables every option of a disabled group', async () => {
    await open(<Food />);

    expect(screen.getByText('Fruits')).toBeOnTheScreen();
    expect(screen.getByText('Vegetables')).toBeOnTheScreen();
    expect(option('Apple')).toBeEnabled();
    expect(option('Carrot')).toBeDisabled();
  });

  it('starts on the first option a group holds', async () => {
    await render(<Food />);

    expect(screen.getByText('Apple')).toBeOnTheScreen();
  });

  it('ignores a press while disabled, and is announced as disabled', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Fruit disabled />);

    await user.press(trigger());
    await finishMotion();

    expect(trigger()).toBeDisabled();
    expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull();
  });

  it('draws the small size and the invalid state on its trigger', async () => {
    await render(<Fruit size="sm" aria-invalid />);

    expect(emittedClasses(trigger().props.className)).toEqual(expect.arrayContaining(['h-8', 'border-destructive']));
  });
});
