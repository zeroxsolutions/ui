import { act, fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  type QuestionnaireItemStatus,
  type QuestionnaireProps,
} from './questionnaire';
import { Text } from './text';

const items = [
  { name: 'direction', required: true, choices: [{ value: 'tool-calls' }, { value: 'approvals' }] },
  { name: 'signals', required: false, choices: [{ value: 'progress' }, { value: 'risks' }] },
  { name: 'timing', required: true, choices: [{ value: 'now' }, { value: 'backlog' }] },
] as const;

function Plan({
  onStatusChange,
  ...props
}: Partial<QuestionnaireProps> & { onStatusChange?: (status: QuestionnaireItemStatus) => void }) {
  return (
    <Questionnaire items={items} {...props}>
      <QuestionnaireProgress />
      <QuestionnaireItem name="direction" required>
        <QuestionnaireTitle>What should the agent build next?</QuestionnaireTitle>
        <QuestionnaireDescription>Choose a direction or describe another task.</QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="tool-calls">
            <Text>Tool call timeline</Text>
            <QuestionnaireChoiceDescription>Show what the agent ran.</QuestionnaireChoiceDescription>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="approvals">
            <Text>Approval checkpoints</Text>
          </QuestionnaireChoice>
          <QuestionnaireInput aria-label="Another agent feature" placeholder="Describe another feature" />
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="signals" multiple onStatusChange={onStatusChange}>
        <QuestionnaireTitle>What should every progress update include?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="progress">
            <Text>Progress</Text>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="risks">
            <Text>Risks</Text>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="timing" required>
        <QuestionnaireTitle>When should work begin?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="now">
            <Text>Start now</Text>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="backlog">
            <Text>Add it to the backlog</Text>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit>Save plan</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  );
}

const press = async (name: string) => {
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name }));
};
const pick = async (name: string, role: 'radio' | 'checkbox' = 'radio') => {
  const user = userEvent.setup();
  await user.press(screen.getByRole(role, { name }));
};

