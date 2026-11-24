// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { LayoutInput } from '../layout.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from '../fixtures.fixture.js';
import { createEmailRenderer } from '../renderer.js';
import { checkEmailRenderer } from './index.js';

describe('checkEmailRenderer', () => {
  it('passes the defaults', () => {
    expect(
      checkEmailRenderer(createEmailRenderer({ theme: FIXTURE_THEME }), { layoutProps: FIXTURE_LAYOUT_PROPS }),
    ).toEqual([]);
  });

  it('fails a block that prints a value raw', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        paragraph: ({ content }, ctx) => ({
          html: `<tr><td>${ctx.text(content.text)}</td></tr>`,
          text: ctx.text(content.text),
        }),
      },
    });
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toContainEqual({
      type: 'paragraph',
      problem: 'value-unescaped',
    });
  });

  it('fails a block that holds text and drops the text arm', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: { callout: ({ content }, ctx) => ({ html: `<tr><td>${ctx.html(content.text)}</td></tr>`, text: '' }) },
    });
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toContainEqual({
      type: 'callout',
      problem: 'text-empty',
    });
  });

  it('fails a block that writes its own link', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        button: ({ content }, ctx) => ({
          html: `<tr><td><a href="https://elsewhere.test">${ctx.html(content.label)}</a></td></tr>`,
          text: `${ctx.text(content.label)}\n`,
        }),
      },
    });
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toContainEqual(
      expect.objectContaining({ type: 'button', problem: 'href-foreign' }),
    );
  });

  it('fails a block whose render throws, and checks the rest', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        code: () => {
          throw new Error('boom');
        },
      },
    });
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toEqual([
      { type: 'code', problem: 'render-threw', detail: 'boom' },
      { type: 'code', problem: 'render-threw', detail: 'boom', region: 'header' },
      { type: 'code', problem: 'render-threw', detail: 'boom', region: 'footer' },
    ]);
  });

  it('fails a layout that prints the subject raw', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      layout: ({ body, subject, h }: LayoutInput<typeof FIXTURE_LAYOUT_PROPS>) => [
        h.raw({ markup: `<h1>${subject}</h1>` }),
        h.region('body', body),
      ],
    });
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toContainEqual(
      expect.objectContaining({ problem: 'value-unescaped' }),
    );
  });

  it('names the region an override breaks a rule in', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        paragraph: ({ content }, ctx) =>
          ctx.region === 'footer'
            ? { html: `<tr><td>${ctx.text(content.text)}</td></tr>`, text: ctx.text(content.text) }
            : { html: `<tr><td>${ctx.html(content.text)}</td></tr>`, text: ctx.text(content.text) },
      },
    });
    const failures = checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS });
    expect(failures).toContainEqual({ type: 'paragraph', problem: 'value-unescaped', region: 'footer' });
    expect(failures).not.toContainEqual({ type: 'paragraph', problem: 'value-unescaped' });
  });

  it('names the region an override drops the text arm in', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        paragraph: ({ content }, ctx) =>
          ctx.region === 'footer'
            ? { html: `<tr><td>${ctx.html(content.text)}</td></tr>`, text: '' }
            : { html: `<tr><td>${ctx.html(content.text)}</td></tr>`, text: ctx.text(content.text) },
      },
    });
    const failures = checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS });
    expect(failures).toContainEqual({ type: 'paragraph', problem: 'text-empty', region: 'footer' });
    expect(failures).not.toContainEqual({ type: 'paragraph', problem: 'text-empty' });
  });

  it('names the region an override writes its own link in', () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        paragraph: ({ content }, ctx) => ({
          html: `<tr><td><a href="https://elsewhere.invalid/">${ctx.html(content.text)}</a></td></tr>`,
          text: ctx.text(content.text),
        }),
      },
    });
    const failures = checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS });
    expect(failures).toContainEqual({
      type: 'paragraph',
      problem: 'href-foreign',
      detail: 'https://elsewhere.invalid/',
      region: 'footer',
    });
  });

  it("lists the CSS of the renderer's sheets that common clients drop", () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME, css: '.zx-callout{display:flex}' });
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toEqual([
      {
        problem: 'stylesheet-unsupported',
        warning: expect.objectContaining({ sheet: 0, property: 'display', feature: 'css-display-flex' }),
      },
    ]);
  });
});
