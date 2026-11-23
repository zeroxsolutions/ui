import { describe, expect, it } from 'vitest';
import type { VariableType } from '../variables/variable-type.js';
import { hrefProblems } from './href.js';

const TYPES: Record<string, VariableType> = { name: 'string', link: 'url' };
const typeOf = (name: string): VariableType | undefined => TYPES[name];

describe('hrefProblems', () => {
  it.each([
    ['a fixed url with an inner token', 'https://x.test/?n={{name}}', []],
    ['a leading url token', '{{link}}/a', []],
    ['a leading token that is not a url', '{{name}}', [{ kind: 'href-invalid' }]],
    ['no scheme', 'x.test', [{ kind: 'href-invalid' }]],
    ['an undeclared inner token', 'https://x.test/?t={{x}}&u={{x}}', [{ kind: 'variable-undeclared', name: 'x' }]],
    [
      'an undeclared inner token after a bad start',
      'x.test/?t={{x}}',
      [{ kind: 'variable-undeclared', name: 'x' }, { kind: 'href-invalid' }],
    ],
    [
      'an undeclared leading token, judged by that token alone',
      '{{x}}/a',
      [{ kind: 'variable-undeclared', name: 'x' }],
    ],
  ])('reports %s', (_case, href, problems) => {
    expect(hrefProblems(href, typeOf)).toEqual(problems);
  });
});
