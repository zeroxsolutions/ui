import { PortalHost } from '@rn-primitives/portal';
import { useState } from 'react';
import { act, configure, fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { AccessibilityInfo, View } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
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

  it('sets an item and an empty message written with a value inside them in one Text, and names the item by it', async () => {
    const user = setUp();
    const seats = 4;
    await render(
      <>
        <Combobox items={[{ label: 'Team', value: 'team' }]}>
          <ComboboxTrigger testID="trigger" aria-label="Plan">
            <ComboboxValue placeholder="Select a plan" />
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxInput placeholder="Search framework..." />
            <ComboboxEmpty>No plan with {seats} seats.</ComboboxEmpty>
            <ComboboxList>
              <ComboboxItem value="team">Team ({seats} seats)</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <PortalHost />
      </>,
    );
    await user.press(trigger());
    await finishMotion();

    expect(option('Team (4 seats)')).toBeOnTheScreen();
    await user.type(search(), 'zz');
    expect(screen.getByText('No plan with 4 seats.')).toBeOnTheScreen();
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

  it("draws the check mark over the end of the item's padding, as upstream does", async () => {
    await open({ defaultValue: 'nuxt' });
    let box = screen.getByTestId('command-check').parent;
    while (box && typeof box.props.className !== 'string') box = box.parent;

    expect(emittedClasses(box?.props.className)).toEqual(expect.arrayContaining(['absolute', 'right-2', 'size-4']));
    expect(emittedClasses(option('Nuxt.js').props.className)).toContain('pr-8');
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

/** Upstream's multiple demo: chips of the chosen frameworks before a field that opens a searched list of them. */
function Frameworks({ root }: { root?: Omit<Extract<ComboboxProps, { multiple: true }>, 'multiple'> }) {
  return (
    <>
      <Combobox multiple items={FRAMEWORKS} {...root}>
        <ComboboxChips testID="chips">
          <ComboboxValue>
            {(values) =>
              values.map((value) => (
                <ComboboxChip key={value} value={value} testID={`chip-${value}`}>
                  {FRAMEWORKS.find((framework) => framework.value === value)?.label}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput aria-label="Frameworks" placeholder="Add framework" />
          <ComboboxClear />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxInput placeholder="Search framework..." />
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
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

describe('Combobox with multiple', () => {
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
  const field = () => screen.getByRole('combobox', { name: 'Frameworks' });

  it('is a collapsed combobox, named by its label, showing its placeholder', async () => {
    await render(<Frameworks />);

    expect(field()).toBeCollapsed();
    expect(screen.getByText('Add framework')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('opens the list from its field, keeping it open as items are chosen, each shown as a chip', async () => {
    const onValueChange = jest.fn();
    const user = setUp();
    await render(<Frameworks root={{ onValueChange }} />);

    await user.press(field());
    await finishMotion();
    expect(field()).toBeExpanded();

    await user.press(option('Next.js'));
    await user.press(option('Nuxt.js'));
    await finishMotion();

    expect(onValueChange).toHaveBeenLastCalledWith(['next', 'nuxt']);
    expect(field()).toBeExpanded();
    expect(option('Next.js')).toBeSelected();
    expect(option('Nuxt.js')).toBeSelected();
    expect(screen.getByTestId('chip-next')).toHaveTextContent('Next.js', { exact: false });
    expect(screen.getByTestId('chip-nuxt')).toHaveTextContent('Nuxt.js', { exact: false });
  });

  it('lets go of a chosen item pressed again in the list', async () => {
    const onValueChange = jest.fn();
    const user = setUp();
    await render(<Frameworks root={{ defaultValue: ['next', 'nuxt'], onValueChange }} />);
    await user.press(field());
    await finishMotion();

    await user.press(option('Next.js'));

    expect(onValueChange).toHaveBeenLastCalledWith(['nuxt']);
    expect(screen.queryByTestId('chip-next')).toBeNull();
  });

  it("lets go of a chip's item from its remove button, named by its label", async () => {
    const onValueChange = jest.fn();
    const user = setUp();
    await render(<Frameworks root={{ defaultValue: ['next', 'sveltekit'], onValueChange }} />);

    await user.press(screen.getByRole('button', { name: 'Remove SvelteKit' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['next']);
    expect(screen.queryByTestId('chip-sveltekit')).toBeNull();
    expect(screen.getByTestId('chip-next')).toBeOnTheScreen();
  });

  it('lets go of every item from its clear button, which then draws nothing', async () => {
    const onValueChange = jest.fn();
    const user = setUp();
    await render(<Frameworks root={{ defaultValue: ['next', 'sveltekit'], onValueChange }} />);

    await user.press(screen.getByRole('button', { name: 'Clear' }));

    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByTestId('chip-next')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('follows the values its owner holds', async () => {
    function Owned() {
      const [frameworks, setFrameworks] = useState<string[]>(['remix']);
      return <Frameworks root={{ value: frameworks, onValueChange: setFrameworks }} />;
    }
    const user = setUp();
    await render(<Owned />);
    expect(screen.getByTestId('chip-remix')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Remove Remix' }));

    expect(screen.queryByTestId('chip-remix')).toBeNull();
  });

  it("draws Vega's chips field, with the focus border while the list is open", async () => {
    const user = setUp();
    await render(<Frameworks root={{ defaultValue: ['next'] }} />);
    expect(emittedClasses(screen.getByTestId('chips').props.className)).toEqual(
      expect.arrayContaining(['border', 'border-input', 'rounded-md', 'min-h-9', 'flex-wrap']),
    );
    expect(emittedClasses(screen.getByTestId('chip-next').props.className)).toEqual(
      expect.arrayContaining(['bg-muted', 'rounded-sm', 'h-[22px]']),
    );

    await user.press(field());
    await finishMotion();

    expect(emittedClasses(screen.getByTestId('chips').props.className)).toContain('border-ring');
  });

  it('draws the destructive border around the chips while they are invalid', async () => {
    await render(
      <Combobox multiple items={FRAMEWORKS}>
        <ComboboxChips testID="chips" aria-invalid>
          <ComboboxChipsInput aria-label="Frameworks" />
        </ComboboxChips>
      </Combobox>,
    );

    expect(emittedClasses(screen.getByTestId('chips').props.className)).toContain('border-destructive');
  });

  it("takes a chip's value from its text when none is given", async () => {
    const onValueChange = jest.fn();
    const user = setUp();
    await render(
      <Combobox multiple items={['Astro', 'Remix']} defaultValue={['Astro', 'Remix']} onValueChange={onValueChange}>
        <ComboboxChips>
          <ComboboxValue>
            {(values) => values.map((value) => <ComboboxChip key={value}>{value}</ComboboxChip>)}
          </ComboboxValue>
        </ComboboxChips>
      </Combobox>,
    );

    await user.press(screen.getByRole('button', { name: 'Remove Astro' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['Remix']);
  });

  it('draws a chip without its remove button when asked to', async () => {
    await render(
      <Combobox multiple defaultValue={['Astro']}>
        <ComboboxChips>
          <ComboboxChip showRemove={false}>Astro</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    );

    expect(screen.getByText('Astro')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Remove Astro' })).toBeNull();
  });
});

describe('ComboboxClear in a single Combobox', () => {
  it('lets go of the chosen item and shows the placeholder again, calling its onPress and not onValueChange', async () => {
    const onValueChange = jest.fn();
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <Combobox items={FRAMEWORKS} defaultValue="next" onValueChange={onValueChange}>
        <ComboboxTrigger aria-label="Framework">
          <ComboboxValue placeholder="Select a framework" />
        </ComboboxTrigger>
        <ComboboxClear onPress={onPress} />
      </Combobox>,
    );
    expect(screen.getByText('Next.js')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Clear' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText('Select a framework')).toBeOnTheScreen();
  });

  it('is cleared by the owner of its value setting null from the clear button', async () => {
    function Owned() {
      const [framework, setFramework] = useState<string | null>('next');
      return (
        <Combobox items={FRAMEWORKS} value={framework} onValueChange={setFramework}>
          <ComboboxTrigger aria-label="Framework">
            <ComboboxValue placeholder="Select a framework" />
          </ComboboxTrigger>
          <ComboboxClear onPress={() => setFramework(null)} />
        </Combobox>
      );
    }
    const user = userEvent.setup();
    await render(<Owned />);

    await user.press(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByText('Select a framework')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});
