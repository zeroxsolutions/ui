import { render, screen } from '@testing-library/react-native';
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

  it('draws the image from src, scaled down to fit and never up', async () => {
    await render(
      <ImagePreview>
        <ImagePreviewImage src={SAMPLE} alt="Logo" />
      </ImagePreview>,
    );

    const image = screen.getByRole('img', { name: 'Logo' });
    expect(image.props.resizeMode).toBe('center');
    // React Native for Web draws only `source`, so the web's `src` arrives there.
    expect(image.props.source).toEqual({ uri: SAMPLE });
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
  });
});
