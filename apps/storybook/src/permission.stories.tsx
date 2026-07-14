import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { ClaudeMark } from '@zeroxsolutions/icons/brands/claude';
import { GithubMark } from '@zeroxsolutions/icons/brands/github-mark';
import { LinearMark } from '@zeroxsolutions/icons/brands/linear';
import { McpMark } from '@zeroxsolutions/icons/brands/mcp';
import { NotionMark } from '@zeroxsolutions/icons/brands/notion';
import { SlackMark } from '@zeroxsolutions/icons/brands/slack';
import { ChatMessageShell } from '@zeroxsolutions/ui/components/chat/chat-message-shell';
import { CodeBlock } from '@zeroxsolutions/ui/components/code-block';
import {
  Permission,
  PermissionActions,
  PermissionDescription,
  PermissionHeader,
  PermissionPreview,
  PermissionResolved,
  PermissionTitle,
  type PermissionStatusValue,
} from '@zeroxsolutions/ui/components/permission';
import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '@zeroxsolutions/ui/components/split-button';
import { Button } from '@zeroxsolutions/ui/components/ui/button';

/**
 * `Permission` is an inline, non-modal AI-consent card that renders inside an
 * assistant message: the moment Claude wants to call an MCP tool it can't run
 * unattended, it drops this card into its message so the request stays in
 * scrollback next to the prose that explains it.
 *
 * These stories show the card in its real chat context: a user turn, then a
 * `Claude` assistant turn (identity row with the Claude mark, plus an intro
 * line) whose body holds the card. The card is borderless, so it flows in the
 * message set off only by spacing and the preview's own frame, and its leading
 * glyph is the calling MCP server's own brand mark (GitHub, Linear, Slack,
 * Notion, the generic MCP mark) so a reader sees at a glance which server is
 * asking. The header title is the tool's raw id (`create_issue`) - what actually
 * gets called - not a humanized label. The host owns `status`: a decision row
 * while `pending`, a persisted outcome once `approved` / `denied`. The presence
 * of the decision buttons is the "needs approval" signal, so there is no
 * separate status pill.
 */
