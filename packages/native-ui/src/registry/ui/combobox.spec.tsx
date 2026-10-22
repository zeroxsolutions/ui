import { PortalHost } from '@rn-primitives/portal';
import { useState } from 'react';
import { act, configure, fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { AccessibilityInfo, View } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from './combobox';
import type { ComboboxProps } from './combobox';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open list from them.
configure({ defaultIncludeHiddenElements: true });

const FRAMEWORKS = [
  { label: 'Next.js', value: 'next' },
  { label: 'SvelteKit', value: 'sveltekit' },
  { label: 'Nuxt.js', value: 'nuxt' },
  { label: 'Remix', value: 'remix' },
];

/** Upstream's popup demo: a trigger showing the chosen framework, over a searched list of them. */
function Framework({ root }: { root?: ComboboxProps }) {
  return (
    <>
      <Combobox items={FRAMEWORKS} {...root}>
        <ComboboxTrigger testID="trigger" aria-label="Framework">
          <ComboboxValue placeholder="Select a framework" />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search framework..." />
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(framework) => (
              <ComboboxItem key={framework.value} value={framework.value} disabled={framework.value === 'remix'}>
                {framework.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <PortalHost />
    </>
  );
}

const trigger = () => screen.getByTestId('trigger');
const search = () => screen.getByPlaceholderText('Search framework...');
const option = (name: string) => screen.getByRole('option', { name });

/** Where a device lays the trigger out on the screen. */
function layOutTrigger() {
  jest
    .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
    .mockImplementation((callback) => callback(0, 0, 256, 36, 20, 100));
}

describe('Combobox', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    layOutTrigger();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const finishMotion = () => act(() => jest.advanceTimersByTimeAsync(300));
  const setUp = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  async function open(root?: ComboboxProps) {
    const user = setUp();
    await render(<Framework root={root} />);
    await user.press(trigger());
    await finishMotion();
    return user;
  }

  it('is a collapsed combobox showing its placeholder, muted, until something is chosen', async () => {
    await render(<Framework />);

    expect(trigger()).toHaveProp('role', 'combobox');
    expect(trigger()).toBeCollapsed();
    expect(emittedClasses(screen.getByText('Select a framework').props.className)).toContain('text-muted-foreground');
    expect(screen.queryByPlaceholderText('Search framework...')).toBeNull();
  });

  it('opens a searchable list of its items when its trigger is pressed', async () => {
    await open();

    expect(trigger()).toBeExpanded();
    expect(search()).toBeOnTheScreen();
    expect(option('Next.js')).toBeOnTheScreen();
    expect(option('Nuxt.js')).toBeOnTheScreen();
  });

  it('filters the list by the typed text, and says so when nothing matches', async () => {
    const user = await open();

    await user.type(search(), 'nu');
    expect(option('Nuxt.js')).toBeOnTheScreen();
    expect(screen.queryByRole('option', { name: 'Next.js' })).toBeNull();
    expect(screen.queryByText('No framework found.')).toBeNull();

    await user.type(search(), 'zz');
    expect(screen.getByText('No framework found.')).toBeOnTheScreen();
  });

  it("shows the chosen item's label, closes, and reports its value", async () => {
    const onValueChange = jest.fn();
    const user = await open({ onValueChange });

    await user.press(option('SvelteKit'));
    await finishMotion();

    expect(onValueChange).toHaveBeenCalledWith('sveltekit');
    expect(screen.queryByPlaceholderText('Search framework...')).toBeNull();
    expect(trigger()).toBeCollapsed();
    expect(screen.getByText('SvelteKit')).toBeOnTheScreen();
    expect(emittedClasses(screen.getByText('SvelteKit').props.className)).not.toContain('text-muted-foreground');
  });

  it('announces the chosen item as selected, with a check mark beside it', async () => {
    await open({ defaultValue: 'nuxt' });

    expect(option('Nuxt.js')).toBeSelected();
    expect(option('Next.js')).not.toBeSelected();
    expect(screen.getAllByTestId('command-check')).toHaveLength(1);
  });

  it("highlights the chosen item as the list opens, in the combobox's accent colour", async () => {
    await open({ defaultValue: 'nuxt' });

    expect(emittedClasses(option('Nuxt.js').props.className)).toContain('bg-accent');
    expect(emittedClasses(option('Next.js').props.className)).not.toContain('bg-accent');
    expect(emittedClasses(within(option('Nuxt.js')).getByText('Nuxt.js').props.className)).toContain(
      'text-accent-foreground',
    );
  });

  it('keeps apart two items that share a label, highlighting and choosing each by its value', async () => {
    const onValueChange = jest.fn();
    const user = setUp();
    await render(
      <>
        <Combobox defaultValue="paris-tx" onValueChange={onValueChange}>
          <ComboboxTrigger testID="trigger" aria-label="City">
            <ComboboxValue placeholder="Select a city" />
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxInput placeholder="Search framework..." />
            <ComboboxList>
              <ComboboxItem value="paris-fr" label="Paris" testID="france">
                <Text>Paris, France</Text>
              </ComboboxItem>
              <ComboboxItem value="paris-tx" label="Paris" testID="texas">
                <Text>Paris, Texas</Text>
              </ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <PortalHost />
      </>,
    );
    await user.press(trigger());
    await finishMotion();

    expect(emittedClasses(screen.getByTestId('texas').props.className)).toContain('bg-accent');
    expect(emittedClasses(screen.getByTestId('france').props.className)).not.toContain('bg-accent');

    await fireEvent(search(), 'submitEditing');
    expect(onValueChange).toHaveBeenCalledWith('paris-tx');
  });

  it('shows the label of a value it starts with before it is opened', async () => {
    await render(<Framework root={{ defaultValue: 'nuxt' }} />);

    expect(screen.getByText('Nuxt.js')).toBeOnTheScreen();
  });

  it('chooses the first match on the return key', async () => {
    const onValueChange = jest.fn();
    const user = await open({ onValueChange });

    await user.type(search(), 'svel');
    await fireEvent(search(), 'submitEditing');

    expect(onValueChange).toHaveBeenCalledWith('sveltekit');
  });

  it('announces a disabled item as disabled and ignores a press on it', async () => {
    const onValueChange = jest.fn();
    const user = await open({ onValueChange });

    await user.press(option('Remix'));

    expect(option('Remix')).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('follows the value and the open state its owner holds', async () => {
    function Owned() {
      const [framework, setFramework] = useState('next');
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <Framework root={{ value: framework, onValueChange: setFramework, open: isOpen, onOpenChange: setOpen }} />
          <View testID="owner" accessibilityLabel={`${framework} ${String(isOpen)}`} />
        </>
      );
    }
    const user = setUp();
    await render(<Owned />);
    expect(screen.getByText('Next.js')).toBeOnTheScreen();

    await user.press(trigger());
    await finishMotion();
    expect(screen.getByTestId('owner')).toHaveProp('accessibilityLabel', 'next true');

    await user.press(option('Nuxt.js'));
    await finishMotion();
    expect(screen.getByTestId('owner')).toHaveProp('accessibilityLabel', 'nuxt false');
    expect(screen.getByText('Nuxt.js')).toBeOnTheScreen();
  });
});
