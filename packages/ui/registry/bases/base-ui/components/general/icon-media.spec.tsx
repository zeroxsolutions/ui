import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { IconMedia } from './icon-media';

afterEach(cleanup);

describe('IconMedia', () => {
  it('holds the icon it is given, named by its aria-label', () => {
    render(
      <IconMedia aria-label="Vision input">
        <svg data-testid="glyph" />
      </IconMedia>,
    );
    expect(screen.getByLabelText('Vision input').contains(screen.getByTestId('glyph'))).toBe(true);
  });
});
