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

    expect(onSubmit).toHaveBeenCalledWith({ direction: 'Cost reports', signals: [], timing: 'now' });
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
