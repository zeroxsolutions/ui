import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { loadHighlighter } from './highlighter';

const nativeMatchAll = String.prototype.matchAll;

// The JavaScript engine React Native runs on leaves `groups` off each match matchAll yields, though
// exec keeps them. The highlighter is first loaded in this file after that is in place.
beforeAll(() => {
  String.prototype.matchAll = function (this: string, regexp: RegExp) {
    const matches = [...nativeMatchAll.call(this, regexp)].map((match) => Object.assign(match, { groups: undefined }));
    return matches[Symbol.iterator]() as ReturnType<typeof nativeMatchAll>;
  };
});

afterAll(() => {
  String.prototype.matchAll = nativeMatchAll;
});

describe('loadHighlighter where matchAll hands back no named groups', () => {
  it('still highlights a grammar built on recursive patterns', async () => {
    const highlighter = await loadHighlighter('bash');

    await render(<Text>{highlighter!.highlight('echo "$HOME" # note').lines[0]}</Text>);

    expect(screen.getByText('echo')).toHaveStyle({ color: '#005CC5' });
    expect(screen.getByText('# note')).toHaveStyle({ color: '#6A737D' });
  });

  it('leaves matchAll as it found it', async () => {
    const before = String.prototype.matchAll;

    (await loadHighlighter('python'))!.highlight('def f(): pass');

    expect(String.prototype.matchAll).toBe(before);
  });
});
