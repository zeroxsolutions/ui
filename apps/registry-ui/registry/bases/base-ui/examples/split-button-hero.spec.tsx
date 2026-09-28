import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { SplitButtonHero } from './split-button-hero';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('SplitButtonHero', () => {
  it('renders the primary action beside a labelled caret', () => {
    render(<SplitButtonHero />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More action options' })).toBeTruthy();
  });

  it('opens the related actions from the caret', async () => {
    render(<SplitButtonHero />);
    fireEvent.click(screen.getByRole('button', { name: 'More action options' }));
    expect(await screen.findByRole('menuitem', { name: 'Second' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Third' })).toBeTruthy();
  });
});
