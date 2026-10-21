import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Button } from './button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group';
import { Text } from './text';

function classesOf(name: string): string[] {
  return emittedClasses(screen.getByRole('button', { name }).props.className);
}

function renderGroup(orientation?: 'horizontal' | 'vertical') {
  return render(
    <ButtonGroup orientation={orientation} aria-label="Text alignment" testID="group">
      <Button variant="outline">
        <Text>Left</Text>
      </Button>
      <Button variant="outline">
        <Text>Centre</Text>
      </Button>
      <Button variant="outline">
        <Text>Right</Text>
      </Button>
    </ButtonGroup>,
  );
}

describe('ButtonGroup', () => {
  it('is a group named by its label, laid out in a row as wide as its buttons', async () => {
    await renderGroup();

    const group = screen.getByTestId('group');
    expect(group.props.role).toBe('group');
    expect(group.props['aria-label']).toBe('Text alignment');
    expect(emittedClasses(group.props.className)).toEqual(expect.arrayContaining(['flex-row', 'self-start']));
  });

  it('joins a row of buttons, squaring and merging the edges they share', async () => {
    await renderGroup();

    expect(classesOf('Left')).toContain('rounded-r-none');
    expect(classesOf('Left')).not.toContain('border-l-0');
    expect(classesOf('Centre')).toEqual(expect.arrayContaining(['rounded-l-none', 'rounded-r-none', 'border-l-0']));
    expect(classesOf('Right')).toEqual(expect.arrayContaining(['rounded-l-none', 'border-l-0']));
    expect(classesOf('Right')).not.toContain('rounded-r-none');
  });

  it('joins a column of buttons by their top and bottom edges', async () => {
    await renderGroup('vertical');

    expect(emittedClasses(screen.getByTestId('group').props.className)).toContain('flex-col');
    expect(classesOf('Left')).toContain('rounded-b-none');
    expect(classesOf('Centre')).toEqual(expect.arrayContaining(['rounded-t-none', 'rounded-b-none', 'border-t-0']));
    expect(classesOf('Right')).toEqual(expect.arrayContaining(['rounded-t-none', 'border-t-0']));
    expect(classesOf('Right')).not.toContain('rounded-b-none');
  });

  it('spaces groups held in a group apart', async () => {
    await render(
      <ButtonGroup testID="outer">
        <ButtonGroup>
          <Button>
            <Text>Undo</Text>
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button>
            <Text>Redo</Text>
          </Button>
        </ButtonGroup>
      </ButtonGroup>,
    );

    expect(emittedClasses(screen.getByTestId('outer').props.className)).toContain('gap-2');
  });

  it('draws text as a muted bordered cell', async () => {
    await render(
      <ButtonGroup>
        <ButtonGroupText testID="text">
          <Text>https://</Text>
        </ButtonGroupText>
      </ButtonGroup>,
    );

    expect(emittedClasses(screen.getByTestId('text').props.className)).toEqual(
      expect.arrayContaining(['bg-muted', 'border', 'rounded-md', 'px-2.5']),
    );
    expect(emittedClasses(screen.getByText('https://').props.className)).toEqual(
      expect.arrayContaining(['text-sm', 'font-sans-medium']),
    );
  });

  it('draws a separator in the input colour, as tall as the group', async () => {
    await render(
      <ButtonGroup>
        <Button>
          <Text>Save</Text>
        </Button>
        <ButtonGroupSeparator testID="separator" />
        <Button>
          <Text>More</Text>
        </Button>
      </ButtonGroup>,
    );

    const classes = emittedClasses(screen.getByTestId('separator', { includeHiddenElements: true }).props.className);
    expect(classes).toEqual(expect.arrayContaining(['bg-input', 'w-px', 'self-stretch', 'h-auto']));
    expect(classes).not.toContain('bg-border');
  });
});
