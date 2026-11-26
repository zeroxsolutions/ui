// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { layoutProps } from './layout-props';

describe('layoutProps', () => {
  it('an absent layout yields no attribute', () => {
    expect(layoutProps({})).toEqual({});
    expect(layoutProps({ align: null, width: null, spaceBefore: null, spaceAfter: null })).toEqual({});
  });

  it('0.5 yields data-width and --layout-width', () => {
    expect(layoutProps({ width: 0.5 })).toEqual({ 'data-width': '0.5', style: { '--layout-width': '0.5' } });
  });

  it('full yields data-width and no fraction to draw', () => {
    expect(layoutProps({ width: 'full' })).toEqual({ 'data-width': 'full' });
  });

  it('writes each token the block holds, and the text alignment and size of a line', () => {
    expect(
      layoutProps({ align: 'center', spaceBefore: 'none', spaceAfter: 'large', textAlign: 'end', size: 'lead' }),
    ).toEqual({
      'data-align': 'center',
      'data-space-before': 'none',
      'data-space-after': 'large',
      'data-text-align': 'end',
      'data-size': 'lead',
    });
  });

  it('drops a pixel width, a fraction under the least and a name outside the set', () => {
    expect(layoutProps({ width: 300, align: 'left', spaceAfter: 'huge' })).toEqual({});
    expect(layoutProps({ width: 0.1 })).toEqual({});
  });

  it('draws no responsive override', () => {
    expect(layoutProps({ responsive: { sm: { width: 1 } } })).toEqual({});
  });
});
