import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { CommandInput, CommandList } from '../../ui/command';
import { Text } from '../../ui/text';
import { CommandMenu, CommandMenuItem, type CommandMenuProps } from './command-menu';

// Jest runs no Reanimated frame into the props a query reads, so the opacity a dialog's fade starts at hides
// it from them.
configure({ defaultIncludeHiddenElements: true });

function Example({ onSelect, ...props }: Omit<CommandMenuProps, 'children'> & { onSelect?: (value: string) => void }) {
  return (
    <>
      <CommandMenu open {...props}>
        <CommandInput placeholder="Jump to file..." />
        <CommandList>
          <CommandMenuItem value="SKILL.md" onSelect={onSelect}>
            <Text>SKILL.md</Text>
          </CommandMenuItem>
          <CommandMenuItem value="scripts/run.py">
            <Text>run.py</Text>
          </CommandMenuItem>
        </CommandList>
      </CommandMenu>
      <PortalHost />
    </>
  );
}

describe('CommandMenu', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const setUp = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const opened = () => act(() => jest.advanceTimersByTimeAsync(300));

  it("reports the chosen item's value, not its text, and closes", async () => {
    const user = setUp();
    const onValueChange = jest.fn();
    const onOpenChange = jest.fn();
    await render(<Example onValueChange={onValueChange} onOpenChange={onOpenChange} />);
    await opened();

    await user.press(screen.getByRole('option', { name: 'run.py' }));

    expect(onValueChange).toHaveBeenCalledWith('scripts/run.py');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("runs an item's onSelect as well as reporting its value", async () => {
    const user = setUp();
    const onSelect = jest.fn();
    const onValueChange = jest.fn();
    await render(<Example onSelect={onSelect} onValueChange={onValueChange} />);
    await opened();

    await user.press(screen.getByRole('option', { name: 'SKILL.md' }));

    expect(onSelect).toHaveBeenCalledWith('SKILL.md');
    expect(onValueChange).toHaveBeenCalledWith('SKILL.md');
  });

  it('titles its dialog Command menu in sentence case unless given a title', async () => {
    await render(<Example />);
    await opened();
    expect(screen.getByRole('heading', { name: 'Command menu' })).toBeOnTheScreen();
    expect(screen.getByText('Search for a target to jump to.')).toBeOnTheScreen();

    await screen.rerender(<Example title="Jump to file" />);
    expect(screen.getByRole('heading', { name: 'Jump to file' })).toBeOnTheScreen();
  });
});
