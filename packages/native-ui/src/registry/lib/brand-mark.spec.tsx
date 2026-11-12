import { render, screen } from '@testing-library/react-native';
import { aiProviderMappings, resolveAiProviderMark } from '@zeroxsolutions/icons/ai-provider-mappings';
import {
  BRAND_MARKS,
  DEFAULT_BRAND_MARK_BASE,
  brandMarkChain,
  brandMarkUrlFor,
  type BrandMarkName,
  type BrandMarkVariant,
} from '@zeroxsolutions/icons/brand-mark-url';
import { AiProviderIcon, BrandMark, brandMarkSources } from './brand-mark';

/** The URLs the fake CDN answers with an error, as a missing or blocked file would. */
const mockUnreachable = new Set<string>();

/**
 * expo-image's Image over a fake network: it reports an error, after it mounts as a failed request does, for a URL
 * in {@link mockUnreachable}, and draws nothing.
 */
jest.mock('expo-image', () => {
  const React: typeof import('react') = jest.requireActual('react');
  const ReactNative: typeof import('react-native') = jest.requireActual('react-native');
  function Image({ source, onError }: { source: string; onError?: () => void }) {
    React.useEffect(() => {
      if (mockUnreachable.has(source)) onError?.();
    }, [source]);
    return React.createElement(ReactNative.View, { testID: 'brand-mark-image', accessibilityHint: source });
  }
  return { Image };
});

afterEach(() => mockUnreachable.clear());

const VARIANTS: readonly BrandMarkVariant[] = ['color', 'mono', 'avatar', 'combine'];

/** The URL the drawn mark's image requested, or `undefined` where no image is drawn. */
function drawnUrl(): string | undefined {
  return screen.queryByTestId('brand-mark-image', { includeHiddenElements: true })?.props.accessibilityHint;
}

describe('brandMarkSources', () => {
  it("tries every mark's variants at the package's URLs in the package's order, on any base", () => {
    const names = [...Object.keys(BRAND_MARKS), 'not-a-brand'] as BrandMarkName[];
    for (const base of [undefined, 'https://cdn.example.com/brands/']) {
      const cases = names.flatMap((name) => VARIANTS.map((variant) => [name, variant] as const));
      expect(cases.map(([name, variant]) => brandMarkSources(name, variant, base).map((source) => source.url))).toEqual(
        cases.map(([name, variant]) => brandMarkChain(name, variant).map((v) => brandMarkUrlFor(name, v, base))),
      );
    }
  });
});

describe('BrandMark', () => {
  it("draws its variant's file from the CDN", async () => {
    await render(<BrandMark name="openai" variant="avatar" />);

    expect(drawnUrl()).toBe(`${DEFAULT_BRAND_MARK_BASE}/avatar/openai.svg`);
  });

  it.each([
    [['combine'], 'color'],
    [['combine', 'color'], 'mono'],
  ] as const)('falls past the failing %j files to %s', async (failing, next) => {
    for (const variant of failing) mockUnreachable.add(`${DEFAULT_BRAND_MARK_BASE}/${variant}/claude.svg`);
    await render(<BrandMark name="claude" variant="combine" />);

    expect(drawnUrl()).toBe(`${DEFAULT_BRAND_MARK_BASE}/${next}/claude.svg`);
  });

  it('draws the first letter of the name once every file has failed', async () => {
    for (const variant of ['combine', 'color', 'mono']) {
      mockUnreachable.add(`${DEFAULT_BRAND_MARK_BASE}/${variant}/claude.svg`);
    }
    await render(<BrandMark name="claude" variant="combine" label="Claude" />);

    expect(drawnUrl()).toBeUndefined();
    expect(screen.getByRole('img', { name: 'Claude' })).toHaveTextContent('C');
  });

  it('draws the letter without a request for a name the manifest lacks', async () => {
    await render(<BrandMark name={'not-a-brand' as BrandMarkName} label="Not a brand" />);

    expect(drawnUrl()).toBeUndefined();
    expect(screen.getByRole('img', { name: 'Not a brand' })).toHaveTextContent('N');
  });

  it('is an image named by its label, and hidden from a screen reader without one', async () => {
    await render(<BrandMark name="openai" label="OpenAI" />);
    expect(screen.getByRole('img', { name: 'OpenAI' })).toBeOnTheScreen();

    await screen.rerender(<BrandMark name="openai" />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('AiProviderIcon', () => {
  const keys = aiProviderMappings.flatMap((mapping) => mapping.keywords);

  it.each([...keys, ...keys.map((key) => key.toUpperCase())])(
    "draws the mark the package resolves %s to, in the type's first variant",
    async (key) => {
      const mark = resolveAiProviderMark(key);
      if (!mark) throw new Error(`the package resolves ${key} to no mark`);
      await render(<AiProviderIcon provider={key} type="avatar" />);

      expect(drawnUrl()).toBe(brandMarkUrlFor(mark, brandMarkChain(mark, 'avatar')[0] ?? 'avatar'));
    },
  );

  it('draws a placeholder, named by its label, for a key that resolves to no mark', async () => {
    await render(<AiProviderIcon provider="no-such-provider" label="Unknown provider" />);

    expect(drawnUrl()).toBeUndefined();
    expect(screen.getByRole('img', { name: 'Unknown provider' })).toBeOnTheScreen();
  });
});
