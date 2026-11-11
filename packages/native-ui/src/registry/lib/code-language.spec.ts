import {
  isPlainLanguage as isPlainLanguageOnTheWeb,
  languageLabel as languageLabelOnTheWeb,
} from '@zeroxsolutions/ui/registry/bases/base-ui/lib/code-language';
import { isPlainLanguage, languageLabel } from './code-language';

/** Fence ids in both cases, the plain-text names, and ids neither table lists. */
const LANGUAGES = [
  'ts',
  'TS',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'json',
  'jsonc',
  'py',
  'python',
  'rb',
  'go',
  'rs',
  'rust',
  'java',
  'kt',
  'c',
  'cpp',
  'c++',
  'cs',
  'csharp',
  'php',
  'swift',
  'lua',
  'sql',
  'sh',
  'bash',
  'zsh',
  'shell',
  'shellscript',
  'html',
  'xml',
  'css',
  'scss',
  'less',
  'yaml',
  'yml',
  'toml',
  'md',
  'mdx',
  'markdown',
  'diff',
  'dockerfile',
  'graphql',
  'Dockerfile',
  'text',
  'Text',
  'plaintext',
  'plain',
  'txt',
  '',
  'cobol',
  'brainfuck',
];

describe('code language', () => {
  it('labels each language as the web labels it', () => {
    expect(LANGUAGES.map(languageLabel)).toEqual(LANGUAGES.map(languageLabelOnTheWeb));
  });

  it('calls a language plain where the web does, an absent one included', () => {
    const languages = [...LANGUAGES, undefined];
    expect(languages.map(isPlainLanguage)).toEqual(languages.map(isPlainLanguageOnTheWeb));
  });
});
