import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { IconLabel } from './icon-label';

afterEach(cleanup);

describe('IconLabel', () => {
  it('names the control it is tied to with the words beside its icon', () => {
    render(
      <>
        <IconLabel htmlFor="rotation">
          <svg aria-hidden />
          <span className="sr-only">Rotation</span>
        </IconLabel>
        <input id="rotation" type="number" />
      </>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Rotation' })).toBeTruthy();
  });
});
