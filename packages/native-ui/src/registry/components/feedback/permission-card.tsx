import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { CircleCheckIcon } from '../../icons/lucide/circle-check-icon';
import { CircleIcon } from '../../icons/lucide/circle-icon';
import { CircleXIcon } from '../../icons/lucide/circle-x-icon';
import { usePlayOnReach, type IconHandle } from '../../lib/icon-motion';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Badge } from '../../ui/badge';
import { Card, CardFooter, CardTitle } from '../../ui/card';
import { Icon } from '../../ui/icon';

/** The lifecycle of a consent request; the host sets it, and nothing inside the card changes it. */
type PermissionCardStatusValue = 'pending' | 'approved' | 'denied';

/** The card's status, which the web reads off the root's `data-status` through group selectors. */
const PermissionCardContext = createContext<PermissionCardStatusValue>('pending');

/** The icon the status badge draws for each status. */
const STATUS_ICONS = {
  pending: CircleIcon,
  approved: CircleCheckIcon,
  denied: CircleXIcon,
} as const satisfies Readonly<Record<PermissionCardStatusValue, unknown>>;

type PermissionCardProps = ComponentProps<typeof Card> & {
  status: PermissionCardStatusValue;
};

/**
 * An inline, non-modal AI-consent request inside a chat message, which stays in scrollback after it resolves.
 * It is a Card, small by default. The host owns `status`, and the parts show, hide and pick their icon from it.
 * Every word is the caller's:
 *
 *   <PermissionCard status={status}>
 *     <CardHeader>
 *       <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
 *       <CardDescription>Deploy the web app to production</CardDescription>
 *       <PermissionCardStatus>{statusWord}</PermissionCardStatus>
 *     </CardHeader>
 *     <PermissionCardActions>
 *       <Button variant="ghost" onPress={deny}><Text>Deny</Text></Button>
 *       <Button onPress={allow}><Text>Allow once</Text></Button>
 *     </PermissionCardActions>
 *     <PermissionCardResolved>
 *       <CardDescription>Allowed once - 2:14pm</CardDescription>
 *     </PermissionCardResolved>
 *   </PermissionCard>
 *
 * The decision row is asymmetric on purpose: a plain Deny and a graduated-scope Allow. For a risky operation
 * the caller gives Deny the emphasised button variant.
 */
function PermissionCard({ status, size = 'sm', className, children, ...props }: PermissionCardProps): ReactNode {
  // The decision and resolved rows are footers the Card does not know by type, so the card's own slot reads
  // them, padding its bottom as the style pads it above a footer, as the web's root does for their slots.
  const holdsFooter = Children.toArray(children).some(
    (child) => isValidElement(child) && (child.type === PermissionCardActions || child.type === PermissionCardResolved),
  );
  return (
    <PermissionCardContext.Provider value={status}>
      <Card
        size={size}
        className={cn(holdsFooter && 'cn-permission-card@slot=permission-card-actions', className)}
        {...props}
      >
        {children}
      </Card>
    </PermissionCardContext.Provider>
  );
}

/** What the assistant asks to do, on one truncated line. */
function PermissionCardTitle({ className, ...props }: ComponentProps<typeof CardTitle>): ReactNode {
  return <CardTitle numberOfLines={1} className={cn('min-w-0', className)} {...props} />;
}

/**
 * A Badge, `outline` unless the caller passes another `variant` (`destructive` for a denied request): its
 * children are the status word, set in a Text when a string, and its icon follows the card's status and is
 * hidden from a screen reader, which reads the word. The icon plays once as the card turns to its status, and not
 * when the card is first drawn.
 */
function PermissionCardStatus({
  variant = 'outline',
  className,
  children,
  ...props
}: ComponentProps<typeof Badge>): ReactNode {
  const status = useContext(PermissionCardContext);
  // One icon is drawn at a time, so the ref holds whichever the status shows.
  const icon = useRef<IconHandle>(null);
  usePlayOnReach(icon, status === 'pending');
  usePlayOnReach(icon, status === 'approved');
  usePlayOnReach(icon, status === 'denied');
  return (
    <Badge variant={variant} className={className} {...props}>
      <View aria-hidden>
        <Icon as={STATUS_ICONS[status]} ref={icon} />
      </View>
      {asText(children)}
    </Badge>
  );
}

/** The decision row, a CardFooter laid out to the end, shown only while the request is `pending`. */
function PermissionCardActions({ className, ...props }: ComponentProps<typeof CardFooter>): ReactNode {
  const status = useContext(PermissionCardContext);
  if (status !== 'pending') return null;
  return <CardFooter className={cn('justify-end gap-2', className)} {...props} />;
}

/** The persisted outcome, a CardFooter shown once the request is `approved` or `denied`. */
function PermissionCardResolved({ className, ...props }: ComponentProps<typeof CardFooter>): ReactNode {
  const status = useContext(PermissionCardContext);
  if (status === 'pending') return null;
  return <CardFooter className={cn('gap-2', className)} {...props} />;
}

export { PermissionCard, PermissionCardTitle, PermissionCardStatus, PermissionCardActions, PermissionCardResolved };
export type { PermissionCardStatusValue, PermissionCardProps };
