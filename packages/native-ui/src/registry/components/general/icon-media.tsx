import { useContext, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';
import { IconClassContext } from '../../ui/icon';
import { TextClassContext } from '../../ui/text';

// A text class under any variant, such as `text-muted-foreground` or `dark:text-primary`.
const TEXT_CLASS = /^(?:[^:\s]+:)*!?text-/;

/**
 * `className` split into the text classes, which a View does not draw and its glyph takes, and the rest,
 * which style the square.
 */
function splitTextClasses(className: string | undefined): { text: string; view: string } {
  const tokens = className?.split(/\s+/).filter(Boolean) ?? [];
  return {
    text: tokens.filter((token) => TEXT_CLASS.test(token)).join(' '),
    view: tokens.filter((token) => !TEXT_CLASS.test(token)).join(' '),
  };
}

/**
 * A small square holding one glyph, tinted by the caller's `className` with theme tokens (the design
 * system ships no tint). Its background classes style the square, and its text classes go to the Icon
 * inside, as the web's svg takes the square's text colour. It carries no meaning of its own, so one serves
 * model abilities, generation types or any icon the caller picks. Give it an `aria-label`, which makes it
 * one image for a screen reader, and compose a tooltip around it when the glyph needs words:
 *
 *   <Tooltip>
 *     <TooltipTrigger aria-label="Vision input">
 *       <IconMedia className="bg-muted text-muted-foreground">
 *         <Icon as={Eye} />
 *       </IconMedia>
 *     </TooltipTrigger>
 *     <TooltipContent><Text>Vision input</Text></TooltipContent>
 *   </Tooltip>
 *
 * An Icon inside it with no `size-*` class of its own is drawn at `size-3`.
 */
function IconMedia({ className, 'aria-label': label, ...props }: ComponentProps<typeof View>): ReactNode {
  const textClass = useContext(TextClassContext);
  const { text, view } = splitTextClasses(className);

  return (
    <TextClassContext.Provider value={cn(textClass, text) || undefined}>
      <IconClassContext.Provider value="size-3">
        <View
          accessible={label !== undefined}
          role={label === undefined ? undefined : 'img'}
          aria-label={label}
          className={cn('size-5 items-center justify-center rounded-sm', view)}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { IconMedia };
