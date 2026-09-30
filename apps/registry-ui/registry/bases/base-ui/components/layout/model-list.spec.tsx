import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { compile } from 'tailwindcss';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListItemRemove,
  ModelListSkeleton,
  ModelListTitle,
} from './model-list';

afterEach(cleanup);

/** Whether an opacity rule compiled from the enclosing `ModelListContent`'s classes applies to `item`. */
async function isDimmed(item: Element | null): Promise<boolean> {
  const content = item?.closest('[data-slot="model-list-content"]');
  if (!item || !content) throw new Error('no item rendered inside a ModelListContent');
  const compiler = await compile('@tailwind utilities;');
  const style = document.createElement('style');
  style.textContent = compiler.build([...content.classList]);
  document.head.append(style);
  const rules = [...(style.sheet?.cssRules ?? [])].filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.style.getPropertyValue('opacity') !== '',
  );
  style.remove();
  // jsdom's selector engine matches no escaped class name inside :is(), so the
  // content is addressed by its data-slot, which selects the same element.
  return rules.some((rule) =>
    item.matches(rule.selectorText.replace(/\.(?:\\.|[\w-])+/g, '[data-slot="model-list-content"]')),
  );
}

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
    const content = document.querySelector('[data-slot="model-list-content"]');
    expect(content?.querySelector('[data-testid="child-a"]')).toBeTruthy();
    expect(content?.querySelector('[data-testid="child-b"]')).toBeTruthy();
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

describe('ModelListContent', () => {
  it('scrolls its children inside a ScrollArea viewport', () => {
    render(
      <ModelListContent>
        <div data-testid="child" />
      </ModelListContent>,
    );

    const viewport = document.querySelector('[data-slot="model-list-content"] [data-slot="scroll-area-viewport"]');
    expect(viewport?.contains(screen.getByTestId('child'))).toBe(true);
  });

  it('dims an item marked unavailable', async () => {
    render(
      <ModelListContent>
        <ItemGroup>
          <Item size="sm" data-unavailable>
            <ItemContent>
              <ItemTitle>GPT-4o</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ModelListContent>,
    );

    expect(await isDimmed(document.querySelector('[data-slot="item"]'))).toBe(true);
  });

  it('does not dim an item whose data-unavailable is false', async () => {
    render(
      <ModelListContent>
        <ItemGroup>
          <Item size="sm" data-unavailable={false}>
            <ItemContent>
              <ItemTitle>GPT-4o</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ModelListContent>,
    );

    const item = document.querySelector('[data-slot="item"]');
    expect(item?.getAttribute('data-unavailable')).toBe('false');
    expect(await isDimmed(item)).toBe(false);
  });
});

describe('ModelListItemRemove', () => {
  it('renders a labelled remove control that calls onClick', () => {
    const onRemove = vi.fn();
    render(
      <Item>
        <ItemActions>
          <ModelListItemRemove onClick={onRemove} />
        </ItemActions>
      </Item>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove model' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('takes the consumer label in place of the default', () => {
    render(<ModelListItemRemove aria-label="Remove GPT-4o" />);

    expect(screen.getByRole('button', { name: 'Remove GPT-4o' })).toBeTruthy();
  });
});

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
