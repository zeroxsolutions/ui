import { CircleAlertIcon } from 'lucide-react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/**
 * The button that shows a problem's messages on hover and on focus, and describes the marked text by the same
 * messages. `slot` is the profile's own `data-slot`, which its F8 handler looks for; `label` is the button's name.
 */
export function ProblemMarker({
  id,
  messages,
  slot,
  label,
}: {
  id: string;
  messages: readonly string[];
  slot: string;
  label: string;
}) {
  const text = messages.join('. ');
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              data-slot={slot}
              data-mark-id={id}
              aria-label={label}
              aria-describedby={id}
              className="cn-editor-problem"
            >
              <CircleAlertIcon aria-hidden />
            </Button>
          }
        />
        <TooltipContent side="top">{text}</TooltipContent>
      </Tooltip>
      <span id={id} className="sr-only">
        {text}
      </span>
    </>
  );
}
