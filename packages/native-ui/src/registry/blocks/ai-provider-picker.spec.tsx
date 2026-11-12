import { render, screen, userEvent } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker } from './ai-provider-picker';

const WEB_SOURCE = readFileSync(
  require.resolve('@zeroxsolutions/ui/registry/bases/base-ui/blocks/ai-provider-picker.tsx'),
  'utf8',
);

/**
 * The web block's own sample, cut from its source and run: the web file loads the DOM brand marks and the web's
 * own components, which do not load under React Native's Jest.
 */
const webSample = ((): unknown => {
  const start = WEB_SOURCE.indexOf('const AI_PROVIDER_PICKER_SAMPLE_ENTRIES');
  const end = WEB_SOURCE.indexOf('\n];\n', start);
  if (start < 0 || end < 0) throw new Error('AI_PROVIDER_PICKER_SAMPLE_ENTRIES is not in the web source');
  const source = `${WEB_SOURCE.slice(start, end + 4)}\nmodule.exports = AI_PROVIDER_PICKER_SAMPLE_ENTRIES;`;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: undefined as unknown };
  new Function('module', outputText)(module);
  return module.exports;
})();

const ENTRIES = [
  { provider: 'openai', name: 'OpenAI', description: 'Chat models.', meta: '12 models' },
  { provider: 'claude', name: 'Anthropic Claude', description: 'Long-context models.' },
];

describe('AiProviderPicker', () => {
  it('shows one card per entry, titled by its name, with its description', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getAllByRole('heading').map((heading) => heading.props.children)).toEqual([
      'OpenAI',
      'Anthropic Claude',
    ]);
    expect(screen.getByText('Chat models.')).toBeOnTheScreen();
    expect(screen.getByText('Long-context models.')).toBeOnTheScreen();
  });

  it('offers every card as a button named Select and the entry name, with or without onSelect', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getByRole('button', { name: 'Select OpenAI' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Select Anthropic Claude' })).toBeOnTheScreen();
  });

  it('calls onSelect with the provider key of the card pressed', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    await render(<AiProviderPicker entries={ENTRIES} onSelect={onSelect} />);

    await user.press(screen.getByRole('button', { name: 'Select Anthropic Claude' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('claude');
  });

  it('shows the note only of an entry that has one', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getByText('12 models')).toBeOnTheScreen();
    expect(screen.queryAllByText(/models$/)).toHaveLength(1);
  });

  it('shows the sample entries when given none', async () => {
    await render(<AiProviderPicker />);

    for (const entry of AI_PROVIDER_PICKER_SAMPLE_ENTRIES) {
      expect(screen.getByRole('button', { name: `Select ${entry.name}` })).toBeOnTheScreen();
    }
  });

  it("samples the web block's entries", () => {
    expect(AI_PROVIDER_PICKER_SAMPLE_ENTRIES).toEqual(webSample);
  });
});
