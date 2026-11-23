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
    ['a token declared string', '{{name}}', { name: 'string' as const }],
    ['an undeclared leading token', '{{verify_url}}', {}],
    ['a refused literal scheme', 'javascript:alert(1)', {}],
    ['an empty href', '  ', {}],
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
    expect(problems.map((problem) => problem.kind)).toEqual(['href-invalid']);
  });

  it("encodes an inner token's value and fills a leading url token as it is", () => {
    const problems: RenderProblem[] = [];
    const ctx = createRenderContext(
      state({
        problems,
        variables: { verify_url: 'https://x.test/v?a=1&b=2', token: 'a&b c', place: '#"<x>' },
        variableTypes: { verify_url: 'url', token: 'string', place: 'string' },
      }),
      'b1',
      NO_LANES,
    );
    expect(ctx.href('{{verify_url}}&t={{token}}')).toEqual({
      html: 'https://x.test/v?a=1&amp;b=2&amp;t=a%26b%20c',
      text: 'https://x.test/v?a=1&b=2&t=a%26b%20c',
    });
    expect(ctx.href('https://x.test/p/{{place}}')).toEqual({
      html: 'https://x.test/p/%23%22%3Cx%3E',
      text: 'https://x.test/p/%23%22%3Cx%3E',
    });
    expect(ctx.href('mailto:a@x.test')).toEqual({ html: 'mailto:a@x.test', text: 'mailto:a@x.test' });
    expect(problems).toEqual([]);
  });

  it('encodes a second url token rather than filling it as it is', () => {
    const ctx = createRenderContext(
      state({ variables: { a: 'https://a.test', b: 'https://b.test/?x=1' }, variableTypes: { a: 'url', b: 'url' } }),
      'b1',
      NO_LANES,
    );
    expect(ctx.href('{{a}}/{{b}}').text).toBe('https://a.test/https%3A%2F%2Fb.test%2F%3Fx%3D1');
  });

  it('fills an inner token with no value as empty and reports it missing', () => {
    const problems: RenderProblem[] = [];
    const ctx = createRenderContext(state({ problems }), 'b1', NO_LANES);
    expect(ctx.href('https://x.test/?t={{token}}').text).toBe('https://x.test/?t=');
    expect(problems).toEqual([{ blockId: 'b1', kind: 'variable-missing', name: 'token' }]);
  });

  it('encodes an inner value holding a lone surrogate without throwing', () => {
    const ctx = createRenderContext(state({ variables: { token: 'a\ud800b' } }), 'b1', NO_LANES);
    expect(ctx.href('https://x.test/?t={{token}}').text).toBe('https://x.test/?t=a%EF%BF%BDb');
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
