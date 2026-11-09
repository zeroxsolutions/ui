import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PanelFieldGroup } from './panel-field-group';

type Rendered = { children: Rendered[] };

function rowsOf(): Rendered[] {
  return screen.getByTestId('group').children as unknown as Rendered[];
}

describe('PanelFieldGroup', () => {
  it('lays its children in rows of cols cells', async () => {
    await render(
      <PanelFieldGroup testID="group" cols={3}>
        <Text>X</Text>
        <Text>Y</Text>
        <Text>Z</Text>
      </PanelFieldGroup>,
    );

    const rows = rowsOf();
    expect(rows).toHaveLength(1);
    expect(rows[0].children).toHaveLength(3);
  });

  it('draws one column when cols is omitted', async () => {
    await render(
      <PanelFieldGroup testID="group">
        <Text>Width</Text>
        <Text>Height</Text>
      </PanelFieldGroup>,
    );

    expect(rowsOf().map((row) => row.children.length)).toEqual([1, 1]);
  });

  it('fills a short last row with empty cells, so the columns line up', async () => {
    await render(
      <PanelFieldGroup testID="group" cols={2}>
        <Text>Count</Text>
        <Text>Gutter</Text>
        <Text>Margin</Text>
      </PanelFieldGroup>,
    );

    const rows = rowsOf();
    expect(rows.map((row) => row.children.length)).toEqual([2, 2]);
    expect(rows[1].children[1].children).toEqual([]);
    expect(screen.getByText('Margin')).toBeOnTheScreen();
  });
});
