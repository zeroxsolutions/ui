import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import registry from '../../../../../registry.json';
import { Installation } from './installation';

afterEach(cleanup);

describe('Installation', () => {
  it('points the install command at the host registry.json names as its homepage', async () => {
    const { container } = render(<Installation name="split-button" />);

    await waitFor(() =>
      expect(container.textContent).toContain(`pnpm dlx shadcn add ${registry.homepage}/r/split-button.json`),
    );
  });
});
