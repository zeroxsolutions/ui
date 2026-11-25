// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { NodeJSON } from '../document/core/types/index.js';
import { definePreset, PresetDefinitionInvalid, presetContent } from './preset.js';

const paragraph = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe('definePreset', () => {
  it('refuses a preset with no content', () => {
    expect(() => definePreset({ id: 'empty', label: 'Empty', content: [] })).toThrow(PresetDefinitionInvalid);
  });

  it.each(['', 'Hero', '-hero', 'hero_cta', 'hero cta'])('refuses the id %j', (id) => {
    expect(() => definePreset({ id, label: 'Hero', content: [paragraph('a')] })).toThrow(PresetDefinitionInvalid);
  });

  it('names the refused id on the error', () => {
    const error = (() => {
      try {
        definePreset({ id: 'Bad', label: 'Bad', content: [] });
      } catch (caught) {
        return caught;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(PresetDefinitionInvalid);
    expect((error as PresetDefinitionInvalid).id).toBe('Bad');
  });

  it('refuses a text node at the top level', () => {
    expect(() => definePreset({ id: 'text', label: 'Text', content: [{ type: 'text', text: 'a' }] })).toThrow(
      PresetDefinitionInvalid,
    );
  });

  it('refuses a mark at the top level', () => {
    expect(() => definePreset({ id: 'bold', label: 'Bold', content: [{ type: 'bold' }] })).toThrow(
      PresetDefinitionInvalid,
    );
  });

  it('fills what the options leave out', () => {
    const preset = definePreset({ id: 'cta-2', label: 'Call to action', content: [paragraph('a')] });
    expect(preset).toMatchObject({ id: 'cta-2', label: 'Call to action', icon: null, description: null, keywords: [] });
  });

  it('freezes the preset down to its nested nodes', () => {
    const preset = definePreset({
      id: 'quote',
      label: 'Quote',
      keywords: ['cite'],
      content: [{ type: 'blockquote', content: [paragraph('a')] }],
    });
    expect(Object.isFrozen(preset)).toBe(true);
    expect(Object.isFrozen(preset.keywords)).toBe(true);
    expect(Object.isFrozen(preset.content[0])).toBe(true);
    expect(Object.isFrozen(preset.content[0].content?.[0].content?.[0])).toBe(true);
  });

  it('keeps no identity from the content it was given', () => {
    const preset = definePreset({
      id: 'p',
      label: 'P',
      content: [{ type: 'paragraph', attrs: { id: 'b1', key: 'k1', stored: { a: 1 } } }],
    });
    expect(preset.content).toEqual([{ type: 'paragraph', attrs: { id: null } }]);
  });

  it('leaves the caller its content to change', () => {
    const content = [paragraph('a')];
    definePreset({ id: 'p', label: 'P', content });
    expect(Object.isFrozen(content[0])).toBe(false);
  });
});

describe('presetContent', () => {
  it('clears the id and drops the key and the stored block', () => {
    expect(presetContent([{ type: 'paragraph', attrs: { id: 'b1', key: 'k', stored: 'x' } }])).toEqual([
      { type: 'paragraph', attrs: { id: null } },
    ]);
  });

  it('clears the identity of the blocks inside a lane', () => {
    const columns: NodeJSON = {
      type: 'columns',
      attrs: { id: 'c1', key: 'kc' },
      content: [
        { type: 'column', content: [{ type: 'heading', attrs: { id: 'h1', key: 'kh', stored: {}, level: 2 } }] },
        { type: 'column', content: [{ type: 'image', attrs: { id: 'i1', key: 'ki', src: '' } }] },
      ],
    };
    expect(presetContent([columns])).toEqual([
      {
        type: 'columns',
        attrs: { id: null },
        content: [
          { type: 'column', content: [{ type: 'heading', attrs: { id: null, level: 2 } }] },
          { type: 'column', content: [{ type: 'image', attrs: { id: null, src: '' } }] },
        ],
      },
    ]);
  });

  it("keeps an inline node's id, which names what it points at", () => {
    const content: NodeJSON[] = [
      { type: 'paragraph', content: [{ type: 'mention', attrs: { id: 'user-1', label: 'Lan' } }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hi ' },
          { type: 'mention', attrs: { id: 'user-2', label: 'Minh' } },
        ],
      },
    ];
    expect(presetContent(content)).toEqual(content);
  });

  it("keeps the id of a mention alone in a card's inline body", () => {
    const content: NodeJSON[] = [
      { type: 'card', attrs: { id: 'c1' }, content: [{ type: 'mention', attrs: { id: 'user-1', label: 'Lan' } }] },
    ];
    expect(presetContent(content)).toEqual([
      { type: 'card', attrs: { id: null }, content: [{ type: 'mention', attrs: { id: 'user-1', label: 'Lan' } }] },
    ]);
  });

  it('leaves its input as it was', () => {
    const content: NodeJSON[] = [{ type: 'paragraph', attrs: { id: 'b1', key: 'k' } }];
    presetContent(content);
    expect(content).toEqual([{ type: 'paragraph', attrs: { id: 'b1', key: 'k' } }]);
  });

  it('gives a copy that shares nothing with its input', () => {
    const content: NodeJSON[] = [
      { type: 'paragraph', attrs: { align: 'left' }, content: [{ type: 'text', text: 'a' }] },
    ];
    const copy = presetContent(content);
    expect(copy).toEqual(content);
    expect(copy[0]).not.toBe(content[0]);
    expect(copy[0].attrs).not.toBe(content[0].attrs);
    expect(copy[0].content?.[0]).not.toBe(content[0].content?.[0]);
  });
});
