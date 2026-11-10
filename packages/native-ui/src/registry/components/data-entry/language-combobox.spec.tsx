import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent, within } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import type { LanguageOption } from '../../lib/language-options';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '../../ui/combobox';
import { Text } from '../../ui/text';
import { LanguageCombobox, type LanguageComboboxProps } from './language-combobox';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open list from them.
configure({ defaultIncludeHiddenElements: true });

/** The picker as its demo composes it: the chosen label in the trigger, over a searched list of every option. */
function Picker(props: Omit<LanguageComboboxProps, 'children'>) {
  return (
    <>
      <LanguageCombobox {...props}>
        <ComboboxTrigger aria-label="Select language">
          <ComboboxValue placeholder="Select" />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search language..." />
          <ComboboxEmpty>No results.</ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.value} value={option.value}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </LanguageCombobox>
      <PortalHost />
    </>
  );
}

const trigger = () => screen.getByRole('combobox', { name: 'Select language' });
const options = () => screen.getAllByRole('option').map((option) => within(option).getByText(/.+/).props.children);

describe('LanguageCombobox', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    // Where a device lays the trigger out, which the list is placed against.
    jest
      .spyOn(
        View.prototype as unknown as {
          measure: (callback: (...args: number[]) => void) => void;
        },
        'measure',
      )
      .mockImplementation((callback) => callback(0, 0, 256, 36, 20, 100));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const setUp = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const finishMotion = () => act(() => jest.advanceTimersByTimeAsync(300));

  async function open(user: ReturnType<typeof setUp>) {
    await user.press(trigger());
    await finishMotion();
  }

  it('shows the current code language in the trigger', async () => {
    await render(<Picker kind="code" value="typescript" onValueChange={jest.fn()} />);

    expect(within(trigger()).getByText('TypeScript')).toBeOnTheScreen();
  });

  it('shows a code alias as its language, chosen in the list', async () => {
    const user = setUp();
    await render(<Picker kind="code" value="ts" onValueChange={jest.fn()} />);

    expect(within(trigger()).getByText('TypeScript')).toBeOnTheScreen();
    await open(user);
    expect(screen.getByRole('option', { name: 'TypeScript' })).toBeSelected();
  });

  it('offers every built-in code language', async () => {
    const user = setUp();
    await render(<Picker kind="code" value="typescript" onValueChange={jest.fn()} />);

    await open(user);

    expect(options()).toEqual(expect.arrayContaining(['Markdown', 'TypeScript', 'Python', 'C++', 'Lua']));
  });

  it('shows a value no option carries as the value itself', async () => {
    await render(<Picker kind="code" value="zig" onValueChange={jest.fn()} />);

    expect(within(trigger()).getByText('zig')).toBeOnTheScreen();
  });

  it('labels a locale value with its own name and offers only it when no locales are given', async () => {
    const user = setUp();
    await render(<Picker value="en" onValueChange={jest.fn()} />);

    expect(within(trigger()).getByText('English')).toBeOnTheScreen();
    await open(user);
    expect(options()).toEqual(['English']);
  });

  it('offers the locales given, each by its own name', async () => {
    const user = setUp();
    await render(<Picker value="en" locales={['en', 'fr', 'vi']} onValueChange={jest.fn()} />);

    await open(user);

    expect(options()).toEqual(['English', 'fran\u00e7ais', 'Ti\u1ebfng Vi\u1ec7t']);
  });

  it("reports the picked option's value and closes the list", async () => {
    const user = setUp();
    const onValueChange = jest.fn();
    await render(<Picker kind="code" value="typescript" onValueChange={onValueChange} />);
    await open(user);

    await user.press(screen.getByRole('option', { name: 'Python' }));
    await finishMotion();

    expect(onValueChange.mock.calls).toEqual([['python']]);
    expect(trigger()).not.toBeExpanded();
  });

  it('offers the options given in place of the built-in ones', async () => {
    const user = setUp();
    await render(
      <Picker kind="code" value="x" options={[{ value: 'x', label: 'Custom X' }]} onValueChange={jest.fn()} />,
    );

    expect(within(trigger()).getByText('Custom X')).toBeOnTheScreen();
    await open(user);
    expect(options()).toEqual(['Custom X']);
  });

  it("draws a given option's icon where the caller composes it, and still finds the option by its label", async () => {
    const user = setUp();
    const given: LanguageOption[] = [
      {
        value: 'typescript',
        label: 'TypeScript',
        icon: <View testID="typescript-icon" />,
      },
      { value: 'python', label: 'Python', icon: <View testID="python-icon" /> },
    ];
    const iconOf = (value: string | undefined): ReactNode => given.find((option) => option.value === value)?.icon;
    await render(
      <>
        <LanguageCombobox kind="code" value="ts" options={given} onValueChange={jest.fn()}>
          <ComboboxTrigger aria-label="Select language">
            <ComboboxValue>
              {(values) => (
                <>
                  {iconOf(values[0])}
                  <Text>{values[0]}</Text>
                </>
              )}
            </ComboboxValue>
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxInput placeholder="Search language..." />
            <ComboboxList>
              {(option) => (
                <ComboboxItem key={option.value} value={option.value}>
                  {iconOf(option.value)}
                  <Text>{option.label}</Text>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </LanguageCombobox>
        <PortalHost />
      </>,
    );

    expect(within(trigger()).getByTestId('typescript-icon')).toBeOnTheScreen();
    await open(user);
    await user.type(screen.getByPlaceholderText('Search language...'), 'Pyth');

    expect(options()).toEqual(['Python']);
    expect(within(screen.getByRole('option', { name: 'Python' })).getByTestId('python-icon')).toBeOnTheScreen();
  });
});
