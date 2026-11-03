// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { currentStyle, parseStyle, registryStyle, styleHref } from './style-choice';

describe('parseStyle', () => {
  it("takes a style the platform publishes, and nothing else, as a URL's or a store's value", () => {
    expect(parseStyle('native', 'nova')).toBe('nova');
    expect(parseStyle('web', 'rhea')).toBe('rhea');
    expect(parseStyle('native', 'rhea')).toBeUndefined();
    expect(parseStyle('native', 'Nova')).toBeUndefined();
    expect(parseStyle('native', '')).toBeUndefined();
    expect(parseStyle('native', null)).toBeUndefined();
  });
});

describe('currentStyle', () => {
  it("shows a pasted link's style over the one the reader last chose", () => {
    expect(currentStyle('native', 'vega', 'nova')).toBe('vega');
  });

  it("shows the reader's last choice where the URL names none", () => {
    expect(currentStyle('native', null, 'nova')).toBe('nova');
  });

  it('falls back past a style the platform does not publish, to the last choice and then the default', () => {
    expect(currentStyle('native', 'rhea', 'nova')).toBe('nova');
    expect(currentStyle('native', 'rhea', 'luma')).toBe('vega');
    expect(currentStyle('web', null, null)).toBe('nova');
  });
});

describe('styleHref', () => {
  it('writes a style other than the default as ?style=, keeping the rest of the query', () => {
    expect(styleHref('/native/components/nativewind/button', '', 'native', 'nova')).toBe(
      '/native/components/nativewind/button?style=nova',
    );
    expect(styleHref('/docs/installation', '?q=x', 'web', 'vega')).toBe('/docs/installation?q=x&style=vega');
  });

  it('writes no ?style= for the default, and drops one the URL had', () => {
    expect(styleHref('/native/docs', '', 'native', 'vega')).toBe('/native/docs');
    expect(styleHref('/native/docs', '?style=nova', 'native', 'vega')).toBe('/native/docs');
    expect(styleHref('/docs', '?style=vega&q=x', 'web', 'nova')).toBe('/docs?q=x');
  });
});

describe('registryStyle', () => {
  it("names a native style after its engine, and a web style after the base, as components.json's style", () => {
    expect(registryStyle({ platform: 'native', engine: 'uniwind', style: 'nova' })).toBe('uniwind-nova');
    expect(registryStyle({ platform: 'web', base: 'base', style: 'vega' })).toBe('base-vega');
  });
});
