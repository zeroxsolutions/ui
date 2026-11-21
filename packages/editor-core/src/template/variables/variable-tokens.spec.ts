// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sameVariableTokens, variableTokens } from './variable-tokens.js';

describe('variableTokens', () => {
  it('reads every placeholder a string spells, once per occurrence and in order', () => {
    expect(variableTokens('Hi {{name}}, your code {{otp}} expires; {{otp}} again')).toEqual(['name', 'otp', 'otp']);
  });

  it('reads strings nested in arrays and objects, and nothing that is not a double-braced word', () => {
    expect(variableTokens({ label: 'Open', href: '{{verify_url}}', items: ['{name}', '{{ name }}', 7, null] })).toEqual(
      ['verify_url'],
    );
  });
});

describe('sameVariableTokens', () => {
  it('holds for the same placeholders in another order', () => {
    expect(sameVariableTokens('{{a}} then {{b}}', '{{b}} truoc {{a}}')).toBe(true);
  });

  it.each([
    ['a dropped placeholder', '{{otp}} expires', 'expires'],
    ['a doubled placeholder', '{{otp}} expires', '{{otp}} {{otp}} expires'],
    ['an invented placeholder', '{{otp}} expires', '{{otp}} expires {{name}}'],
  ])('refuses %s', (_case, source, translation) => {
    expect(sameVariableTokens(source, translation)).toBe(false);
  });
});
