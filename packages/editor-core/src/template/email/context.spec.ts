// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { RenderedBlock, RenderProblem } from './block.js';
import { createRenderContext, type RenderState } from './context.js';
import { FIXTURE_THEME } from './fixtures.fixture.js';

function state(overrides: Partial<RenderState> = {}): RenderState {
  return {
    theme: FIXTURE_THEME,
    locale: 'en',
    variables: {},
    variableTypes: {},
    problems: [],
    region: 'body',
    ...overrides,
  };
}

const NO_LANES = (): RenderedBlock => ({ html: '', text: '' });

describe('createRenderContext', () => {
  it("escapes the template's own text on the html arm, so authored text is never markup", () => {
    const ctx = createRenderContext(state({ variables: { name: '<i>' } }), 'b1', NO_LANES);
    expect(ctx.html('a < b & {{name}}')).toBe('a &lt; b &amp; &lt;i&gt;');
  });

  it('prints authored markup as written through markup, escaping only its values', () => {
    const ctx = createRenderContext(state({ variables: { name: '<i>' } }), 'b1', NO_LANES);
    expect(ctx.markup('<p class="x">{{name}}</p>')).toBe('<p class="x">&lt;i&gt;</p>');
  });

  it('treats a token named after an Object member as unfilled rather than throwing', () => {
    const problems: RenderProblem[] = [];
    const ctx = createRenderContext(state({ problems }), 'b1', NO_LANES);
    expect(ctx.html('{{constructor}}{{__proto__}}')).toBe('');
    expect(ctx.href('{{toString}}')).toEqual({ html: '', text: '' });
    expect(problems.map((problem) => problem.name)).toEqual(['constructor', '__proto__', 'toString']);
  });

  it('escapes a value on the html arm and prints it as it is on the text arm', () => {
    const ctx = createRenderContext(state({ variables: { name: '<b>Mai</b>' } }), 'b1', NO_LANES);
    expect(ctx.html('Hi {{name}}')).toBe('Hi &lt;b&gt;Mai&lt;/b&gt;');
    expect(ctx.text('Hi {{name}}')).toBe('Hi <b>Mai</b>');
  });

  it('reports a variable the send did not fill, and fills it empty', () => {
    const problems: RenderProblem[] = [];
    const ctx = createRenderContext(state({ problems, variables: { name: null } }), 'b1', NO_LANES);
    expect(ctx.text('Hi {{name}}, {{city}}')).toBe('Hi , ');
    expect(problems).toEqual([
      { blockId: 'b1', kind: 'variable-missing', name: 'name' },
      { blockId: 'b1', kind: 'variable-missing', name: 'city' },
    ]);
  });

  it('answers a link from a template that is exactly one url variable', () => {
    const ctx = createRenderContext(
      state({ variables: { verify_url: 'https://x.test/v?a=1&b=2' }, variableTypes: { verify_url: 'url' } }),
      'b1',
      NO_LANES,
    );
    expect(ctx.href(' {{verify_url}} ')).toEqual({
      html: 'https://x.test/v?a=1&amp;b=2',
      text: 'https://x.test/v?a=1&b=2',
    });
  });

  it.each([
    ['prose around the token', 'Go to {{verify_url}}', { verify_url: 'url' as const }],
    ['two tokens', '{{a}}{{b}}', { a: 'url' as const, b: 'url' as const }],
    ['a token declared string', '{{name}}', { name: 'string' as const }],
    ['a literal url', 'https://x.test', {}],
  ])('answers no link for %s', (_case, template, variableTypes) => {
    const problems: RenderProblem[] = [];
    const ctx = createRenderContext(
      state({
        problems,
        variableTypes,
        variables: { verify_url: 'https://x.test', a: 'https://a.test', b: 'https://b.test', name: 'Mai' },
      }),
      'b1',
      NO_LANES,
    );
    expect(ctx.href(template)).toEqual({ html: '', text: '' });
    expect(problems.map((problem) => problem.kind)).toEqual(['href-not-url-variable']);
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', ' JavaScript:alert(1)'])(
    'answers no link for a url value %s',
    (value) => {
      const problems: RenderProblem[] = [];
      const ctx = createRenderContext(
        state({ problems, variables: { verify_url: value }, variableTypes: { verify_url: 'url' } }),
        'b1',
        NO_LANES,
      );
      expect(ctx.href('{{verify_url}}')).toEqual({ html: '', text: '' });
      expect(problems).toEqual([{ blockId: 'b1', kind: 'href-scheme-refused', name: 'verify_url' }]);
    },
  );

  it('accepts a mailto link', () => {
    const ctx = createRenderContext(
      state({ variables: { support: 'mailto:help@x.test' }, variableTypes: { support: 'url' } }),
      'b1',
      NO_LANES,
    );
    expect(ctx.href('{{support}}').text).toBe('mailto:help@x.test');
  });

  it('reports a url variable with no value as missing', () => {
    const problems: RenderProblem[] = [];
    const ctx = createRenderContext(state({ problems, variableTypes: { verify_url: 'url' } }), 'b1', NO_LANES);
    expect(ctx.href('{{verify_url}}')).toEqual({ html: '', text: '' });
    expect(problems).toEqual([{ blockId: 'b1', kind: 'variable-missing', name: 'verify_url' }]);
  });
});
