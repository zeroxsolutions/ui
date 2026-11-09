import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { PanelFieldGroup } from './panel-field-group';

type Rendered = { props: { className?: string }; children: Rendered[] };

function rowsOf(): Rendered[] {
  return screen.getByTestId('group').children as unknown as Rendered[];
}

describe('PanelFieldGroup', () => {
  it('lays its children in rows of cols equal cells, gap-x-2 apart, and the rows gap-y-1 apart', async () => {
    await render(
      <PanelFieldGroup testID="group" cols={3}>
        <Text>X</Text>
        <Text>Y</Text>
        <Text>Z</Text>
      </PanelFieldGroup>,
    );

    expect(emittedClasses(screen.getByTestId('group').props.className)).toContain('gap-y-1');
    const rows = rowsOf();
    expect(rows).toHaveLength(1);
    expect(emittedClasses(rows[0].props.className)).toEqual(['flex-row', 'gap-x-2']);
    expect(rows[0].children).toHaveLength(3);
    for (const cell of rows[0].children) expect(emittedClasses(cell.props.className)).toEqual(['min-w-0', 'flex-1']);
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

  it("takes the caller's classes on the group", async () => {
    await render(<PanelFieldGroup testID="group" className="w-full max-w-sm" />);

    expect(emittedClasses(screen.getByTestId('group').props.className)).toEqual(
      expect.arrayContaining(['w-full', 'max-w-sm', 'gap-y-1']),
    );
  });
});
