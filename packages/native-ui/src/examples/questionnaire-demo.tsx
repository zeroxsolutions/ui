import type { ReactNode } from 'react';

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
  type QuestionnaireValues,
} from '@/components/ui/questionnaire';
import { toast } from '@/components/ui/sonner';
import { Text } from '@/components/ui/text';

type Choice = { label: string; value: string; description?: string };
type Question = {
  name: string;
  title: string;
  description: string;
  required: boolean;
  multiple?: boolean;
  choices: Choice[];
  input?: { label: string; placeholder: string };
};

const questionnaireItems: Question[] = [
  {
    choices: [
      {
        description: 'Show what the agent ran and what came back.',
        label: 'Tool call timeline',
        value: 'tool-calls',
      },
      {
        description: 'Ask before sensitive or destructive actions.',
        label: 'Approval checkpoints',
        value: 'approvals',
      },
      {
        description: 'Make delegated work and results easier to follow.',
        label: 'Sub-agent handoffs',
        value: 'handoffs',
      },
    ],
    description: 'Choose a direction or describe another task.',
    input: {
      label: 'Another agent feature',
      placeholder: 'Describe another feature...',
    },
    name: 'direction',
    required: true,
    title: 'What should the agent build next?',
  },
  {
    choices: [
      { label: 'Progress', value: 'progress' },
      { label: 'Decisions', value: 'decisions' },
      { label: 'Risks', value: 'risks' },
      { label: 'Next step', value: 'next-step' },
    ],
    description: 'Select all that apply, or skip this question.',
    multiple: true,
    name: 'signals',
    required: false,
    title: 'What should every progress update include?',
  },
  {
    choices: [
      { label: 'Start now', value: 'now' },
      { label: 'Next development cycle', value: 'next-cycle' },
      { label: 'Add it to the backlog', value: 'backlog' },
    ],
    description: 'Choose when the agent should begin the work.',
    name: 'timing',
    required: true,
    title: 'When should work begin?',
  },
];

function QuestionnaireDemo(): ReactNode {
  function handleSubmit(answers: QuestionnaireValues): void {
    const signals = answers.signals;
    toast('Agent plan saved', {
      description: `Direction: ${String(answers.direction ?? 'None')} - Progress signals: ${
        Array.isArray(signals) && signals.length > 0 ? signals.join(', ') : 'None'
      } - Timing: ${String(answers.timing ?? 'None')}`,
    });
  }

  return (
    <Questionnaire
      className="mx-auto max-w-md"
      defaultItem="direction"
      items={questionnaireItems}
      shortcuts="letters"
      onSubmit={handleSubmit}
    >
      <QuestionnaireProgress />
      {questionnaireItems.map((question) => (
        <QuestionnaireItem
          key={question.name}
          multiple={question.multiple}
          name={question.name}
          required={question.required}
        >
          <QuestionnaireTitle>{question.title}</QuestionnaireTitle>
          <QuestionnaireDescription>{question.description}</QuestionnaireDescription>
          <QuestionnaireChoices>
            {question.choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                <Text className="font-medium">{choice.label}</Text>
                {choice.description ? (
                  <QuestionnaireChoiceDescription>{choice.description}</QuestionnaireChoiceDescription>
                ) : null}
              </QuestionnaireChoice>
            ))}
            {question.input ? (
              <QuestionnaireInput aria-label={question.input.label} placeholder={question.input.placeholder} />
            ) : null}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
      ))}
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext>Next</QuestionnaireNext>
        <QuestionnaireSubmit>Save plan</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  );
}

export { QuestionnaireDemo };
