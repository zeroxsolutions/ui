'use client';

import { CheckCircle2, Wrench, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardHeader,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from '@/registry/bases/base-ui/components/feedback/permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import { CardDescription } from '@/registry/bases/base-ui/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

const STATUS_WORD = { pending: 'Pending', approved: 'Allowed', denied: 'Denied' } as const;
const SCOPE_WORD = { once: 'Allowed once', session: 'Allowed for this session' } as const;

/** A deploy-approval request the visitor can deny or allow, once or for the session. */
function PermissionCardDemo(): ReactNode {
  const [status, setStatus] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [scope, setScope] = useState<'once' | 'session'>('once');

  return (
    <PermissionCard status={status} className="w-full max-w-sm rounded-lg border p-4">
      <PermissionCardHeader>
        <Wrench className="text-muted-foreground size-3.5" />
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        <PermissionCardStatus>{STATUS_WORD[status]}</PermissionCardStatus>
      </PermissionCardHeader>
      <CardDescription>Deploy the web app to production</CardDescription>
      <PermissionCardActions>
        <Button variant="ghost" onClick={() => setStatus('denied')}>
          Deny
        </Button>
        <ButtonGroup>
          <Button
            onClick={() => {
              setScope('once');
              setStatus('approved');
            }}
          >
            Allow once
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon" aria-label="More allow options" />} />
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem
                onClick={() => {
                  setScope('session');
                  setStatus('approved');
                }}
              >
                Allow this session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </PermissionCardActions>
      {status === 'approved' && (
        <PermissionCardResolved>
          <CheckCircle2 className="size-3.5" /> {SCOPE_WORD[scope]} - 2:14pm
        </PermissionCardResolved>
      )}
      {status === 'denied' && (
        <PermissionCardResolved>
          <XCircle className="size-3.5" /> Denied - 2:14pm
        </PermissionCardResolved>
      )}
    </PermissionCard>
  );
}

export { PermissionCardDemo };
