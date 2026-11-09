import { ChevronDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from '@/components/feedback/permission-card';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { CardDescription, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const STATUS_WORD = { pending: 'Pending', approved: 'Allowed', denied: 'Denied' } as const;
const SCOPE_WORD = { once: 'Allowed once', session: 'Allowed for this session' } as const;

/** A deploy-approval request the visitor can deny or allow, once or for the session. */
function PermissionCardDemo(): ReactNode {
  const [status, setStatus] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [scope, setScope] = useState<'once' | 'session'>('once');

  return (
    <PermissionCard status={status} className="w-full max-w-sm">
      <CardHeader>
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        <CardDescription>Deploy the web app to production</CardDescription>
        <PermissionCardStatus variant={status === 'denied' ? 'destructive' : 'outline'}>
          {STATUS_WORD[status]}
        </PermissionCardStatus>
      </CardHeader>
      <PermissionCardActions>
        <Button variant="ghost" onPress={() => setStatus('denied')}>
          <Text>Deny</Text>
        </Button>
        <ButtonGroup>
          <Button
            onPress={() => {
              setScope('once');
              setStatus('approved');
            }}
          >
            <Text>Allow once</Text>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" aria-label="More allow options">
                <Icon as={ChevronDown} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onPress={() => {
                  setScope('session');
                  setStatus('approved');
                }}
              >
                <Text>Allow this session</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </PermissionCardActions>
      <PermissionCardResolved>
        <CardDescription>{status === 'approved' ? SCOPE_WORD[scope] : 'Denied'} - 2:14pm</CardDescription>
      </PermissionCardResolved>
    </PermissionCard>
  );
}

export { PermissionCardDemo };
