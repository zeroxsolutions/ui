import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { ScrollArea, ScrollBar } from './scroll-area';
import { Text } from './text';

describe('ScrollArea', () => {
  it('scrolls its children vertically by default', async () => {
    await render(
      <ScrollArea testID="area" className="h-72">
        <Text>Release notes</Text>
      </ScrollArea>,
    );

    const area = screen.getByTestId('area');
    expect(area.props.horizontal).toBeFalsy();
    expect(area).toContainElement(screen.getByText('Release notes'));
    expect(emittedClasses(area.props.className)).toEqual(expect.arrayContaining(['relative', 'h-72']));
  });

  it('scrolls sideways when it holds a horizontal ScrollBar', async () => {
    await render(
      <ScrollArea testID="area">
        <Text>Wide row</Text>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>,
    );

    expect(screen.getByTestId('area').props.horizontal).toBe(true);
  });

  it('draws nothing for a ScrollBar, whose indicator the platform draws', async () => {
    await render(<ScrollBar orientation="horizontal" />);

    expect(screen.toJSON()).toBeNull();
  });

  it('keeps scrolling inside a scrolling screen on Android', async () => {
    await render(<ScrollArea testID="area" />);

    expect(screen.getByTestId('area').props.nestedScrollEnabled).toBe(true);
  });
});
