// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { baseStylesheet } from './base-stylesheet.js';
import { DEFAULT_EMAIL_THEME } from '../theme.js';
import { composeStylesheets } from './stylesheet.js';

const warningsOf = (css: string) => composeStylesheets('', [css]).warnings;

describe('CSS that common mail clients drop', () => {
  it('warns of flex at its position, naming caniemail.com feature and clients', () => {
    expect(warningsOf('.a{color:red}\n.b{\n  display:flex}')).toEqual([
      {
        sheet: 0,
        line: 3,
        column: 3,
        property: 'display',
        value: 'flex',
        feature: 'css-display-flex',
        clients: expect.arrayContaining(['Outlook Windows']),
      },
    ]);
  });

  it.each([
    ['display:inline-grid', 'css-display-grid'],
    ['position:absolute', 'css-position'],
    ['float:left', 'css-float'],
    ['transform:rotate(2deg)', 'css-transform'],
    ['color:oklch(0.7 0.1 150)', 'css-modern-color'],
    ['color:lab(50% 40 59)', 'css-modern-color'],
    ['background:color-mix(in srgb, red, blue)', 'css-modern-color'],
    ['background-image:linear-gradient(red, blue)', 'css-linear-gradient'],
    ['background:radial-gradient(red, blue)', 'css-radial-gradient'],
  ])('warns of %s', (declaration, feature) => {
    expect(warningsOf(`.a{${declaration}}`).map((warning) => warning.feature)).toEqual([feature]);
  });

  it('warns of a value a variable gives, and of a head rule', () => {
    expect(warningsOf(':root{--d:flex}.a{display:var(--d)}')).toHaveLength(1);
    expect(warningsOf('@media (max-width:600px){.a{position:fixed}}')).toHaveLength(1);
  });

  it('does not warn of what clients read, or of the base sheet', () => {
    expect(warningsOf('.a{display:block;position:static;float:none;color:#fff;background:#000}')).toEqual([]);
    expect(composeStylesheets(baseStylesheet(DEFAULT_EMAIL_THEME), []).warnings).toEqual([]);
  });
});
