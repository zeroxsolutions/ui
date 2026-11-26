import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, playMotion } from '../../../../../test/motion';
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

describe('ModelList', () => {
  it('renders the title, controls, tabs, and content', async () => {
    await render(
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <button type="button">Refresh</button>
          </ModelListAction>
          <p>Tabs</p>
        </ModelListHeader>
        <ModelListContent>
          <p>First model</p>
          <p>Second model</p>
        </ModelListContent>
      </ModelList>,
    );

    await expect.element(page.getByRole('heading', { name: 'Model list' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    await expect.element(page.getByText('Tabs')).toBeVisible();
    await expect.element(page.getByText('First model')).toBeVisible();
    await expect.element(page.getByText('Second model')).toBeVisible();
  });
});

describe('ModelListRemoveButton', () => {
  it('renders a labelled remove control that calls onClick', async () => {
    const onRemove = vi.fn();
    await render(
      <Item>
        <ItemActions>
          <ModelListRemoveButton onClick={onRemove} />
        </ItemActions>
      </Item>,
    );

    await userEvent.click(page.getByRole('button', { name: 'Remove model' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('takes the consumer label in place of the default', async () => {
    await render(<ModelListRemoveButton aria-label="Remove GPT-4o" />);

    await expect.element(page.getByRole('button', { name: 'Remove GPT-4o' })).toBeVisible();
  });

  it('hides the icon from assistive tech', async () => {
    await render(<ModelListRemoveButton />);

    await expect.element(page.getByTestId('trash-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws its children in place of the trash icon', async () => {
    await render(<ModelListRemoveButton>clear</ModelListRemoveButton>);

    await expect.element(page.getByRole('button', { name: 'Remove model' })).toHaveTextContent('clear');
    await expect.element(page.getByTestId('trash-icon')).not.toBeInTheDocument();
  });
});

describe('ModelListSkeleton', () => {
  it('renders the requested number of placeholder items', async () => {
    await render(<ModelListSkeleton count={3} />);

    await expect.poll(() => page.getByTestId('model-list-skeleton-item').elements()).toHaveLength(3);
  });
});

describe('ModelListRemoveButton icon', () => {
  playMotion();

  it("plays the trash while the pointer is on the button, and runs the caller's handler", async () => {
    // The pointer rests where an earlier case left it, over where this control mounts, so it is moved off first.
    await userEvent.unhover(document.body);
    const onPointerEnter = vi.fn();
    await render(<ModelListRemoveButton onPointerEnter={onPointerEnter} />);
    const button = page.getByRole('button', { name: 'Remove model' });
    const rest = drawingIn(button.element());

    await userEvent.hover(button);
    await expectPlaying(button.element(), rest);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
  });
});
