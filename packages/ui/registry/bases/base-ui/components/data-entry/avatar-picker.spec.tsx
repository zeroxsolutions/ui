import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AvatarPicker, AvatarPickerColorGroup, AvatarPickerRemoveButton } from './avatar-picker';

const { checkStart, checkStop, trashStart, trashStop } = vi.hoisted(() => ({
  checkStart: vi.fn(),
  checkStop: vi.fn(),
  trashStart: vi.fn(),
  trashStop: vi.fn(),
}));

vi.mock('@/registry/bases/base-ui/icons/check-icon', async () => {
  const React = await import('react');
  return {
    CheckIcon: React.forwardRef<unknown, { 'aria-hidden'?: boolean }>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation: checkStart, stopAnimation: checkStop }));
      return <svg data-testid="check-icon" aria-hidden={props['aria-hidden']} />;
    }),
  };
});

vi.mock('@/registry/bases/base-ui/icons/trash-2-icon', async () => {
  const React = await import('react');
  return {
    Trash2Icon: React.forwardRef<unknown, { 'aria-hidden'?: boolean }>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation: trashStart, stopAnimation: trashStop }));
      return <svg data-testid="trash-2-icon" aria-hidden={props['aria-hidden']} />;
    }),
  };
});

afterEach(() => {
  cleanup();
  for (const fn of [checkStart, checkStop, trashStart, trashStop]) fn.mockClear();
});

describe('AvatarPickerColorGroup check', () => {
  const group = (color: string) => (
    <AvatarPicker value={{ color }} onValueChange={() => {}}>
      <AvatarPickerColorGroup aria-label="Colors" colors={['#6366f1', '#ec4899']} />
    </AvatarPicker>
  );

  it('draws the check on the pressed swatch only and plays it once as it appears', () => {
    render(group('#6366f1'));

    expect(screen.getAllByTestId('check-icon')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '#6366f1' }).querySelector('svg')).not.toBeNull();
    expect(checkStart).toHaveBeenCalledTimes(1);
    expect(checkStop).not.toHaveBeenCalled();
  });

  it('plays the check on the swatch that becomes pressed, not again on a rerender that keeps it', () => {
    const { rerender } = render(group('#6366f1'));
    rerender(group('#6366f1'));
    expect(checkStart).toHaveBeenCalledTimes(1);

    rerender(group('#ec4899'));
    expect(screen.getByRole('button', { name: '#ec4899' }).querySelector('svg')).not.toBeNull();
    expect(checkStart).toHaveBeenCalledTimes(2);
  });
});

describe('AvatarPickerRemoveButton icon', () => {
  it('plays the trash once while the pointer and the focus hold the button, and stops when both leave', () => {
    render(
      <AvatarPicker value={{}} onValueChange={() => {}}>
        <AvatarPickerRemoveButton />
      </AvatarPicker>,
    );
    const button = screen.getByRole('button', { name: 'Remove avatar' });

    fireEvent.pointerEnter(button);
    fireEvent.focus(button);
    expect(trashStart).toHaveBeenCalledTimes(1);

    fireEvent.pointerLeave(button);
    expect(trashStop).not.toHaveBeenCalled();
    fireEvent.blur(button);
    expect(trashStop).toHaveBeenCalledTimes(1);
  });
});
