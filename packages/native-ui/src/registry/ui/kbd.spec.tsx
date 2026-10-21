import { render, screen } from '@testing-library/react-native';
import { Command } from 'lucide-react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Icon } from './icon';
import { Kbd, KbdGroup } from './kbd';
import { Text } from './text';

describe('Kbd', () => {
  it("draws a key as a muted rounded cap with Vega's small medium label", async () => {
    await render(
      <Kbd testID="kbd">
        <Text>K</Text>
      </Kbd>,
    );

    expect(emittedClasses(screen.getByTestId('kbd').props.className)).toEqual(
      expect.arrayContaining(['bg-muted', 'rounded-sm', 'h-5', 'min-w-5', 'px-1']),
    );
    expect(emittedClasses(screen.getByText('K').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-xs', 'font-sans-medium']),
    );
  });

  it('keeps to the width of its key rather than the width of its row', async () => {
    await render(
      <Kbd testID="kbd">
        <Text>Esc</Text>
      </Kbd>,
    );

    const classes = emittedClasses(screen.getByTestId('kbd').props.className);

    expect(classes).toContain('self-start');
    expect(classes).not.toContain('w-fit');
  });

  it('sizes an Icon inside to 12px', async () => {
    // The spec renders the source, whose icon class is still the slot token, so the token is
    // registered with the size the build translates it to.
    expect(emittedClasses('cn-kbd/icon')).toEqual(['size-3']);
    registerCSS('.cn-kbd\\/icon { width: 12px; height: 12px; }');
    await render(
      <Kbd>
        <Icon as={Command} accessible role="img" aria-label="Command" />
      </Kbd>,
    );

    const { width, height } = screen.getByRole('img', { name: 'Command' }).props;

    expect({ width, height }).toEqual({ width: 12, height: 12 });
  });

  it('lays the keys of a group out in a row', async () => {
    await render(
      <KbdGroup testID="group">
        <Kbd>
          <Text>Ctrl</Text>
        </Kbd>
        <Kbd>
          <Text>B</Text>
        </Kbd>
      </KbdGroup>,
    );

    expect(emittedClasses(screen.getByTestId('group').props.className)).toEqual(
      expect.arrayContaining(['flex-row', 'gap-1']),
    );
  });
});
