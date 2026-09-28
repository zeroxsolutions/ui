import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { MenuButtonHero } from './menu-button-hero';

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

describe('MenuButtonHero', () => {
  it('shows the remembered default as the primary action', () => {
    render(<MenuButtonHero />);
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeTruthy();
  });

  it('makes the picked option the primary action', async () => {
    render(<MenuButtonHero />);
    fireEvent.click(screen.getByRole('button', { name: 'Change action' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Always allow' }));
    expect(await screen.findByRole('button', { name: 'Always allow' })).toBeTruthy();
  });
});
