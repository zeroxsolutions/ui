import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PanelRow, PanelRowAction } from './panel-row';

describe('PanelRow', () => {
  it('puts the fields in a leading column and the action after them, whatever order they come in', async () => {
    await render(
      <PanelRow testID="row">
        <PanelRowAction testID="action">
          <Text>Lock</Text>
        </PanelRowAction>
        <Text>Fields</Text>
      </PanelRow>,
    );

    const [fields, action] = screen.getByTestId('row').children;
    expect(screen.getByText('Fields').parent).toBe(fields);
    expect(action).toBe(screen.getByTestId('action'));
  });
});
