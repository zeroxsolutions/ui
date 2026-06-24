import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PanelScroll } from './panel-scroll';

beforeAll(() => {
  // Base UI's scroll-area measures with ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('PanelScroll', () => {
  it('renders its children inside a full-height scroll area', () => {
    const { getByText } = render(
      <PanelScroll>
        <p>panel body</p>
      </PanelScroll>,
    );
    expect(getByText('panel body')).toBeTruthy();
  });
});