const meta: Meta<typeof Permission> = {
  title: 'Components/Permission',
  component: Permission,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Permission>;

/** Claude's identity for the assistant message row: the real Claude mark + name. */
const CLAUDE = { name: 'Claude', icon: ClaudeMark.Color } as const;

/** One MCP tool-call request. `scopes` omitted means a single-scope plain `Allow`. */
interface ToolRequest {
  /** The server's brand mark, sized for the header (already colour/size-set). */
  logo: ReactNode;
  /** The tool being called by its raw id, e.g. `create_issue`. */
  tool: string;
  /** Muted one-line summary; leads with the server name. */
  summary: ReactNode;
  /** The exact call arguments, shown in the preview `CodeBlock`. */
  params: unknown;
  /** Riskier grant scopes on the `Allow` menu; omit for a single-scope request. */
  scopes?: string[];
  /** What the approved outcome reads once granted. */
  grantedLabel: string;
}

const GITHUB: ToolRequest = {
  logo: <GithubMark className="size-4 text-foreground" />,
  tool: 'create_issue',
  summary: 'GitHub: open an issue in zeroxsolutions/ui-sdk',
  params: {
    repo: 'zeroxsolutions/ui-sdk',
    title: 'Flaky deploy test, retries on cold start',
    labels: ['bug', 'ci'],
  },
  scopes: ['Allow this session', 'Always allow GitHub'],
  grantedLabel: 'Allowed once',
};

const LINEAR: ToolRequest = {
  logo: <LinearMark.Color className="size-4" />,
  tool: 'create_issue',
  summary: 'Linear: file an issue on the Platform team',
  params: {
    team: 'Platform',
    title: 'Flaky deploy test',
    priority: 'High',
    labels: ['ci', 'flaky'],
  },
  scopes: ['Allow this session', 'Always allow Linear'],
  grantedLabel: 'Allowed once',
};

const SLACK: ToolRequest = {
  logo: <SlackMark.Color className="size-4" />,
  tool: 'post_message',
  summary: 'Slack: post to #eng-ci',
  params: {
    channel: '#eng-ci',
    text: 'Tracking the flaky deploy test in LIN-482.',
  },
  scopes: ['Allow this session', 'Always allow Slack'],
  grantedLabel: 'Allowed once',
};

const NOTION: ToolRequest = {
  logo: <NotionMark.Color className="size-4" />,
  tool: 'create_page',
  summary: 'Notion: add a page under Engineering / Incidents',
  params: {
    parent: 'Engineering / Incidents',
    title: 'Flaky deploy test',
    status: 'Investigating',
  },
  scopes: ['Allow this session', 'Always allow Notion'],
  grantedLabel: 'Allowed once',
};

const FETCH: ToolRequest = {
  // Lobehub mark: font-relative `size`, so the wrapper's text-size drives it.
  logo: (
    <span className="text-base text-foreground">
      <McpMark size="1em" />
    </span>
  ),
  tool: 'fetch',
  summary: 'MCP: read one public page',
  params: { url: 'https://modelcontextprotocol.io/llms.txt' },
  grantedLabel: 'Allowed',
};

/** The permission card for a request, wired for a status. */
function RequestCard({
  request,
  status,
}: {
  request: ToolRequest;
  status: PermissionStatusValue;
}) {
  return (
    <Permission status={status}>
      <PermissionHeader>
        {request.logo}
        <PermissionTitle>{request.tool}</PermissionTitle>
      </PermissionHeader>
      <PermissionDescription>{request.summary}</PermissionDescription>
      <PermissionPreview>
        <CodeBlock
          code={JSON.stringify(request.params, null, 2)}
          language="json"
        />
      </PermissionPreview>

      <PermissionActions>
        <Button size="sm" variant="ghost" onClick={() => {}}>
          Deny
        </Button>
        {request.scopes ? (
          <SplitButton>
            <SplitButtonAction size="sm" onClick={() => {}}>
              Allow once
            </SplitButtonAction>
            <SplitButtonMenu>
              <SplitButtonTrigger
                size="icon-sm"
                aria-label="More allow options"
              />
              <SplitButtonContent>
                {request.scopes.map((scope) => (
                  <SplitButtonItem key={scope} onClick={() => {}}>
                    {scope}
                  </SplitButtonItem>
                ))}
              </SplitButtonContent>
            </SplitButtonMenu>
          </SplitButton>
        ) : (
          <Button size="sm" onClick={() => {}}>
            Allow
          </Button>
        )}
      </PermissionActions>

      <PermissionResolved>
        {status === 'denied' ? (
          <>
            <XCircle className="size-3.5 text-destructive" /> Denied at 2:14pm
          </>
        ) : (
          <>
            <CheckCircle2 className="size-3.5 text-success" />{' '}
            {request.grantedLabel} at 2:14pm
          </>
        )}
      </PermissionResolved>
    </Permission>
  );
}

/** A padded, centered chat column - the frame every story renders inside. */
function ChatColumn({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-6">{children}</div>
  );
}

/** The whole exchange: a user turn, then Claude's turn holding one card. */
function Conversation({
  request,
  status,
  ask,
  intro,
}: {
  request: ToolRequest;
  status: PermissionStatusValue;
  ask: ReactNode;
  intro: ReactNode;
}) {
  return (
    <ChatColumn>
      <ChatMessageShell role="user">{ask}</ChatMessageShell>
      <ChatMessageShell role="assistant" agent={CLAUDE} showAgentLabel>
        <p className="leading-relaxed">{intro}</p>
        <RequestCard request={request} status={status} />
      </ChatMessageShell>
    </ChatColumn>
  );
}

const GITHUB_ASK = 'Open a GitHub issue to track the flaky deploy test.';
const GITHUB_INTRO =
  "I'll file that in your repo through the GitHub MCP server. Approve the call below and I'll continue.";

/**
 * Awaiting a decision: the GitHub MCP server is asking to open an issue. The
 * card sits in Claude's message, right under the line that explains the call;
 * the decision row is live (plain `Deny`, graduated-scope `Allow`).
 */
export const Pending: Story = {
  render: () => (
    <Conversation
      request={GITHUB}
      status="pending"
      ask={GITHUB_ASK}
      intro={GITHUB_INTRO}
    />
  ),
};

/** Granted: the card collapses to a persisted, non-interactive outcome. */
export const Approved: Story = {
  render: () => (
    <Conversation
      request={GITHUB}
      status="approved"
      ask={GITHUB_ASK}
      intro={GITHUB_INTRO}
    />
  ),
};

/** Rejected: the persisted denied outcome; the conversation continues below. */
export const Denied: Story = {
  render: () => (
    <Conversation
      request={GITHUB}
      status="denied"
      ask={GITHUB_ASK}
      intro={GITHUB_INTRO}
    />
  ),
};

/**
 * A single-scope request: a read-only fetch offers just one grant, so `Allow`
 * is a plain `Button` with no caret (no menu of riskier scopes to graduate).
 */
export const SingleScope: Story = {
  render: () => (
    <Conversation
      request={FETCH}
      status="pending"
      ask="What does the MCP spec say about capability negotiation?"
      intro="Let me pull the spec index first. This is a read-only fetch: one grant, no scopes."
    />
  ),
};

/**
 * One agent turn, several MCP servers: Claude orchestrates a task across Linear,
 * Slack, and Notion, and asks for each call separately. The brand mark on each
 * card makes the source unmistakable, and every request keeps its own decision
 * row - the user can approve or deny each independently.
 */
export const AcrossServers: Story = {
  render: () => (
    <ChatColumn>
      <ChatMessageShell role="user">
        Set up tracking for the flaky deploy bug across our tools.
      </ChatMessageShell>
      <ChatMessageShell role="assistant" agent={CLAUDE} showAgentLabel>
        <p className="leading-relaxed">
          I'll wire that up across your tools: file it in Linear, ping the team
          in Slack, and log an incident page in Notion. Approve each call:
        </p>
        <RequestCard request={LINEAR} status="pending" />
        <RequestCard request={SLACK} status="pending" />
        <RequestCard request={NOTION} status="pending" />
      </ChatMessageShell>
    </ChatColumn>
  ),
};

/**
 * The same request under the design system's dark theme (the `.dark` class the
 * tokens key off). Brand marks keep their colour; the GitHub mono mark rides
 * `text-foreground`, so it flips to light on the dark surface.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-background text-foreground">
      <Conversation
        request={GITHUB}
        status="pending"
        ask={GITHUB_ASK}
        intro={GITHUB_INTRO}
      />
    </div>
  ),
};
