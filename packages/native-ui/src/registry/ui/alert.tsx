import { cva, type VariantProps } from 'class-variance-authority';
import { Children, createContext, isValidElement, useContext, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@slot=icon` while the alert holds an icon; the registry build replaces each with the
// classes translated for the target engine.

const alertVariants = cva('relative w-full cn-alert', {
  variants: {
    variant: {
      default: 'cn-alert-variant-default',
      destructive: 'cn-alert-variant-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const alertTextVariants = cva('cn-alert/text', {
  variants: {
    variant: {
      default: 'cn-alert-variant-default/text',
      destructive: 'cn-alert-variant-destructive/text',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

/** The variant of the Alert around a part, which the description takes its colour from. */
const AlertVariantContext = createContext<AlertVariant>('default');

type AlertProps = ComponentProps<typeof View> & VariantProps<typeof alertVariants>;

/**
 * A box that calls attention to a message, announced as an alert. Compose it from an optional Icon,
 * an AlertTitle, an AlertDescription and an optional AlertAction, each a direct child: an Icon is set
 * at 16px beside the title and description, in the colour of the variant's text, and an AlertAction
 * is pinned to the top right with the text kept clear of it.
 */
function Alert({ className, variant, children, ...props }: AlertProps): ReactNode {
  const items = Children.toArray(children);
  const isIcon = (child: ReactNode): boolean => isValidElement(child) && child.type === Icon;
  const isAction = (child: ReactNode): boolean => isValidElement(child) && child.type === AlertAction;
  const icons = items.filter(isIcon);
  const actions = items.filter(isAction);
  const text = items.filter((child) => !isIcon(child) && !isAction(child));
  const holdsIcon = icons.length > 0;

  return (
    <AlertVariantContext.Provider value={variant ?? 'default'}>
      <TextClassContext.Provider value={alertTextVariants({ variant })}>
        <IconClassContext.Provider value="cn-alert/icon">
          <View
            role="alert"
            className={cn(
              alertVariants({ variant }),
              holdsIcon && 'flex-row items-start cn-alert@slot=icon',
              actions.length > 0 && 'cn-alert@slot=alert-action',
              className,
            )}
            {...props}
          >
            {holdsIcon ? (
              <>
                {icons}
                {/* Upstream's grid sets the title and description in a column beside the icon, 2px apart in both styles. */}
                <View className="flex-1 gap-0.5">{text}</View>
              </>
            ) : (
              text
            )}
            {actions}
          </View>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </AlertVariantContext.Provider>
  );
}

/** The heading line of an Alert. */
function AlertTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('cn-alert-title/text', className)} {...props} />;
}

/** The body of an Alert, muted, or in the destructive colour in a destructive Alert. */
function AlertDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const variant = useContext(AlertVariantContext);
  return (
    <Text
      className={cn(
        'cn-alert-description/text',
        variant === 'destructive' && 'cn-alert-variant-destructive/text@part=alert-description',
        className,
      )}
      {...props}
    />
  );
}

/** A control pinned to the top right of an Alert, such as a Button that dismisses it. */
function AlertAction({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('cn-alert-action', className)} {...props} />;
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
export type { AlertProps };
