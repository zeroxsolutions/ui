import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Text } from '../ui/text';

/**
 * The text `node` draws, the text of nested elements included, such as the name a screen reader is given for a
 * row or a choice.
 * @param separator - put between the texts of sibling nodes; none by default, so `<Text>Hi</Text>!` reads "Hi!"
 */
function textOf(node: ReactNode, separator = ''): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((child: ReactNode) => textOf(child, separator)).join(separator);
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children, separator);
  return '';
}

/** Whether `children` are only strings and numbers, one or several, which a View cannot hold bare. */
function isText(children: ReactNode): boolean {
  if (typeof children === 'function') return false;
  const parts = Children.toArray(children);
  return parts.length > 0 && parts.every((part) => typeof part === 'string' || typeof part === 'number');
}

/**
 * `children` set in one Text when they are only strings and numbers; anything else, a function child included,
 * as given.
 * @param props - given to that Text, such as `numberOfLines` or a `className`
 */
function asText<Given extends ReactNode | ((...args: never[]) => ReactNode)>(
  children: Given,
  props?: ComponentProps<typeof Text>,
): Given | ReactElement {
  return isText(children as ReactNode) ? <Text {...props}>{children as ReactNode}</Text> : children;
}

export { asText, isText, textOf };
