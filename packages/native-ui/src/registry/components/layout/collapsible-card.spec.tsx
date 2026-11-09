import { render, screen, userEvent } from '@testing-library/react-native';
import { useContext, type ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { TextClassContext } from '../../ui/text';
import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
  type CollapsibleCardProps,
} from './collapsible-card';

/** Writes the text classes a Text at its place takes, so a spec reads them. */
function Probe({ testID }: { testID: string }): ReactNode {
  const text = useContext(TextClassContext);
  return <NativeText testID={testID}>{text ?? ''}</NativeText>;
}

function Example(props: CollapsibleCardProps) {
  return (
    <CollapsibleCard testID="card" {...props}>
      <CollapsibleCardHeader testID="header">
        <CollapsibleCardTitle testID="title">Layers</CollapsibleCardTitle>
        <CollapsibleCardActions testID="actions">
          <CollapsibleCardTrigger testID="trigger" />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent testID="content">Background, shadow, text</CollapsibleCardContent>
    </CollapsibleCard>
  );
}

function classesOf(testID: string, style?: 'vega' | 'lyra'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
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

  it.each([
    ['vega', ['rounded-xl', 'border', 'border-foreground/10', 'shadow-sm']],
    ['lyra', ['rounded-none', 'border', 'border-foreground/10']],
  ] as const)(
    'draws the default surface in %s as the card does, its ring as a border and shadow-xs as shadow-sm',
    async (style, surface) => {
      await render(<Example />);

      expect(classesOf('card', style)).toEqual(
        expect.arrayContaining(['w-full', 'flex-col', 'overflow-hidden', 'bg-card', ...surface]),
      );
    },
  );

  it.each([
    ['vega', 'rounded-xl'],
    ['lyra', 'rounded-none'],
  ] as const)('draws the muted surface in %s as a borderless fill, %s', async (style, radius) => {
    await render(<Example variant="muted" />);

    const classes = classesOf('card', style);
    expect(classes).toEqual(expect.arrayContaining(['bg-muted/50', radius]));
    expect(classes).not.toContain('border');
  });

  it('draws plain as a rule underneath, with a narrower header, and flush as no surface', async () => {
    await render(<Example variant="plain" />);

    expect(classesOf('card')).toEqual(expect.arrayContaining(['border-b', 'border-border']));
    expect(classesOf('card').filter((name) => name.startsWith('bg-'))).toEqual([]);
    expect(classesOf('header')).toContain('px-2.5');

    await screen.rerender(<Example variant="flush" />);

    const flush = classesOf('card');
    expect(flush.filter((name) => name.startsWith('bg-') || name.startsWith('border'))).toEqual([]);
  });

  it.each([
    ['vega', 'px-5', 'h-9', 'text-sm'],
    ['lyra', 'px-3', 'h-8', 'text-xs/relaxed'],
  ] as const)(
    'pads the header in %s by %s and makes the title %s, in %s text',
    async (style, padding, height, size) => {
      await render(
        <CollapsibleCard testID="card">
          <CollapsibleCardHeader testID="header">
            <CollapsibleCardTitle testID="title">
              <Probe testID="title-text" />
            </CollapsibleCardTitle>
            <CollapsibleCardActions />
          </CollapsibleCardHeader>
        </CollapsibleCard>,
      );

      expect(classesOf('header', style)).toEqual(
        expect.arrayContaining([padding, 'py-1.5', 'flex-row', 'items-center', 'justify-between']),
      );
      expect(classesOf('title', style)).toEqual(expect.arrayContaining([height, 'min-w-0', 'flex-row']));
      expect(emittedClasses(String(screen.getByTestId('title-text').props.children), style)).toEqual(
        expect.arrayContaining([size, 'text-muted-foreground', 'font-sans-medium']),
      );
    },
  );

  it('leaves the header unjustified when it holds no actions', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardHeader testID="header">
          <CollapsibleCardTitle>Layers</CollapsibleCardTitle>
        </CollapsibleCardHeader>
      </CollapsibleCard>,
    );

    expect(classesOf('header')).not.toContain('justify-between');
  });

  it.each([
    ['default', true],
    ['muted', true],
    ['plain', false],
    ['flush', false],
  ] as const)('rules the %s body off from the header: %s', async (variant, ruled) => {
    await render(<Example variant={variant} />);

    expect(classesOf('content').includes('border-t')).toBe(ruled);
  });
});
