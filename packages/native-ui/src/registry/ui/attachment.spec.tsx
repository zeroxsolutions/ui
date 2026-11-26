import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { FileText, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';
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
import { Text } from './text';

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

type AttachmentProps = Parameters<typeof Attachment>[0];

function File(props: Omit<AttachmentProps, 'children'>): ReactNode {
  return (
    <Attachment {...props}>
      <AttachmentMedia>
        <Icon as={FileText} />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
        <AttachmentDescription>PDF - 2.4 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
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
          <Pressable role="link" aria-label="Open workspace.png" onPress={open} />
        </AttachmentTrigger>
      </Attachment>,
    );

    await userEvent.setup().press(screen.getByRole('link', { name: 'Open workspace.png' }));

    expect(open).toHaveBeenCalledTimes(1);
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
  it('scrolls its attachments sideways, snapping to the start of each as a simulated layout places them', async () => {
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
