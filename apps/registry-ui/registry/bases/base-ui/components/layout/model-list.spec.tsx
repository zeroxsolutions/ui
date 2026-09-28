import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelList, ModelListItem, ModelListSkeleton } from './model-list';

afterEach(cleanup);

describe('ModelList', () => {
  it('renders the title, controls, tabs, and children', () => {
    render(
      <ModelList title="Model list" controls={<button type="button">Refresh</button>} tabs={<div data-testid="tabs" />}>
        <div data-testid="child-a" />
        <div data-testid="child-b" />
      </ModelList>,
    );

    expect(screen.getByText('Model list')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByTestId('tabs')).toBeTruthy();
    expect(screen.getByTestId('child-a')).toBeTruthy();
    expect(screen.getByTestId('child-b')).toBeTruthy();
  });

  it('renders its children in order without transforming them', () => {
    render(
      <ModelList title="Model list">
        <div data-testid="child">a</div>
        <div data-testid="child">b</div>
        <div data-testid="child">c</div>
      </ModelList>,
    );

    const children = screen.getAllByTestId('child');
    expect(children.map((child) => child.textContent)).toEqual(['a', 'b', 'c']);
  });
});

// jsdom does not implement PointerEvent, which Base UI's Switch onClick
// constructs; shim it so a click can toggle the switch under test.
if (typeof globalThis.PointerEvent === 'undefined') {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {} as never;
}

afterEach(cleanup);

describe('ModelListItem', () => {
  it('renders the name as the primary line and the id beneath it', () => {
    render(<ModelListItem name="GPT-4o" modelId="gpt-4o" />);

    expect(screen.getByText('GPT-4o')).toBeTruthy();
    expect(screen.getByText('gpt-4o')).toBeTruthy();
  });

  it('renders the media, meta, and action slots', () => {
    render(
      <ModelListItem
        name="GPT-4o"
        modelId="gpt-4o"
        media={<span data-testid="logo" />}
        meta={<span data-testid="chip" />}
        action={<span data-testid="extra" />}
      />,
    );

    expect(document.querySelector('[data-slot="item-media"] [data-testid="logo"]')).toBeTruthy();
    expect(screen.getByTestId('chip')).toBeTruthy();
    expect(screen.getByTestId('extra')).toBeTruthy();
  });

  it('renders the media node verbatim in the leading slot', () => {
    render(<ModelListItem name="X" modelId="x" media={<svg data-testid="mark" />} />);

    const media = document.querySelector('[data-slot="item-media"]');
    expect(media?.querySelector('[data-testid="mark"]')).toBeTruthy();
  });

  it('reports the next state through onEnabledChange', () => {
    const onEnabledChange = vi.fn();
    render(<ModelListItem name="X" modelId="x" enabled={false} onEnabledChange={onEnabledChange} />);

    fireEvent.click(document.querySelector('[data-slot="switch"]') as HTMLElement);

    expect(onEnabledChange).toHaveBeenCalledTimes(1);
    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it('dims the item and does not toggle when unavailable', () => {
    const onEnabledChange = vi.fn();
    render(<ModelListItem name="X" modelId="x" enabled onEnabledChange={onEnabledChange} unavailable />);

    const item = document.querySelector('[data-slot="model-list-item"]');
    expect(item?.className).toContain('opacity-55');

    fireEvent.click(document.querySelector('[data-slot="switch"]') as HTMLElement);
    expect(onEnabledChange).not.toHaveBeenCalled();
  });

  it('renders a remove control that calls onRemove', () => {
    const onRemove = vi.fn();
    render(<ModelListItem name="X" modelId="x" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove model' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('omits optional slots without throwing', () => {
    render(<ModelListItem name="Only name" />);

    expect(screen.getByText('Only name')).toBeTruthy();
    expect(document.querySelector('[data-slot="switch"]')).toBeNull();
  });
});

afterEach(cleanup);

describe('ModelListSkeleton', () => {
  it('renders six placeholder items by default', () => {
    render(<ModelListSkeleton />);

    expect(document.querySelectorAll('[data-slot="model-list-skeleton-item"]')).toHaveLength(6);
  });

  it('renders the requested number of placeholder items, each matching the item shape', () => {
    render(<ModelListSkeleton count={3} />);

    const items = document.querySelectorAll('[data-slot="model-list-skeleton-item"]');
    expect(items).toHaveLength(3);
    // media placeholder + two text lines + a trailing control = 4 skeletons
    expect(items[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });
});

export {};
