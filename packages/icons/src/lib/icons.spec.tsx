import { render } from '@testing-library/react';

import ChiselartIcons from './icons';

describe('ChiselartIcons', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChiselartIcons />);
    expect(baseElement).toBeTruthy();
  });
});
