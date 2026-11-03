import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Item, ItemActions } from '@/registry/bases/base-ui/ui/item';
import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListRemoveButton,
  ModelListSkeleton,
  ModelListTitle,
} from './model-list';

afterEach(cleanup);

describe('ModelList', () => {
  it('renders the title, controls, tabs, and content', () => {
    render(
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <button type="button">Refresh</button>
          </ModelListAction>
          <div data-testid="tabs" />
        </ModelListHeader>
        <ModelListContent>
          <div data-testid="child-a" />
          <div data-testid="child-b" />
        </ModelListContent>
      </ModelList>,
    );

    expect(screen.getByRole('heading', { name: 'Model list' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByTestId('tabs')).toBeTruthy();
    expect(screen.getByTestId('child-a')).toBeTruthy();
    expect(screen.getByTestId('child-b')).toBeTruthy();
  });

  it('renders its content in order without transforming it', () => {
    render(
      <ModelList>
        <ModelListContent>
          <div data-testid="child">a</div>
          <div data-testid="child">b</div>
          <div data-testid="child">c</div>
        </ModelListContent>
      </ModelList>,
    );

    const children = screen.getAllByTestId('child');
    expect(children.map((child) => child.textContent)).toEqual(['a', 'b', 'c']);
  });
});

describe('ModelListRemoveButton', () => {
  it('renders a labelled remove control that calls onClick', () => {
    const onRemove = vi.fn();
    render(
      <Item>
        <ItemActions>
          <ModelListRemoveButton onClick={onRemove} />
        </ItemActions>
      </Item>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove model' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('takes the consumer label in place of the default', () => {
    render(<ModelListRemoveButton aria-label="Remove GPT-4o" />);

    expect(screen.getByRole('button', { name: 'Remove GPT-4o' })).toBeTruthy();
  });
});

describe('ModelListSkeleton', () => {
  it('renders six placeholder items by default', () => {
    const { container } = render(<ModelListSkeleton />);

    expect(container.firstElementChild?.children).toHaveLength(6);
  });

  it('renders the requested number of placeholder items', () => {
    const { container } = render(<ModelListSkeleton count={3} />);

    expect(container.firstElementChild?.children).toHaveLength(3);
  });
});
