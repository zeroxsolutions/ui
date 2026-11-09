import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { PanelHeader, PanelHeaderActions, PanelHeaderRow, PanelHeaderTitle } from './panel-header';

function Example() {
  return (
    <PanelHeader testID="header">
      <PanelHeaderRow testID="row">
        <PanelHeaderTitle testID="title">
          <Text>Properties</Text>
        </PanelHeaderTitle>
        <PanelHeaderActions testID="actions">
          <Text>Collapse</Text>
        </PanelHeaderActions>
      </PanelHeaderRow>
    </PanelHeader>
  );
}

function classesOf(testID: string, style?: 'vega' | 'lyra'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
}

describe('PanelHeader', () => {
  it('draws its parts', async () => {
    await render(<Example />);

    expect(screen.getByText('Properties')).toBeOnTheScreen();
    expect(screen.getByText('Collapse')).toBeOnTheScreen();
  });

  it('stacks its rows over a bottom border in the border colour, and paints no background', async () => {
    await render(<Example />);

    const classes = classesOf('header');
    expect(classes).toEqual(expect.arrayContaining(['shrink-0', 'flex-col', 'border-b', 'border-border']));
    expect(classes.filter((name) => name.startsWith('bg-'))).toEqual([]);
  });

  it.each([
    ['vega', 'h-10'],
    ['lyra', 'h-9'],
  ] as const)('makes a row as high as the style row, in %s %s', async (style, height) => {
    await render(<Example />);

    const classes = classesOf('row', style);
    expect(classes.filter((name) => name.startsWith('h-'))).toEqual([height]);
    expect(classes).toEqual(expect.arrayContaining(['flex-row', 'items-center', 'gap-1', 'px-2']));
  });

  it('grows the title and never shrinks the actions', async () => {
    await render(<Example />);

    expect(classesOf('title')).toEqual(expect.arrayContaining(['min-w-0', 'flex-1', 'flex-row', 'items-center']));
    expect(classesOf('actions')).toEqual(expect.arrayContaining(['shrink-0', 'flex-row', 'gap-0.5']));
  });
});
