import { describe, expect, it } from 'vitest';
import { colorTokenFromElement, layoutDataAttributes, layoutFromElement } from './index.js';

function element(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild as HTMLElement;
}

describe('layoutDataAttributes', () => {
  it('writes each layout value as a data attribute', () => {
    expect(
      layoutDataAttributes({
        align: 'center',
        width: 0.5,
        spaceBefore: 'none',
        spaceAfter: 'large',
        responsive: { sm: { width: 1 } },
        textAlign: 'end',
        size: 'lead',
      }),
    ).toEqual({
      'data-align': 'center',
      'data-width': '0.5',
      'data-space-before': 'none',
      'data-space-after': 'large',
      'data-layout-responsive': '{"sm":{"width":1}}',
      'data-text-align': 'end',
      'data-size': 'lead',
    });
  });

  it('writes nothing for an absent layout, and nothing for a value outside the set', () => {
    expect(layoutDataAttributes({})).toEqual({});
    expect(layoutDataAttributes({ align: 'left' } as never)).toEqual({});
  });
});

describe('layoutFromElement', () => {
  it('reads back what layoutDataAttributes wrote', () => {
    const written = layoutDataAttributes({
      align: 'end',
      width: 'full',
      spaceBefore: 'small',
      textAlign: 'justify',
      size: 'small',
    });
    const host = document.createElement('div');
    for (const [name, value] of Object.entries(written)) host.setAttribute(name, value);
    expect(layoutFromElement(host)).toEqual({
      align: 'end',
      width: 'full',
      spaceBefore: 'small',
      textAlign: 'justify',
      size: 'small',
    });
  });

  it.each([
    ['right', 'end'],
    ['left', 'start'],
    ['center', 'center'],
    ['justify', 'justify'],
    ['end', 'end'],
  ])('reads a style text-align of %s as %s', (css, token) => {
    expect(layoutFromElement(element(`<p style="text-align:${css}">x</p>`))).toEqual({ textAlign: token });
  });

  it('reads an image pixel width against the base it was drawn in, and drops other pixels', () => {
    expect(layoutFromElement(element('<img width="360">'), 720)).toEqual({ width: 0.5 });
    expect(layoutFromElement(element('<img width="360">'))).toEqual({});
    expect(layoutFromElement(element('<p style="width:300px">x</p>'), 720)).toEqual({});
  });

  it('drops a value outside the set', () => {
    expect(
      layoutFromElement(element('<div data-align="left" data-width="300" data-space-after="huge"></div>')),
    ).toEqual({});
  });
});

describe('colorTokenFromElement', () => {
  it.each([
    ['<span data-color="red">x</span>', 'color', 'red'],
    ['<span style="color:teal">x</span>', 'color', 'teal'],
    ['<span style="color:#ff0000">x</span>', 'color', null],
    ['<span style="color:rgb(1, 2, 3)">x</span>', 'color', null],
    ['<span data-color="magenta">x</span>', 'color', null],
    ['<span data-bg="amber">x</span>', 'background', 'amber'],
    ['<span style="background:pink">x</span>', 'background', 'pink'],
    ['<span style="background:rgb(1,2,3)">x</span>', 'background', null],
  ] as const)('reads %s as %s %s', (html, property, token) => {
    expect(colorTokenFromElement(element(html), property)).toBe(token);
  });
});
