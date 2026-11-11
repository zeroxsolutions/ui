import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import * as highlighter from '../../lib/highlighter';
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

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const setStringAsync = jest.mocked(Clipboard.setStringAsync);
const HIDDEN = { includeHiddenElements: true } as const;

/** GitHub light's keyword colour, which the highlighter paints `const` in. */
const KEYWORD = '#D73A49';

beforeEach(() => {
  setStringAsync.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

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

/** The header the web's demo and markdown-view compose: the language, a copy and the trigger. */
function Header(): ReactNode {
  return (
    <CollapsibleCardHeader>
      <CollapsibleCardTitle>
        <CodeCardLanguage />
      </CollapsibleCardTitle>
      <CollapsibleCardActions>
        <CodeCardCopy />
        <CollapsibleCardTrigger />
      </CollapsibleCardActions>
    </CollapsibleCardHeader>
  );
}

describe('CodeCard', () => {
  it('draws its code', async () => {
    await render(<Block code={'{ "a": 1 }'} />);

    expect(screen.getByText('{ "a": 1 }')).toBeOnTheScreen();
  });

  it('draws only what is composed: no language and no copy of its own', async () => {
    await render(<Block code="plain words" language="ts" />);

    expect(screen.getByText('plain words')).toBeOnTheScreen();
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a composed header with the language and one copy button named Copy code', async () => {
    await render(
      <Block code="const x = 1" language="ts">
        <Header />
      </Block>,
    );

    expect(screen.getByText('TypeScript')).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(1);
  });

  it('hides the code when the composed trigger is pressed', async () => {
    const user = userEvent.setup();
    await render(
      <Block code="plain words">
        <Header />
      </Block>,
    );

    expect(screen.getByText('plain words')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Toggle content' }));

    expect(screen.queryByText('plain words')).toBeNull();
  });

  it('copies the code and takes the name Copied', async () => {
    const user = userEvent.setup();
    await render(
      <Block code="payload" language="json">
        <CodeCardCopy label="Copy payload" />
      </Block>,
    );

    await user.press(screen.getByRole('button', { name: 'Copy payload' }));

    expect(setStringAsync).toHaveBeenCalledWith('payload');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();
  });

  it('copies the code from a floating action of a block with no header', async () => {
    const user = userEvent.setup();
    await render(
      <Block code="payload">
        <CodeCardActions>
          <CodeCardCopy variant="secondary" />
        </CodeCardActions>
      </Block>,
    );

    await user.press(screen.getByRole('button', { name: 'Copy code' }));

    expect(setStringAsync).toHaveBeenCalledWith('payload');
  });

  it('labels a block with no language as plain text, and an unlisted language by its id', async () => {
    await render(
      <>
        <Block code="hello">
          <CodeCardLanguage />
        </Block>
        <Block code="MOVE A TO B." language="cobol">
          <CodeCardLanguage />
        </Block>
      </>,
    );

    expect(screen.getByText('Plain text')).toBeOnTheScreen();
    expect(screen.getByText('cobol')).toBeOnTheScreen();
  });

  it('lets children replace the language name', async () => {
    await render(
      <Block code="x" language="ts">
        <CodeCardLanguage>index.ts</CodeCardLanguage>
      </Block>,
    );

    expect(screen.getByText('index.ts')).toBeOnTheScreen();
    expect(screen.queryByText('TypeScript')).toBeNull();
  });

  it('paints the tokens of a language the highlighter lists', async () => {
    await render(<Block code="const x = 1" language="ts" />);

    await waitFor(() => expect(screen.getByText('const')).toHaveStyle({ color: KEYWORD }));
  });

  it('draws the code of a language the highlighter does not list as plain text', async () => {
    await render(<Block code="MOVE A TO B." language="cobol" />);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('MOVE A TO B.')).toBeOnTheScreen();
  });

  it('paints the lines it is given, each token in its colour, and highlights nothing itself', async () => {
    const load = jest.spyOn(highlighter, 'loadHighlighter');
    await render(
      <Block
        code="const x"
        language="ts"
        lines={[[{ content: 'const', style: { color: 'rgb(4, 5, 6)' } }, { content: ' x' }]]}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('const')).toHaveStyle({ color: 'rgb(4, 5, 6)' });
    expect(screen.getByText('const x')).toBeOnTheScreen();
    expect(load).not.toHaveBeenCalledWith('ts');
  });

  it('draws the code plain when handed null lines, and highlights nothing itself', async () => {
    const load = jest.spyOn(highlighter, 'loadHighlighter');
    await render(<Block code="const x" language="ts" lines={null} />);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('const x')).toBeOnTheScreen();
    expect(load).not.toHaveBeenCalledWith('ts');
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

    expect(screen.getByText('1\n2\n3', HIDDEN)).toBeOnTheScreen();
    expect(screen.queryByText('1\n2\n3')).toBeNull();
    expect(screen.getByText('a')).toBeOnTheScreen();
    expect(screen.getByText('c')).toBeOnTheScreen();
  });

  it('draws no gutter unless one is composed', async () => {
    await render(<Block code={'a\nb'} />);

    expect(screen.queryByText('1\n2', HIDDEN)).toBeNull();
    expect(screen.getByText('b')).toBeOnTheScreen();
  });

  it('throws when a part sits outside a CodeCard', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<CodeCardCode />)).rejects.toThrow(/inside a CodeCard/);
  });
});
