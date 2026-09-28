import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  ToolCallCard,
  ToolCallCardContent,
  ToolCallCardHeader,
  ToolCallCardInput,
  ToolCallCardOutput,
  type ToolCallCardState,
} from './tool-call-card';

beforeAll(() => {
  // ToolCallCardInput/ToolCallCardOutput render CodeBlock, which measures via a ResizeObserver
  // and queries Element.getAnimations — both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

// ToolCallCardHeader renders a Base UI Collapsible Trigger, which needs its Root — so
// every header case is wrapped in <ToolCallCard> (the Collapsible Root).
describe('ToolCallCardHeader', () => {
  it('prefers title, then toolName, then a derived type', () => {
    const { rerender } = render(
      <ToolCallCard>
        <ToolCallCardHeader state="input-available" title="Search" />
      </ToolCallCard>,
    );
    expect(screen.getByText('Search')).toBeTruthy();

    rerender(
      <ToolCallCard>
        <ToolCallCardHeader state="input-available" toolName="lookup" />
      </ToolCallCard>,
    );
    expect(screen.getByText('lookup')).toBeTruthy();

    rerender(
      <ToolCallCard>
        <ToolCallCardHeader state="input-available" type="tool-fetch-page" />
      </ToolCallCard>,
    );
    expect(screen.getByText('fetch-page')).toBeTruthy();
  });

  it.each<[ToolCallCardState, string]>([
    ['input-streaming', 'Pending'],
    ['input-available', 'Running'],
    ['output-available', 'Completed'],
    ['output-error', 'Error'],
  ])('renders the %s status badge as %s', (state, label) => {
    render(
      <ToolCallCard>
        <ToolCallCardHeader state={state} title="x" />
      </ToolCallCard>,
    );
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('shows the subtitle when given', () => {
    render(
      <ToolCallCard>
        <ToolCallCardHeader state="input-available" title="x" subtitle="3 results" />
      </ToolCallCard>,
    );
    expect(screen.getByText('3 results')).toBeTruthy();
  });

  it('overrides the status word via statusLabel', () => {
    render(
      <ToolCallCard>
        <ToolCallCardHeader state="input-available" title="x" statusLabel="En cours" />
      </ToolCallCard>,
    );
    expect(screen.getByText('En cours')).toBeTruthy();
    expect(screen.queryByText('Running')).toBeNull();
  });

  it('overrides the unresolved-name fallback via fallbackLabel', () => {
    render(
      <ToolCallCard>
        <ToolCallCardHeader state="input-available" fallbackLabel="action" />
      </ToolCallCard>,
    );
    expect(screen.getByText('action')).toBeTruthy();
    expect(screen.queryByText('tool')).toBeNull();
  });
});

describe('ToolCallCardInput / ToolCallCardOutput', () => {
  it('serializes the input as JSON', () => {
    render(<ToolCallCardInput input={{ q: 'hi' }} />);
    expect(screen.getByText(/"q": "hi"/)).toBeTruthy();
    expect(screen.getByText('Parameters')).toBeTruthy();
  });

  it('renders an error block when errorText is set', () => {
    render(<ToolCallCardOutput output={undefined} errorText="boom" />);
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('renders a string output as a result block', () => {
    render(<ToolCallCardOutput output="done" />);
    expect(screen.getByText('Result')).toBeTruthy();
    expect(screen.getByText('done')).toBeTruthy();
  });

  it('renders nothing when there is no output and no error', () => {
    const { container } = render(<ToolCallCardOutput output={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('overrides the section headings', () => {
    const { rerender } = render(<ToolCallCardInput input={{ q: 'hi' }} label="Args" />);
    expect(screen.getByText('Args')).toBeTruthy();
    expect(screen.queryByText('Parameters')).toBeNull();

    rerender(<ToolCallCardOutput output="done" resultLabel="Output" />);
    expect(screen.getByText('Output')).toBeTruthy();
    expect(screen.queryByText('Result')).toBeNull();

    rerender(<ToolCallCardOutput output={undefined} errorText="boom" errorLabel="Failure" />);
    expect(screen.getByText('Failure')).toBeTruthy();
    expect(screen.queryByText('Error')).toBeNull();
  });
});

describe('ToolCallCard composition', () => {
  it('composes header + content', () => {
    render(
      <ToolCallCard defaultOpen>
        <ToolCallCardHeader state="output-available" title="search" />
        <ToolCallCardContent>
          <ToolCallCardInput input={{ a: 1 }} />
        </ToolCallCardContent>
      </ToolCallCard>,
    );
    expect(screen.getByText('search')).toBeTruthy();
    expect(screen.getByText('Parameters')).toBeTruthy();
  });
});
