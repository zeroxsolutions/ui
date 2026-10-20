import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { Text, TextClassContext } from './text';

type CardSize = 'default' | 'sm';

/** The size of the Card around a part, which sets the spacing every part draws. */
const CardSizeContext = createContext<CardSize>('default');

// A `cn-<slot>` token stands for that Vega slot's view classes and `cn-<slot>/text` for its text
// classes, and `@size=sm` for the classes behind the small size; the registry build replaces each
// with the classes translated for the target engine.

type CardProps = ComponentProps<typeof View> & {
  /** `sm` tightens the spacing inside the card from 24px to 16px. */
  size?: CardSize;
};

/**
 * A surface that groups related content. Compose it from CardHeader, CardContent and CardFooter;
 * the Text inside takes the card's text colour and size.
 */
function Card({ className, size = 'default', ...props }: CardProps): ReactNode {
  return (
    <CardSizeContext.Provider value={size}>
      <TextClassContext.Provider value="cn-card/text">
        <View className={cn('flex-col cn-card', size === 'sm' && 'cn-card@size=sm', className)} {...props} />
      </TextClassContext.Provider>
    </CardSizeContext.Provider>
  );
}

/** The top of a Card, holding a CardTitle and a CardDescription. */
function CardHeader({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const size = useContext(CardSizeContext);
  return <View className={cn('cn-card-header', size === 'sm' && 'cn-card-header@size=sm', className)} {...props} />;
}

/** The heading of a Card, announced as a heading. */
function CardTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const size = useContext(CardSizeContext);
  return (
    <Text
      role="heading"
      className={cn('cn-card-title/text', size === 'sm' && 'cn-card-title/text@size=sm', className)}
      {...props}
    />
  );
}

/** The muted line of text under a CardTitle. */
function CardDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('cn-card-description/text', className)} {...props} />;
}

/** The body of a Card. */
function CardContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const size = useContext(CardSizeContext);
  return <View className={cn('cn-card-content', size === 'sm' && 'cn-card-content@size=sm', className)} {...props} />;
}

/** The bottom of a Card, laying its children out in a row, such as its actions. */
function CardFooter({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const size = useContext(CardSizeContext);
  return (
    <View
      className={cn('flex-row items-center cn-card-footer', size === 'sm' && 'cn-card-footer@size=sm', className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
export type { CardProps };
