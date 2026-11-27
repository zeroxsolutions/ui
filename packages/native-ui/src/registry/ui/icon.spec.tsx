import { render, screen } from '@testing-library/react-native';
import { execFileSync } from 'node:child_process';
import { Check } from 'lucide-react-native';
import { createRef } from 'react';
import type { IconHandle } from '../lib/icon-motion';
import { CopyIcon } from '../icons/lucide/copy-icon';
import { injectData } from 'react-native-css-interop/dist/runtime/native/styles';
import { Icon, IconClassContext } from './icon';

/**
 * `css` as NativeWind's runtime reads it, compiled in a node process of its own. Compiling loads lightningcss's
 * native addon, which leaves a handle open in the jest worker that loads it, so the worker never exits cleanly.
 */
function compiledCSS(css: string): Parameters<typeof injectData>[0] {
  const compile = `process.stdout.write(JSON.stringify(require('react-native-css-interop/dist/css-to-rn').cssToReactNativeRuntime(${JSON.stringify(css)})))`;
  return JSON.parse(execFileSync(process.execPath, ['-e', compile], { cwd: __dirname, encoding: 'utf8' }));
}

/**
 * The size and stroke the glyph named `name` is drawn with. Read off its props rather than matched against them
 * whole, because a failed match prints the props, and theirs are too large to print.
 */
function drawn(name: string): { width: unknown; height: unknown; stroke: unknown } {
  const { width, height, stroke } = screen.getByRole('img', { name }).props;
  return { width, height, stroke };
}

const CLASSES = compiledCSS(
  '.text-red-500 { color: #ef4444; } .size-4 { width: 16px; height: 16px; } .size-5 { width: 20px; height: 20px; }',
);

describe('Icon', () => {
  beforeEach(() => {
    injectData(CLASSES);
  });

  it('hands its ref to the glyph it draws', async () => {
    const ref = createRef<IconHandle>();
    await render(<Icon as={CopyIcon} ref={ref} className="size-4" />);

    expect(ref.current?.startAnimation).toEqual(expect.any(Function));
    expect(ref.current?.stopAnimation).toEqual(expect.any(Function));
  });

  it('renders the lucide icon it is given', async () => {
    await render(<Icon as={Check} accessible role="img" aria-label="Saved" />);

    expect(screen.getByRole('img', { name: 'Saved' })).toBeOnTheScreen();
  });

  it('draws the glyph in the colour and size its classes name', async () => {
    await render(<Icon as={Check} className="size-4 text-red-500" accessible role="img" aria-label="Saved" />);

    expect(drawn('Saved')).toEqual({ width: 16, height: 16, stroke: '#ef4444' });
  });

  it('takes an explicit size and colour over its classes', async () => {
    await render(
      <Icon
        as={Check}
        className="size-4 text-red-500"
        size={24}
        color="#000000"
        accessible
        role="img"
        aria-label="Saved"
      />,
    );

    expect(drawn('Saved')).toEqual({ width: 24, height: 24, stroke: '#000000' });
  });

  it('takes the size its container gives an icon', async () => {
    await render(
      <IconClassContext.Provider value="size-4">
        <Icon as={Check} accessible role="img" aria-label="Saved" />
      </IconClassContext.Provider>,
    );

    expect(drawn('Saved')).toEqual(expect.objectContaining({ width: 16, height: 16 }));
  });

  it("keeps its own size class over its container's size", async () => {
    await render(
      <IconClassContext.Provider value="size-4">
        <Icon as={Check} className="size-5" accessible role="img" aria-label="Saved" />
      </IconClassContext.Provider>,
    );

    expect(drawn('Saved')).toEqual(expect.objectContaining({ width: 20, height: 20 }));
  });

  it("keeps an explicit size over its container's size", async () => {
    await render(
      <IconClassContext.Provider value="size-4">
        <Icon as={Check} size={24} accessible role="img" aria-label="Saved" />
      </IconClassContext.Provider>,
    );

    expect(drawn('Saved')).toEqual(expect.objectContaining({ width: 24, height: 24 }));
  });
});
