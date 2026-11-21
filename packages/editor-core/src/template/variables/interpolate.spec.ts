// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { interpolate } from './interpolate.js';

describe('interpolate', () => {
  it('fills a token named after an Object member as empty', () => {
    expect(interpolate('{{constructor}}{{__proto__}}', {}, 'html')).toBe('');
    expect(interpolate('{{toString}}', {}, 'text')).toBe('');
  });

  it('escapes a value on the html arm', () => {
    const rendered = interpolate('Hi {{name}},', { name: '<script>x</script>' }, 'html');
    expect(rendered).toBe('Hi &lt;script&gt;x&lt;/script&gt;,');
  });

  it('leaves the same value alone on the text arm', () => {
    expect(interpolate('Hi {{name}},', { name: '<script>x</script>' }, 'text')).toBe('Hi <script>x</script>,');
  });

  it('escapes the whole set: ampersand, both angle brackets and both quote characters', () => {
    expect(interpolate('{{value}}', { value: 'T&<>"\'' }, 'html')).toBe('T&amp;&lt;&gt;&quot;&#39;');
  });

  it('escapes the ampersand first, so the entity a later replacement writes is never re-escaped', () => {
    expect(interpolate('Hi {{name}}', { name: '<' }, 'html')).toBe('Hi &lt;');
  });

  it('fills a token absent from the variable map with nothing, on either arm', () => {
    expect(interpolate('Hi {{name}},', {}, 'text')).toBe('Hi ,');
  });
});