beforeEach(() => {
  // The React Native preset mocks these already, and spyOn hands back the calls of earlier tests.
  jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockClear()
    .mockImplementation(() => undefined);
  jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockClear()
    .mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Questionnaire', () => {
  it('shows the first question alone, and its place as a progress bar', async () => {
    await render(<Plan />);

    expect(screen.getByText('What should the agent build next?')).toBeVisible();
    expect(screen.queryByText('When should work begin?')).not.toBeVisible();
    const progress = screen.getByRole('progressbar', { name: 'Questionnaire progress' });
    expect(progress).toHaveTextContent('Question 1 of 3');
    expect(progress).toHaveAccessibilityValue({ min: 1, max: 3, now: 1, text: 'Question 1 of 3' });
  });

  it('sets a choice or a button written as text with a value inside it in one Text', async () => {
    const count = 2;
    await render(
      <Questionnaire items={[{ name: 'size', choices: [{ value: 'small' }] }]}>
        <QuestionnaireItem name="size">
          <QuestionnaireTitle>How big?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="small">Small ({count} seats)</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSubmit>Save {count} answers</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>,
    );

    expect(screen.getByText('Small (2 seats)')).toBeOnTheScreen();
    expect(screen.getByText('Save 2 answers')).toBeOnTheScreen();
  });

  it('names each question group by its title, a radio group for one answer and a group for several', async () => {
    await render(<Plan />);

    expect(screen.getByLabelText('What should the agent build next?').props.role).toBe('radiogroup');
    expect(
      screen.getByLabelText('What should every progress update include?', { includeHiddenElements: true }).props.role,
    ).toBe('group');
  });

  it('picks one choice of a question with one answer, announced as radios', async () => {
    await render(<Plan />);

    await pick('Tool call timeline Show what the agent ran.');
    expect(screen.getByRole('radio', { name: 'Tool call timeline Show what the agent ran.' })).toBeChecked();

    await pick('Approval checkpoints');
    expect(screen.getByRole('radio', { name: 'Approval checkpoints' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tool call timeline Show what the agent ran.' })).not.toBeChecked();
  });

  it('keeps a required question until it is answered, saying why', async () => {
    await render(<Plan />);
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();

    await press('Next');

    expect(screen.getByText('What should the agent build next?')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an answer to continue.');

    await pick('Approval checkpoints');
    expect(screen.queryByRole('alert')).toBeNull();
    await press('Next');

    expect(screen.getByText('What should every progress update include?')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveTextContent('Question 2 of 3');
  });

  it('goes back a question with Previous, keeping its answer', async () => {
    await render(<Plan />);
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
    await pick('Approval checkpoints');
    await press('Next');

    await press('Previous');

    expect(screen.getByText('What should the agent build next?')).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Approval checkpoints' })).toBeChecked();
  });

  it('picks and unpicks several choices of a multiple question, announced as checkboxes', async () => {
    await render(<Plan defaultItem="signals" />);

    await pick('Progress', 'checkbox');
    await pick('Risks', 'checkbox');
    expect(screen.getByRole('checkbox', { name: 'Progress' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Risks' })).toBeChecked();

    await pick('Progress', 'checkbox');
    expect(screen.getByRole('checkbox', { name: 'Progress' })).not.toBeChecked();
  });

  it('skips a question that is not required, clearing its answer and reporting its status', async () => {
    const onStatusChange = jest.fn();
    await render(<Plan defaultItem="signals" onStatusChange={onStatusChange} />);
    await pick('Risks', 'checkbox');
    expect(onStatusChange).toHaveBeenLastCalledWith('answered');

    await press('Skip');

    expect(onStatusChange).toHaveBeenLastCalledWith('skipped');
    expect(screen.getByText('When should work begin?')).toBeVisible();
    await press('Previous');
    expect(screen.getByRole('checkbox', { name: 'Risks' })).not.toBeChecked();
  });

  it('answers with the text typed in its input, which unpicks the choices of a one-answer question', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    await render(<Plan onSubmit={onSubmit} />);
    await pick('Approval checkpoints');

    await user.type(screen.getByLabelText('Another agent feature'), 'Cost reports');

    expect(screen.getByRole('radio', { name: 'Approval checkpoints' })).not.toBeChecked();
    await press('Next');
    await press('Skip');
    await pick('Start now');
    await press('Save plan');

    expect(onSubmit).toHaveBeenCalledWith({ direction: 'Cost reports', timing: 'now' });
  });

  it('hands every answer to onSubmit from the last question', async () => {
    const onSubmit = jest.fn();
    await render(<Plan onSubmit={onSubmit} />);
    await pick('Tool call timeline Show what the agent ran.');
    await press('Next');
    await pick('Progress', 'checkbox');
    await pick('Risks', 'checkbox');
    await press('Next');
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    await pick('Add it to the backlog');

    await press('Save plan');

    expect(onSubmit).toHaveBeenCalledWith({
      direction: 'tool-calls',
      signals: ['progress', 'risks'],
      timing: 'backlog',
    });
  });

  it('goes back to the first question that cannot be left yet when submitted, showing its error', async () => {
    const onSubmit = jest.fn();
    await render(<Plan defaultItem="timing" onSubmit={onSubmit} />);
    await pick('Start now');

    await press('Save plan');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('What should the agent build next?')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an answer to continue.');
  });

  it('finishes when the last question is skipped', async () => {
    const onSubmit = jest.fn();
    await render(
      <Questionnaire onSubmit={onSubmit}>
        <QuestionnaireItem name="notes">
          <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="yes">
              <Text>Yes</Text>
            </QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSkip />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>,
    );
    await pick('Yes');

    await press('Skip');

    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it('takes a press on a controlled choice its question skipped, answering the question again', async () => {
    const onStatusChange = jest.fn();
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Questionnaire>
          <QuestionnaireItem name="notes" onStatusChange={onStatusChange}>
            <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="yes" checked={checked} onChange={setChecked}>
                <Text>Yes</Text>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
          <QuestionnaireItem name="more">
            <QuestionnaireTitle>More?</QuestionnaireTitle>
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
          </QuestionnaireActions>
        </Questionnaire>
      );
    }
    await render(<Controlled />);
    await pick('Yes');
    await press('Skip');
    await press('Previous');
    expect(screen.getByRole('radio', { name: 'Yes' })).not.toBeChecked();

    await pick('Yes');

    expect(screen.getByRole('radio', { name: 'Yes' })).toBeChecked();
    expect(onStatusChange).toHaveBeenLastCalledWith('answered');
  });

  it('calls the onPress given to a choice before picking it, and does not pick when it prevents the default', async () => {
    const onPress = jest.fn();
    await render(
      <Questionnaire>
        <QuestionnaireItem name="notes">
          <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="yes" onPress={onPress}>
              <Text>Yes</Text>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="no" onPress={(event) => event.preventDefault()}>
              <Text>No</Text>
            </QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>,
    );

    await pick('Yes');
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Yes' })).toBeChecked();

    // The test renderer's own press event keeps no record of preventDefault, so this one does.
    let prevented = false;
    await fireEvent.press(screen.getByRole('radio', { name: 'No' }), {
      preventDefault: () => {
        prevented = true;
      },
      isDefaultPrevented: () => prevented,
    });
    expect(screen.getByRole('radio', { name: 'No' })).not.toBeChecked();
  });

  it('goes on when Return is pressed in an input that holds the answer', async () => {
    const user = userEvent.setup();
    await render(<Plan />);
    const input = screen.getByLabelText('Another agent feature');
    await fireEvent(input, 'submitEditing', { nativeEvent: { text: '' } });
    expect(screen.getByText('What should the agent build next?')).toBeVisible();

    await user.type(input, 'Cost reports');
    await fireEvent(input, 'submitEditing', { nativeEvent: { text: 'Cost reports' } });

    expect(screen.getByText('What should every progress update include?')).toBeVisible();
  });

  it('warns once in development where items and the rendered questions disagree', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await render(<Plan items={[...items, { name: 'budget' }]} />);
    await pick('Approval checkpoints');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[Questionnaire] Item "budget" is defined but has no rendered QuestionnaireItem.',
    );
  });

  it('follows a controlled item and reports each step through onItemChange', async () => {
    const onItemChange = jest.fn();
    function Controlled() {
      const [item, setItem] = useState('direction');
      return (
        <Plan
          item={item}
          onItemChange={(next) => {
            setItem(next);
            onItemChange(next);
          }}
        />
      );
    }
    await render(<Controlled />);
    await pick('Approval checkpoints');

    await press('Next');

    expect(onItemChange).toHaveBeenCalledWith('signals');
    expect(screen.getByText('What should every progress update include?')).toBeVisible();
  });

  it('draws a chosen choice in the style, and the description lower beside its indicator', async () => {
    await render(<Plan />);
    await pick('Approval checkpoints');

    const chosen = screen.getByRole('radio', { name: 'Approval checkpoints' });
    expect(emittedClasses(chosen.props.className)).toEqual(expect.arrayContaining(['border-primary/40', 'bg-muted']));
    const described = screen.getByRole('radio', { name: 'Tool call timeline Show what the agent ran.' });
    const indicator = described.children[0] as ReturnType<typeof screen.getByRole>;
    expect(emittedClasses(indicator.props.className)).toContain('translate-y-0.5');
  });

  it('draws the input with the destructive border while the question shows its error, and the ring colour while focused', async () => {
    await render(<Plan />);
    const input = () => screen.getByLabelText('Another agent feature');

    await press('Next');
    expect(emittedClasses(input().props.className)).toContain('border-destructive');

    await fireEvent(input(), 'focus');
    await pick('Approval checkpoints');
    expect(emittedClasses(input().props.className)).toContain('border-ring');
  });

  it('spaces the title from the choices when the question has no description', async () => {
    await render(<Plan defaultItem="signals" />);

    expect(emittedClasses(screen.getByText('What should every progress update include?').props.className)).toContain(
      'mb-5',
    );
    await press('Previous');
    expect(emittedClasses(screen.getByText('What should the agent build next?').props.className)).not.toContain('mb-5');
  });

  describe('on iOS', () => {
    const os = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'ios';
    });
    afterEach(() => {
      Platform.OS = os;
    });

    it('announces the error and the new place, and moves the screen reader to the next question', async () => {
      await render(<Plan />);

      await press('Next');
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Choose an answer to continue.');

      await pick('Approval checkpoints');
      await press('Next');

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Question 2 of 3');
      const title = screen.getByText('What should every progress update include?');
      expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ children: title.props.children }) }),
        'focus',
      );
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

    const key = (name: string, extra: object = {}) =>
      act(() =>
        fireEvent(screen.getByTestId('questionnaire'), 'keyDown', {
          nativeEvent: { key: name, ...extra },
          preventDefault: () => undefined,
        }),
      );
    /** A key pressed on `element`, which holds focus, as React Native Web hands it on. */
    const keyOn = (element: ReturnType<typeof screen.getByRole>, name: string, eventName = 'keyDown') => {
      const target = {};
      return act(() =>
        fireEvent(element, eventName, {
          nativeEvent: { key: name },
          target,
          currentTarget: target,
          preventDefault: () => undefined,
          stopPropagation: () => undefined,
        }),
      );
    };
    const radio = (name: string) => screen.getByRole('radio', { name });

    it('picks a choice with Space, and goes on with Enter once it is picked', async () => {
      await render(<Plan />);
      await keyOn(radio('Approval checkpoints'), 'Enter');
      expect(radio('Approval checkpoints')).not.toBeChecked();

      await keyOn(radio('Approval checkpoints'), ' ');
      expect(radio('Approval checkpoints')).toBeChecked();
      await keyOn(radio('Approval checkpoints'), 'Enter');

      expect(screen.getByText('What should every progress update include?')).toBeVisible();
    });

    it('moves between the radios with the arrows, picking each, and wraps', async () => {
      await render(<Plan />);
      await keyOn(screen.getByLabelText('What should the agent build next?'), 'ArrowDown');
      expect(radio('Tool call timeline Show what the agent ran.')).toBeChecked();

      await keyOn(radio('Tool call timeline Show what the agent ran.'), 'ArrowDown');
      expect(radio('Approval checkpoints')).toBeChecked();

      await keyOn(radio('Approval checkpoints'), 'ArrowRight');
      expect(radio('Tool call timeline Show what the agent ran.')).toBeChecked();
      expect(screen.getByText('What should the agent build next?')).toBeVisible();

      await keyOn(radio('Tool call timeline Show what the agent ran.'), 'ArrowUp');
      expect(radio('Approval checkpoints')).toBeChecked();
    });

    /** A key event whose preventDefault is a spy, with `nativeEvent` extras such as a modifier. */
    const keyEvent = (name: string, extra: object = {}) => {
      const target = {};
      return {
        nativeEvent: { key: name, ...extra },
        target,
        currentTarget: target,
        preventDefault: jest.fn(),
        stopPropagation: () => undefined,
        isDefaultPrevented: () => false,
      };
    };

    it('calls the onKeyDown given to a choice first, still picking with Space unless it prevents the default', async () => {
      const onKeyDown = jest.fn();
      await render(
        <Questionnaire>
          <QuestionnaireItem name="notes">
            <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="yes" {...({ onKeyDown } as object)}>
                <Text>Yes</Text>
              </QuestionnaireChoice>
              <QuestionnaireChoice
                value="no"
                {...({ onKeyDown: (event: { preventDefault: () => void }) => event.preventDefault() } as object)}
              >
                <Text>No</Text>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
        </Questionnaire>,
      );

      await keyOn(radio('Yes'), ' ');
      expect(onKeyDown).toHaveBeenCalled();
      expect(radio('Yes')).toBeChecked();

      let prevented = false;
      await act(() =>
        fireEvent(radio('No'), 'keyDown', {
          ...keyEvent(' '),
          preventDefault: () => {
            prevented = true;
          },
          isDefaultPrevented: () => prevented,
        }),
      );
      expect(radio('No')).not.toBeChecked();
    });

    it('lets Shift+Enter break the line in a multiline input', async () => {
      await render(
        <Questionnaire>
          <QuestionnaireItem name="notes">
            <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
            <QuestionnaireInput aria-label="Notes" multiline />
          </QuestionnaireItem>
        </Questionnaire>,
      );
      const event = keyEvent('Enter', { shiftKey: true });

      await act(() => fireEvent(screen.getByLabelText('Notes'), 'keyPress', event));

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does not go on for Ctrl+Enter on a disabled choice, which the Questionnaire answers itself', async () => {
      await render(
        <Questionnaire>
          <QuestionnaireItem name="notes">
            <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="yes" defaultChecked>
                <Text>Yes</Text>
              </QuestionnaireChoice>
              <QuestionnaireChoice value="no" disabled>
                <Text>No</Text>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
          <QuestionnaireItem name="more">
            <QuestionnaireTitle>More?</QuestionnaireTitle>
          </QuestionnaireItem>
        </Questionnaire>,
      );
      const event = keyEvent('Enter', { ctrlKey: true });

      // The test renderer takes no events on a disabled Pressable, though a browser hands it the keys while it
      // holds focus, so its handler is called itself.
      await act(() => (radio('No').props as { onKeyDown: (event: object) => void }).onKeyDown(event));

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(screen.getByText('Anything else?')).toBeVisible();
    });

    it('goes on with Enter in the input once it holds the answer', async () => {
      const user = userEvent.setup();
      await render(<Plan />);
      const input = screen.getByLabelText('Another agent feature');
      await keyOn(input, 'Enter', 'keyPress');
      expect(screen.getByText('What should the agent build next?')).toBeVisible();

      await user.type(input, 'Cost reports');
      await keyOn(input, 'Enter', 'keyPress');

      expect(screen.getByText('What should every progress update include?')).toBeVisible();
    });

    it('names the keys each part answers', async () => {
      await render(<Plan shortcuts="letters" />);
      expect(radio('Approval checkpoints').props['aria-keyshortcuts']).toBe('B');
      expect(screen.getByLabelText('What should the agent build next?').props['aria-keyshortcuts']).toBe(
        'Meta+Enter Control+Enter ArrowUp ArrowDown',
      );

      await pick('Approval checkpoints');

      expect(radio('Approval checkpoints').props['aria-keyshortcuts']).toBe('B Enter');
      expect(screen.getByLabelText('What should the agent build next?').props['aria-keyshortcuts']).toBe(
        'Meta+Enter Control+Enter ArrowUp ArrowDown ArrowRight',
      );
      expect(screen.getByRole('button', { name: 'Next' }).props['aria-keyshortcuts']).toBe('Enter');
    });

    it('shows each choice its letter with shortcuts, and picks the choice whose letter is pressed', async () => {
      await render(<Plan shortcuts="letters" testID="questionnaire" />);
      const question = within(screen.getByLabelText('What should the agent build next?'));

      expect(question.getByText('A', { includeHiddenElements: true })).toBeTruthy();
      expect(question.getByText('B', { includeHiddenElements: true })).toBeTruthy();

      await key('b');

      expect(screen.getByRole('radio', { name: 'Approval checkpoints' })).toBeChecked();
    });

    it('steps with the side arrows once the question is answered, and goes on with Ctrl+Enter', async () => {
      await render(<Plan testID="questionnaire" />);
      await key('ArrowRight');
      expect(screen.getByText('What should the agent build next?')).toBeVisible();

      await pick('Approval checkpoints');
      await key('ArrowRight');
      expect(screen.getByText('What should every progress update include?')).toBeVisible();

      await key('ArrowLeft');
      expect(screen.getByText('What should the agent build next?')).toBeVisible();

      await key('Enter', { ctrlKey: true });
      expect(screen.getByText('What should every progress update include?')).toBeVisible();
    });
  });

  it('shows no shortcut on a device', async () => {
    await render(<Plan shortcuts="letters" />);

    expect(screen.queryByText('A', { includeHiddenElements: true })).toBeNull();
  });
});
