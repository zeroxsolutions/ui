import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '../layout/collapsible-card';
import {
  CodeCard,
  CodeCardActions,
  CodeCardCode,
  CodeCardContent,
  CodeCardCopy,
  CodeCardLanguage,
  CodeCardLineNumbers,
  type CodeCardProps,
} from './code-card';

/** A block whose content is the code alone, with `children` composed before it. */
function Block({ children, ...props }: Omit<CodeCardProps, 'children'> & { children?: ReactNode }): ReactNode {
  return (
    <CodeCard {...props}>
      {children}
      <CodeCardContent>
        <CodeCardCode />
      </CodeCardContent>
    </CodeCard>
  );
}

/** The `<code>` that reads `text`. */
function codeOf(text: string): HTMLElement {
  const code = [...document.querySelectorAll('code')].find((element) => element.textContent === text);
  if (!code) throw new Error(`no code reads ${text}`);
  return code;
}

/** Whether the `<code>` reading `text` is painted in coloured tokens. */
const painted = (text: string) => (): boolean => codeOf(text).querySelector('span[style*="color"]') !== null;

describe('CodeCard', () => {
  it('renders the code string', async () => {
    await render(<Block code={'{ "a": 1 }'} />);
    await expect.element(page.getByText('{ "a": 1 }', { exact: true })).toBeVisible();
  });

  it('renders only what is composed: no header and no copy of its own', async () => {
    await render(<Block code="const x = 1" language="ts" />);
    await expect.element(page.getByText('const x = 1')).toBeVisible();
    await expect.element(page.getByText('TypeScript')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });

  it('shows a composed header above the code', async () => {
    await render(
      <Block code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <CodeCardLanguage />
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeCardCopy />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      </Block>,
    );
    await expect.element(page.getByText('TypeScript')).toBeVisible();
    expect(page.getByRole('button', { name: 'Copy code' }).all()).toHaveLength(1);
  });

  it('collapses the code from a composed trigger', async () => {
    await render(
      <Block code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTrigger />
        </CollapsibleCardHeader>
      </Block>,
    );
    await expect.element(page.getByText('const x = 1')).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Toggle content' }));
    await expect.element(page.getByText('const x = 1')).not.toBeInTheDocument();
  });

  it('copies the root code from CodeCardCopy', async () => {
    await render(
      <Block code="payload" language="json">
        <CodeCardCopy label="Copy payload" />
      </Block>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Copy payload' }));

    await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe('payload');
  });

  it('copies the code from a floating action and flips the label to Copied', async () => {
    await render(
      <Block code="floating payload">
        <CodeCardActions>
          <CodeCardCopy variant="secondary" />
        </CodeCardActions>
      </Block>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Copy code' }));

    await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe('floating payload');
  });

  describe('where the browser offers no clipboard', () => {
    const clipboard = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard');

    afterEach(() => {
      if (clipboard) Object.defineProperty(Navigator.prototype, 'clipboard', clipboard);
    });

    it('keeps its copy label', async () => {
      Object.defineProperty(Navigator.prototype, 'clipboard', { configurable: true, get: () => undefined });
      await render(
        <Block code="payload">
          <CodeCardCopy />
        </Block>,
      );
      await userEvent.click(page.getByRole('button', { name: 'Copy code' }));
      await expect.element(page.getByRole('button', { name: 'Copy code' })).toBeVisible();
    });
  });

  it('labels a plain block as plain text', async () => {
    await render(
      <Block code="hello">
        <CodeCardLanguage />
      </Block>,
    );
    await expect.element(page.getByText('Plain text')).toBeVisible();
  });

  it('paints the code in coloured tokens once the highlighter answers', async () => {
    await render(<Block code="const highlighted = 1" language="ts" />);

    await expect.poll(painted('const highlighted = 1')).toBe(true);
  });

  it('paints lines it is given, and highlights nothing itself', async () => {
    await render(
      <>
        <Block
          code="const given = 1"
          language="ts"
          lines={[[{ content: 'const given = 1', style: { color: 'rgb(4, 5, 6)' } }]]}
        />
        <Block code="const other = 1" language="ts" />
      </>,
    );
    // The second block is highlighted with the same grammar, so the first would be painted by now too.
    await expect.poll(painted('const other = 1')).toBe(true);

    const spans = [...codeOf('const given = 1').querySelectorAll('span')];
    expect(spans.map((span) => [span.textContent, span.style.color])).toEqual([['const given = 1', 'rgb(4, 5, 6)']]);
  });

  it('shows the code plain when handed null lines', async () => {
    await render(
      <>
        <Block code="const plain = 1" language="ts" lines={null} />
        <Block code="const other = 1" language="ts" />
      </>,
    );
    await expect.poll(painted('const other = 1')).toBe(true);

    expect(codeOf('const plain = 1').querySelector('span')).toBeNull();
  });

  it('numbers each line in a gutter hidden from assistive technology, apart from the code', async () => {
    await render(
      <CodeCard code={'a\nb\nc'}>
        <CodeCardContent>
          <CodeCardLineNumbers />
          <CodeCardCode />
        </CodeCardContent>
      </CodeCard>,
    );

    const pre = codeOf('a\nb\nc').closest('pre');
    expect(pre?.querySelector(':scope > [aria-hidden="true"]')?.textContent).toBe('1\n2\n3');
  });

  it('draws no gutter unless one is composed', async () => {
    await render(<Block code={'a\nb'} />);

    expect(codeOf('a\nb').closest('pre')?.textContent).toBe('a\nb');
  });

  it('throws when a part sits outside a CodeCard', async () => {
    await expect(render(<CodeCardCode />)).rejects.toThrow(/inside a CodeCard/);
  });
});
