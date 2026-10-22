import { Children, isValidElement, type ReactNode } from 'react';
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

/**
 * `children` set in one Text when they are only strings and numbers, which a View cannot hold bare; anything else,
 * a function child included, as given.
 */
function asText(children: ReactNode): ReactNode {
  if (typeof children === 'function') return children;
  const parts = Children.toArray(children);
  return parts.length > 0 && parts.every((part) => typeof part === 'string' || typeof part === 'number') ? (
    <Text>{children}</Text>
  ) : (
    children
  );
}

export { asText, textOf };
