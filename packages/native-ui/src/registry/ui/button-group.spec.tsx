import { render, screen } from '@testing-library/react-native';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { Text } from './text';

describe('ButtonGroup', () => {
  it('is a group named by its label', async () => {
    await render(
      <ButtonGroup aria-label="Text alignment" testID="group">
        <Button variant="outline">
          <Text>Left</Text>
        </Button>
        <Button variant="outline">
          <Text>Right</Text>
        </Button>
      </ButtonGroup>,
    );

    const group = screen.getByTestId('group');
    expect(group.props.role).toBe('group');
    expect(group.props['aria-label']).toBe('Text alignment');
  });
});
