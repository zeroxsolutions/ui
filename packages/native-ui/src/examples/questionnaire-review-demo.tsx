import type { ReactNode } from 'react';

import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';
import { Text } from '@/components/ui/text';

/** A review whose second choice is closed, and whose last question takes a note of several lines. */
function QuestionnaireReviewDemo(): ReactNode {
  return (
    <Questionnaire className="mx-auto max-w-md" defaultItem="recommend">
      <QuestionnaireProgress />
      <QuestionnaireItem name="recommend" required>
        <QuestionnaireTitle>Would you recommend the agent?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="yes" defaultChecked>
            <Text className="font-medium">Yes</Text>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="later" disabled>
            <Text className="font-medium">Ask me later</Text>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="notes">
        <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
        <QuestionnaireInput aria-label="Notes" placeholder="Write as many lines as you like..." multiline />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireNext>Next</QuestionnaireNext>
        <QuestionnaireSubmit>Send review</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  );
}

export { QuestionnaireReviewDemo };
