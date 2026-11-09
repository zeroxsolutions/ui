import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { ImagePreview, ImagePreviewImage } from './image-preview';

const HIDDEN = { includeHiddenElements: true } as const;
const SAMPLE = 'https://example.com/logo.png';

describe('ImagePreview', () => {
  it('shows a named image as an image of that name', async () => {
    await render(
      <ImagePreview>
        <ImagePreviewImage src={SAMPLE} alt="Sample circular graphic" />
      </ImagePreview>,
    );

    expect(screen.getByRole('img', { name: 'Sample circular graphic' })).toBeOnTheScreen();
  });

  it('hides an image with no alt from a screen reader, as decorative', async () => {
    await render(
      <ImagePreview>
        <ImagePreviewImage src={SAMPLE} testID="image" />
      </ImagePreview>,
    );

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('image', HIDDEN).props['aria-hidden']).toBe(true);
  });

  it('fills the frame with the image, scaled down to fit and never up', async () => {
    await render(
      <ImagePreview>
        <ImagePreviewImage src={SAMPLE} alt="Logo" />
      </ImagePreview>,
    );

    const image = screen.getByRole('img', { name: 'Logo' });
    expect(image.props.resizeMode).toBe('center');
    expect(emittedClasses(image.props.className)).toEqual(expect.arrayContaining(['h-full', 'w-full']));
  });

  it('lays the checkerboard under the image, hidden from a screen reader and from touches', async () => {
    await render(
      <ImagePreview testID="frame">
        <ImagePreviewImage src={SAMPLE} alt="Logo" />
      </ImagePreview>,
    );

    const [layer] = screen.getByTestId('frame').children;
    expect(typeof layer === 'object' && layer.props).toEqual(
      expect.objectContaining({ 'aria-hidden': true, pointerEvents: 'none' }),
    );
    expect(emittedClasses(typeof layer === 'object' ? layer.props.className : '')).toEqual(
      expect.arrayContaining(['absolute', 'inset-0']),
    );
  });

  it.each([
    ['vega', 'rounded-sm'],
    ['lyra', 'rounded-none'],
  ] as const)('centres its image on the background colour, %s with %s corners', async (style, radius) => {
    await render(<ImagePreview testID="frame" />);

    expect(emittedClasses(screen.getByTestId('frame').props.className, style)).toEqual(
      expect.arrayContaining([
        radius,
        'bg-background',
        'size-full',
        'items-center',
        'justify-center',
        'overflow-hidden',
      ]),
    );
  });
});
