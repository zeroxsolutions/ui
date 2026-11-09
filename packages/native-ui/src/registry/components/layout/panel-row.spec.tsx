import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { PanelRow, PanelRowAction } from './panel-row';

describe('PanelRow', () => {
  it('puts the fields in a growing leading column and the action after them', async () => {
    await render(
      <PanelRow testID="row">
        <Text>Fields</Text>
        <PanelRowAction testID="action">
          <Text>Lock</Text>
        </PanelRowAction>
      </PanelRow>,
    );

    const row = screen.getByTestId('row');
    expect(emittedClasses(row.props.className)).toEqual(expect.arrayContaining(['flex-row', 'items-end', 'gap-1']));
    const [fields, action] = row.children as { props: { className?: string } }[];
    expect(emittedClasses(fields.props.className)).toEqual(['min-w-0', 'flex-1']);
    expect(screen.getByText('Fields').parent).toBe(fields);
    expect(action).toBe(screen.getByTestId('action'));
  });

  it('centres the action in a column at least one icon button wide', async () => {
    await render(
      <PanelRow>
        <PanelRowAction testID="action" />
      </PanelRow>,
    );

    expect(emittedClasses(screen.getByTestId('action').props.className)).toEqual(
      expect.arrayContaining(['min-w-8', 'shrink-0', 'justify-center']),
    );
  });

  it('keeps the action column without an action, so its right edge matches the other rows', async () => {
    await render(
      <PanelRow testID="row">
        <Text>Fields</Text>
      </PanelRow>,
    );

    const [, column] = screen.getByTestId('row').children as { props: { className?: string } }[];
    expect(emittedClasses(column.props.className)).toEqual(['min-w-8']);
  });
});
