import type { Meta, StoryObj } from '@storybook/react-vite';
import { Circle } from 'lucide-react';

import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '@zeroxsolutions/ui/components/split-button';

/**
 * `SplitButton` is a single divided control built on `ButtonGroup`: a primary
 * action segment and a caret segment that opens a menu of related variants of
 * that action, sharing one outline with a seam. It is a compound - the consumer
 * composes `SplitButtonAction`, `SplitButtonMenu`, `SplitButtonTrigger`,
 * `SplitButtonContent`, and `SplitButtonItem`. The primary runs a fixed action;
 * each item runs its own handler.
 */
const meta: Meta<typeof SplitButton> = {
  title: 'Components/SplitButton',
  component: SplitButton,
};
export default meta;

type Story = StoryObj<typeof SplitButton>;

/**
 * The canonical use: an AI-consent "Allow" control. The primary grants the safe
 * default (allow once); riskier graduated scopes live behind the caret.
 */
export const AllowWithScopes: Story = {
  render: () => (
    <SplitButton>
      <SplitButtonAction onClick={() => {}}>Allow once</SplitButtonAction>
      <SplitButtonMenu>
        <SplitButtonTrigger aria-label="More allow options" />
        <SplitButtonContent>
          <SplitButtonItem onClick={() => {}}>Allow this session</SplitButtonItem>
          <SplitButtonItem onClick={() => {}}>Always allow</SplitButtonItem>
        </SplitButtonContent>
      </SplitButtonMenu>
    </SplitButton>
  ),
};

/**
 * A filled (`default`) variant reads as the emphasised action - pass the matched
 * variant to both segments so they stay one control.
 */
export const Emphasised: Story = {
  render: () => (
    <SplitButton>
      <SplitButtonAction variant="default" onClick={() => {}}>
        Deploy
      </SplitButtonAction>
      <SplitButtonMenu>
        <SplitButtonTrigger variant="default" aria-label="More deploy options" />
        <SplitButtonContent>
          <SplitButtonItem onClick={() => {}}>Deploy to staging</SplitButtonItem>
          <SplitButtonItem onClick={() => {}}>Deploy to production</SplitButtonItem>
        </SplitButtonContent>
      </SplitButtonMenu>
    </SplitButton>
  ),
};

/**
 * The primary segment is not restricted to a label - it can be an icon button.
 */
export const IconPrimary: Story = {
  render: () => (
    <SplitButton>
      <SplitButtonAction size="icon" aria-label="Add shape" onClick={() => {}}>
        <Circle />
      </SplitButtonAction>
      <SplitButtonMenu>
        <SplitButtonTrigger aria-label="More shapes" />
        <SplitButtonContent>
          <SplitButtonItem onClick={() => {}}>Rectangle</SplitButtonItem>
          <SplitButtonItem onClick={() => {}}>Ellipse</SplitButtonItem>
        </SplitButtonContent>
      </SplitButtonMenu>
    </SplitButton>
  ),
};
