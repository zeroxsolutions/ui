'use client';

import { useRef, useState, type ReactNode } from 'react';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from '@/registry/bases/base-ui/components/feedback/permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import { CardDescription, CardHeader } from '@/registry/bases/base-ui/ui/card';
import { ChevronDownIcon, type ChevronDownIconHandle } from '@/registry/bases/base-ui/icons/chevron-down-icon';
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
  const chevronRef = useRef<ChevronDownIconHandle>(null);

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
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon"
                  aria-label="More allow options"
                  onMouseEnter={() => chevronRef.current?.startAnimation()}
                  onMouseLeave={() => chevronRef.current?.stopAnimation()}
                  onFocus={() => chevronRef.current?.startAnimation()}
                  onBlur={() => chevronRef.current?.stopAnimation()}
                />
              }
            >
              <ChevronDownIcon ref={chevronRef} aria-hidden />
            </DropdownMenuTrigger>
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
      <PermissionCardResolved>
        <CardDescription>{status === 'approved' ? SCOPE_WORD[scope] : 'Denied'} - 2:14pm</CardDescription>
      </PermissionCardResolved>
    </PermissionCard>
  );
}

export { PermissionCardDemo };
