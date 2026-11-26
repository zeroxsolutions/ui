import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { CodeMirrorPane } from './code-mirror-pane';
import { surfaceUnder } from './surface-under';

const LONG_LINE = `export const greeting = '${'hello '.repeat(80)}'`;

describe('CodeMirrorPane in a browser', () => {
  let screen: Awaited<ReturnType<typeof render>> | null = null;
  afterEach(() => {
    screen?.unmount();
    screen = null;
  });

  it("keeps a long line's number in view once the caret has carried the line sideways", async () => {
    screen = await render(
      <div style={{ width: 320, height: 160 }}>
        <CodeMirrorPane value={`${LONG_LINE}\nshort`} language="typescript" />
      </div>,
    );
    const pane = page.getByTestId('code-mirror-pane').element();
    const scroller = pane.querySelector<HTMLElement>('.cm-scroller')!;
    await userEvent.click(page.getByRole('textbox'));
    await userEvent.keyboard('{End}');
    await expect.poll(() => scroller.scrollLeft).toBeGreaterThan(0);

    const number = [...pane.querySelectorAll<HTMLElement>('.cm-lineNumbers .cm-gutterElement')].find(
      (element) => element.textContent === '1',
    )!;
    const paneBox = pane.getBoundingClientRect();
    const numberBox = number.getBoundingClientRect();
    expect(numberBox.left).toBeGreaterThanOrEqual(paneBox.left);
    expect(numberBox.right).toBeLessThanOrEqual(paneBox.left + paneBox.width / 2);
  });
});

describe('CodeMirrorPane', () => {
  let screen: Awaited<ReturnType<typeof render>> | null = null;
  afterEach(() => {
    screen?.unmount();
    screen = null;
  });
  const text = page.getByRole('textbox');

  it('shows the text it is given, and the text the host gives it next', async () => {
    screen = await render(<CodeMirrorPane value="first" language="typescript" />);
    await expect.element(text).toHaveTextContent('first');

    await screen.rerender(<CodeMirrorPane value="second" language="typescript" />);

    await expect.element(text).toHaveTextContent('second');
    await expect.element(text).not.toHaveTextContent('first');
  });

  it('takes no typing while read-only', async () => {
    const reported: string[] = [];
    screen = await render(
      <CodeMirrorPane value="x" language="python" readOnly onValueChange={(value) => reported.push(value)} />,
    );
    await userEvent.click(text);

    await userEvent.keyboard('abc');

    await expect.element(text).toHaveTextContent(/^x$/);
    expect(reported).toEqual([]);
  });

  it('numbers its lines, and stops once the host turns the numbers off', async () => {
    const pane = (showLineNumbers: boolean) => (
      <CodeMirrorPane value={'a\nb'} language="typescript" showLineNumbers={showLineNumbers} />
    );
    screen = await render(pane(true));
    const second = page.getByTestId('code-mirror-pane').getByText('2', { exact: true });
    await expect.element(second).toBeVisible();

    await screen.rerender(pane(false));
    await expect.element(second).not.toBeInTheDocument();

    await screen.rerender(pane(true));
    await expect.element(second).toBeVisible();
  });

  it('indents with a tab character when the host asks for tabs', async () => {
    const reported: string[] = [];
    screen = await render(
      <CodeMirrorPane
        value=""
        language="typescript"
        tabSize={8}
        useTabs
        onValueChange={(value) => reported.push(value)}
      />,
    );
    await userEvent.click(text);

    await userEvent.keyboard('{Tab}');

    await vi.waitFor(() => expect(reported.at(-1)).toBe('\t'));
  });
});

describe('surfaceUnder', () => {
  let host: HTMLElement | null = null;
  afterEach(() => {
    host?.remove();
    host = null;
  });

  /** A target under the given backgrounds, outermost first. */
  function under(...backgrounds: string[]): HTMLElement {
    host = document.createElement('div');
    let parent = host;
    parent.style.backgroundColor = backgrounds[0];
    for (const background of backgrounds.slice(1)) {
      const child = document.createElement('div');
      child.style.backgroundColor = background;
      parent.append(child);
      parent = child;
    }
    const target = document.createElement('div');
    parent.append(target);
    document.body.append(host);
    return target;
  }

  it('lays a translucent surface over the opaque one beneath it', () => {
    expect(surfaceUnder(under('rgb(10, 20, 30)', 'rgba(255, 255, 255, 0.5)'))).toBe('rgb(133, 138, 143)');
  });

  it('stops at the nearest opaque surface', () => {
    expect(surfaceUnder(under('rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'transparent'))).toBe('rgb(0, 0, 255)');
  });

  it('reads a colour written in a form other than rgb', () => {
    expect(surfaceUnder(under('oklch(0% 0 0)'))).toBe('rgb(0, 0, 0)');
  });
});
