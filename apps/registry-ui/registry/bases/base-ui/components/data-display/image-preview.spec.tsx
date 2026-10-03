import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ImagePreview, ImagePreviewImage } from './image-preview';

afterEach(cleanup);

describe('ImagePreview', () => {
  it('shows the image it holds, named by its alt', () => {
    render(
      <ImagePreview>
        <ImagePreviewImage src="/logo.png" alt="Logo" />
      </ImagePreview>,
    );
    expect(screen.getByRole('img', { name: 'Logo' }).getAttribute('src')).toBe('/logo.png');
  });

  it('treats an image with no alt as decorative', () => {
    render(
      <ImagePreview>
        <ImagePreviewImage src="/logo.png" />
      </ImagePreview>,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('presentation').getAttribute('src')).toBe('/logo.png');
  });
});
