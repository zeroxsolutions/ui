import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { FileText, X } from 'lucide-react-native';
import { useContext, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { MessageContext } from '../lib/message-context';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from './attachment';
import { Icon } from './icon';
import { SpinnerClassContext } from './spinner';
import { Text } from './text';

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className);
}

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

type AttachmentProps = Parameters<typeof Attachment>[0];

function File(props: Omit<AttachmentProps, 'children'>): ReactNode {
  return (
    <Attachment testID="attachment" {...props}>
      <AttachmentMedia testID="media">
        <Icon as={FileText} />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
        <AttachmentDescription>PDF - 2.4 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions testID="actions">
        <AttachmentAction aria-label="Remove sales-dashboard.pdf">
          <Icon as={X} />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

describe('Attachment', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('draws a card with its media beside a one-line title and a muted description', async () => {
    reduceMotion(false);
    await render(<File />);

    expect(classesOf('attachment')).toEqual(
      expect.arrayContaining(['flex-row', 'items-center', 'border', 'border-border', 'bg-card', 'rounded-xl']),
    );
    expect(classesOf('attachment')).not.toContain('border-dashed');
    expect(classesOf('media')).toEqual(expect.arrayContaining(['bg-muted', 'w-10', 'aspect-square']));
    expect(screen.getByText('sales-dashboard.pdf').props.numberOfLines).toBe(1);
    expect(emittedClasses(screen.getByText('PDF - 2.4 MB').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-xs']),
    );
  });

  it("pads the card by the style's media and content padding, the content's winning on its axes", async () => {
    reduceMotion(false);
    await render(<File />);

    const classes = classesOf('attachment');
    expect(classes).toEqual(expect.arrayContaining(['p-2', 'px-2.5', 'py-2', 'gap-2']));
    expect(classes.indexOf('p-2')).toBeLessThan(classes.indexOf('px-2.5'));
  });

  it('pads a card with media and no content by the media padding alone', async () => {
    await render(
      <Attachment size="sm" testID="attachment">
        <AttachmentMedia />
      </Attachment>,
    );

    expect(classesOf('attachment')).toContain('p-1.5');
    expect(classesOf('attachment')).not.toContain('px-2');
  });

  it('dashes the border of an idle attachment', async () => {
    reduceMotion(false);
    await render(<File state="idle" />);

    expect(classesOf('attachment')).toContain('border-dashed');
  });

  it('draws a failed attachment in the destructive colour', async () => {
    reduceMotion(false);
    await render(<File state="error" />);

    expect(classesOf('attachment')).toContain('border-destructive/30');
    expect(classesOf('media')).toContain('bg-destructive/10');
    expect(emittedClasses(screen.getByText('PDF - 2.4 MB').props.className)).toContain('text-destructive/80');
  });

  describe('its title', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /** The view the title pulses in, which is the title's own when it stands still. */
    const titleView = () => screen.getByText('sales-dashboard.pdf').parent;

    /** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
    const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

    /** The opacity the title is drawn at, after `ms` pass, or none when it is not animated. */
    const titleOpacityAfter = async (ms: number): Promise<unknown> => {
      await elapse(ms);
      return StyleSheet.flatten(titleView()?.props.style)?.opacity;
    };

    it.each(['uploading', 'processing'] as const)('fades to half opacity and back while %s', async (state) => {
      reduceMotion(false);
      await render(<File state={state} />);

      await elapse(1000);
      expect(titleView()).toHaveAnimatedStyle({ opacity: 0.5 });
      await elapse(1000);
      expect(titleView()).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('stands still once done', async () => {
      reduceMotion(false);
      await render(<File state="done" />);

      expect(await titleOpacityAfter(1000)).toBeUndefined();
    });

    it('stands still while uploading when the person asked to reduce motion', async () => {
      reduceMotion(true);
      await render(<File state="uploading" />);

      expect(await titleOpacityAfter(1000)).toBeUndefined();
    });
  });

  describe('on the web', () => {
    const os = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'web';
    });
    afterEach(() => {
      Platform.OS = os;
    });

    /** A focus event whose target answers `:focus-visible` with `visible`, as a browser's does. */
    const focusFrom = (visible: boolean): object => ({
      target: { matches: (selector: string) => selector === ':focus-visible' && visible },
    });

    it.each([
      ['its trigger', 'Open report.pdf'],
      ['an action', 'Remove report.pdf'],
    ])('rings the card while %s holds keyboard focus', async (_control, name) => {
      reduceMotion(false);
      await render(
        <Attachment testID="attachment">
          <AttachmentContent>
            <AttachmentTitle>report.pdf</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove report.pdf">
              <Icon as={X} />
            </AttachmentAction>
          </AttachmentActions>
          <AttachmentTrigger aria-label="Open report.pdf" />
        </Attachment>,
      );

      await fireEvent(screen.getByRole('button', { name }), 'focus', focusFrom(true));
      expect(classesOf('attachment')).toContain('border-ring/50');

      await fireEvent(screen.getByRole('button', { name }), 'blur');
      expect(classesOf('attachment')).not.toContain('border-ring/50');
    });

    it('draws no ring when a press focused the trigger', async () => {
      reduceMotion(false);
      await render(
        <Attachment testID="attachment">
          <AttachmentTrigger aria-label="Open report.pdf" />
        </Attachment>,
      );

      await fireEvent(screen.getByRole('button'), 'focus', focusFrom(false));

      expect(classesOf('attachment')).not.toContain('border-ring/50');
    });
  });

  it('stacks a vertical attachment, its media full width and its actions over the top end', async () => {
    reduceMotion(false);
    await render(<File orientation="vertical" />);

    expect(classesOf('attachment')).toEqual(expect.arrayContaining(['flex-col', 'w-[120px]']));
    expect(classesOf('media')).toContain('w-full');
    expect(classesOf('actions')).toEqual(expect.arrayContaining(['absolute', 'top-3', 'right-3']));
  });

  it('sizes a spinner in vertical media up', async () => {
    function SpinnerSize(): ReactNode {
      return <Text testID="spinner-size" className={useContext(SpinnerClassContext)} />;
    }
    await render(
      <Attachment orientation="vertical">
        <AttachmentMedia>
          <SpinnerSize />
        </AttachmentMedia>
      </Attachment>,
    );

    expect(classesOf('spinner-size')).toContain('size-6');
  });

  it('shrinks its media at size xs', async () => {
    reduceMotion(false);
    await render(<File size="xs" />);

    expect(classesOf('media')).toEqual(expect.arrayContaining(['w-7', 'rounded-md']));
    expect(classesOf('attachment')).toContain('rounded-lg');
  });

  it('dims image media until the upload is done', async () => {
    await render(
      <>
        <Attachment state="uploading">
          <AttachmentMedia variant="image" testID="uploading" />
        </Attachment>
        <Attachment>
          <AttachmentMedia variant="image" testID="done" />
        </Attachment>
      </>,
    );

    expect(classesOf('uploading')).toContain('opacity-60');
    expect(classesOf('done')).toContain('opacity-100');
  });

  it('sits at the end of an end-aligned message', async () => {
    reduceMotion(false);
    await render(
      <MessageContext.Provider value={{ align: 'end', countGhost: () => undefined }}>
        <File />
      </MessageContext.Provider>,
    );

    expect(classesOf('attachment')).toContain('self-end');
  });

  it('takes a press on the whole card with a trigger, the actions taking their own', async () => {
    reduceMotion(false);
    const open = jest.fn();
    const remove = jest.fn();
    await render(
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove report.pdf" onPress={remove}>
            <Icon as={X} />
          </AttachmentAction>
        </AttachmentActions>
        <AttachmentTrigger aria-label="Open report.pdf" onPress={open} />
      </Attachment>,
    );
    const user = userEvent.setup();

    await user.press(screen.getByRole('button', { name: 'Open report.pdf' }));
    await user.press(screen.getByRole('button', { name: 'Remove report.pdf' }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('renders the trigger as its child with asChild', async () => {
    reduceMotion(false);
    const open = jest.fn();
    await render(
      <Attachment>
        <AttachmentTrigger asChild>
          <Pressable role="link" aria-label="Open workspace.png" onPress={open} testID="trigger" />
        </AttachmentTrigger>
      </Attachment>,
    );

    await userEvent.setup().press(screen.getByRole('link', { name: 'Open workspace.png' }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(classesOf('trigger')).toEqual(expect.arrayContaining(['absolute', 'inset-0']));
  });
});

type Instance = ReturnType<typeof screen.getByTestId>;

/** The elements under `root`, outermost first, that measure their own layout. */
function measured(root: Instance): Instance[] {
  return root.children.flatMap((child) =>
    typeof child === 'string' ? [] : child.props.onLayout ? [child] : measured(child),
  );
}

describe('AttachmentGroup', () => {
  it('scrolls its attachments sideways, snapping to the start of each', async () => {
    await render(
      <AttachmentGroup testID="group">
        <Attachment>
          <AttachmentContent>
            <Text>One</Text>
          </AttachmentContent>
        </Attachment>
        <Attachment>
          <AttachmentContent>
            <Text>Two</Text>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>,
    );
    const group = screen.getByTestId('group');
    expect(group.props.horizontal).toBe(true);

    const slots = measured(group);
    await fireEvent(slots[0], 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 160, height: 60 } } });
    await fireEvent(slots[1], 'layout', { nativeEvent: { layout: { x: 172, y: 0, width: 160, height: 60 } } });

    expect(screen.getByTestId('group').props.snapToOffsets).toEqual([0, 168]);
  });
});
