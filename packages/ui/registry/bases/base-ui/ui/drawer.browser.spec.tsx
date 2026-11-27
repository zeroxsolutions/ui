import { describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { touch, type Point } from '../../../../test/pointer';
import { Button } from './button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from './drawer';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** A finger's drag on the popup from just inside its top edge, `distance` pixels down, then lifted. */
async function dragDown(popup: HTMLElement, distance: number): Promise<void> {
  const rect = popup.getBoundingClientRect();
  const from: Point = { x: rect.left + rect.width / 2, y: rect.top + 8 };
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  try {
    await touch('start', from);
    const steps = 10;
    for (let step = 1; step <= steps; step++) await touch('move', { x: from.x, y: from.y + (distance * step) / steps });
    await touch('end', { x: from.x, y: from.y + distance });
  } finally {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  }
}

async function openDrawer(): Promise<HTMLElement> {
  await render(
    <Drawer>
      <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Move goal</DrawerTitle>
        <DrawerDescription>Set your daily activity goal.</DrawerDescription>
        <div className="h-60" />
        <Button>Submit</Button>
      </DrawerContent>
    </Drawer>,
  );
  await userEvent.click(page.getByRole('button', { name: 'Open drawer' }));
  await expect.element(page.getByRole('dialog', { name: 'Move goal' })).toBeInTheDocument();
  return page.getByTestId('drawer-popup').element() as HTMLElement;
}

/** Opens the drawer and waits for its first frame to pass, on which it is drawn closed, off the window. */
async function openDrawerAtRest(): Promise<HTMLElement> {
  const popup = await openDrawer();
  await vi.waitFor(() => expect(popup).not.toHaveAttribute('data-starting-style'));
  return popup;
}

// The browser project runs as a reader who asked for reduced motion.
describe('Drawer, for a reader who asked for reduced motion', () => {
  it('goes from its closed frame straight to rest against the bottom of the window', async () => {
    const popup = await openDrawerAtRest();

    expect(document.getAnimations().filter((animation) => animation.playState === 'running')).toEqual([]);
    expect(popup.getBoundingClientRect().bottom).toBeCloseTo(innerHeight, 0);
  });

  it('closes from Escape', async () => {
    await openDrawer();

    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when dragged most of the way down', async () => {
    const popup = await openDrawerAtRest();

    // Ends inside the window, where the touch still lands.
    await dragDown(popup, popup.getBoundingClientRect().height - 24);

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open, back at rest, when dragged down a little', async () => {
    const popup = await openDrawerAtRest();

    await dragDown(popup, 4);
    await nextFrame();

    await expect.element(page.getByRole('dialog', { name: 'Move goal' })).toBeVisible();
    expect(popup.getBoundingClientRect().bottom).toBeCloseTo(innerHeight, 0);
  });
});
