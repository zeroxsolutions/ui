import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolState } from './tool';

beforeAll(() => {
  // ToolInput/ToolOutput render CodeBlock, which measures via a ResizeObserver
  // and queries Element.getAnimations — both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

// ToolHeader renders a Base UI Collapsible Trigger, which needs its Root — so
// every header case is wrapped in <Tool> (the Collapsible Root).
describe('ToolHeader', () => {
  it('prefers title, then toolName, then a derived type', () => {
    const { rerender } = render(
      <Tool>
        <ToolHeader state="input-available" title="Search" />
      </Tool>,
    );
    expect(screen.getByText('Search')).toBeTruthy();

    rerender(
      <Tool>
        <ToolHeader state="input-available" toolName="lookup" />
      </Tool>,
    );
    expect(screen.getByText('lookup')).toBeTruthy();

    rerender(
      <Tool>
        <ToolHeader state="input-available" type="tool-fetch-page" />
      </Tool>,
    );
    expect(screen.getByText('fetch-page')).toBeTruthy();
  });

  it.each<[ToolState, string]>([
    ['input-streaming', 'Pending'],
    ['input-available', 'Running'],
    ['output-available', 'Completed'],
    ['output-error', 'Error'],
  ])('renders the %s status badge as %s', (state, label) => {
    render(
      <Tool>
        <ToolHeader state={state} title="x" />
      </Tool>,
    );
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('shows the subtitle when given', () => {
    render(
      <Tool>
        <ToolHeader state="input-available" title="x" subtitle="3 results" />
      </Tool>,
    );
    expect(screen.getByText('3 results')).toBeTruthy();
  });

  it('overrides the status word via statusLabel', () => {
    render(
      <Tool>
        <ToolHeader state="input-available" title="x" statusLabel="En cours" />
      </Tool>,
    );
    expect(screen.getByText('En cours')).toBeTruthy();
    expect(screen.queryByText('Running')).toBeNull();
  });

  it('overrides the unresolved-name fallback via fallbackLabel', () => {
    render(
      <Tool>
        <ToolHeader state="input-available" fallbackLabel="action" />
      </Tool>,
    );
    expect(screen.getByText('action')).toBeTruthy();
    expect(screen.queryByText('tool')).toBeNull();
  });
});

describe('ToolInput / ToolOutput', () => {
  it('serializes the input as JSON', () => {
    render(<ToolInput input={{ q: 'hi' }} />);
    expect(screen.getByText(/"q": "hi"/)).toBeTruthy();
    expect(screen.getByText('Parameters')).toBeTruthy();
  });

  it('renders an error block when errorText is set', () => {
    render(<ToolOutput output={undefined} errorText="boom" />);
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('renders a string output as a result block', () => {
    render(<ToolOutput output="done" />);
    expect(screen.getByText('Result')).toBeTruthy();
    expect(screen.getByText('done')).toBeTruthy();
  });

  it('renders nothing when there is no output and no error', () => {
    const { container } = render(<ToolOutput output={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('overrides the section headings', () => {
    const { rerender } = render(<ToolInput input={{ q: 'hi' }} label="Args" />);
    expect(screen.getByText('Args')).toBeTruthy();
    expect(screen.queryByText('Parameters')).toBeNull();

    rerender(<ToolOutput output="done" resultLabel="Output" />);
    expect(screen.getByText('Output')).toBeTruthy();
    expect(screen.queryByText('Result')).toBeNull();

    rerender(<ToolOutput output={undefined} errorText="boom" errorLabel="Failure" />);
    expect(screen.getByText('Failure')).toBeTruthy();
    expect(screen.queryByText('Error')).toBeNull();
  });
});

describe('Tool composition', () => {
  it('composes header + content', () => {
    render(
      <Tool defaultOpen>
        <ToolHeader state="output-available" title="search" />
        <ToolContent>
          <ToolInput input={{ a: 1 }} />
        </ToolContent>
      </Tool>,
    );
    expect(screen.getByText('search')).toBeTruthy();
    expect(screen.getByText('Parameters')).toBeTruthy();
  });
});
