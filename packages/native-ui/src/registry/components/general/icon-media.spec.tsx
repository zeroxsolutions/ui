import { render, screen } from '@testing-library/react-native';
import { useContext, type ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { TextClassContext } from '../../ui/text';
import { IconMedia } from './icon-media';

/** Writes the text classes an Icon inside the square takes, so a spec reads them. */
function Probe(): ReactNode {
  const text = useContext(TextClassContext);
  return <NativeText testID="probe">{text ?? ''}</NativeText>;
}

function probedText(): string[] {
  return String(screen.getByTestId('probe').props.children).split(' ');
}

describe('IconMedia', () => {
  it("tints the square with the caller's background and its glyph with the caller's text colour", async () => {
    await render(
      <IconMedia testID="media" className="bg-primary text-primary-foreground dark:text-primary">
        <Probe />
      </IconMedia>,
    );

    const square = emittedClasses(screen.getByTestId('media').props.className);
    expect(square).toContain('bg-primary');
    expect(square.filter((name) => name.includes('text-'))).toEqual([]);
    expect(probedText()).toEqual(['text-primary-foreground', 'dark:text-primary']);
  });

  it('keeps the text classes of the container it sits in', async () => {
    await render(
      <TextClassContext.Provider value="text-sm">
        <IconMedia className="text-muted-foreground">
          <Probe />
        </IconMedia>
      </TextClassContext.Provider>,
    );

    expect(probedText()).toEqual(['text-sm', 'text-muted-foreground']);
  });

  it('is one image for a screen reader, named by its aria-label', async () => {
    await render(<IconMedia aria-label="Vision input" />);

    const image = screen.getByRole('img', { name: 'Vision input' });
    expect(image.props.accessible).toBe(true);
  });

  it('is no element of its own for a screen reader without a label', async () => {
    await render(<IconMedia testID="media" />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('media').props.accessible).toBe(false);
  });
});
