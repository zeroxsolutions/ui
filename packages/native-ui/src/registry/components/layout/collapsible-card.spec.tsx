import { render, screen, userEvent } from '@testing-library/react-native';
import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
  type CollapsibleCardProps,
} from './collapsible-card';
import { focus, handleOf } from '../../icons/animated-icon.testing';
import { ChevronDownIcon } from '../../icons/chevron-down-icon';
import { ChevronUpIcon } from '../../icons/chevron-up-icon';

jest.mock('../../icons/chevron-down-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('chevron-down-icon'),
);
jest.mock('../../icons/chevron-up-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('chevron-up-icon'),
);

beforeEach(() => {
  jest.clearAllMocks();
});

function Example(props: CollapsibleCardProps) {
  return (
    <CollapsibleCard {...props}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>Layers</CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>Background, shadow, text</CollapsibleCardContent>
    </CollapsibleCard>
  );
}

describe('CollapsibleCard', () => {
  it('draws its title and its body, open by default', async () => {
    await render(<Example />);

    expect(screen.getByText('Layers')).toBeOnTheScreen();
    expect(screen.getByText('Background, shadow, text')).toBeVisible();
  });

  it('names the chevron trigger Toggle content, announced as an expanded button', async () => {
    await render(<Example />);

    expect(screen.getByRole('button', { name: 'Toggle content' })).toBeExpanded();
  });

  it('hides the body when the trigger is pressed, and shows it again on a second press', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    await render(<Example onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Toggle content' });

    await user.press(trigger);

    expect(trigger).toBeCollapsed();
    expect(screen.queryByText('Background, shadow, text')).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    await user.press(trigger);

    expect(trigger).toBeExpanded();
    expect(screen.getByText('Background, shadow, text')).toBeVisible();
  });

  it('starts closed with defaultOpen false, and follows a controlled open', async () => {
    await render(<Example defaultOpen={false} />);
    expect(screen.queryByText('Background, shadow, text')).toBeNull();

    await screen.rerender(<Example open />);
    expect(screen.getByText('Background, shadow, text')).toBeVisible();
  });

  it('is named by the text of its children, which replace the chevron', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger>Hide</CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );

    expect(screen.getByRole('button', { name: 'Hide' })).toBeExpanded();
    expect(screen.queryByLabelText('Toggle content')).toBeNull();
  });

  it('takes an aria-label over Toggle content', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger aria-label="Show layers" />
      </CollapsibleCard>,
    );

    expect(screen.getByRole('button', { name: 'Show layers' })).toBeOnTheScreen();
  });
});

describe('CollapsibleCardTrigger motion', () => {
  it('starts its chevron on press-in and on focus', async () => {
    const onPressIn = jest.fn();
    const onFocus = jest.fn();
    await render(
      <CollapsibleCard>
        <CollapsibleCardHeader>
          <CollapsibleCardTrigger onPressIn={onPressIn} onFocus={onFocus} />
        </CollapsibleCardHeader>
        <CollapsibleCardContent>Background, shadow, text</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    const control = screen.getByRole('button', { name: 'Toggle content' });

    await userEvent.setup().press(control);
    await focus(control);

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    // The chevron points up when the press begins; the press closes the card, so focus finds it pointing down.
    expect(handleOf(ChevronUpIcon).startAnimation).toHaveBeenCalledTimes(1);
    expect(handleOf(ChevronDownIcon).startAnimation).toHaveBeenCalledTimes(1);
    expect(handleOf(ChevronUpIcon).stopAnimation).not.toHaveBeenCalled();
  });
});
