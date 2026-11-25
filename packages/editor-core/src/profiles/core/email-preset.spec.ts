// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { definePreset, PresetDefinitionInvalid } from '../../blocks/preset.js';
import type { NodeJSON } from '../../document/core/types/index.js';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import { plainText } from '../../template/email/fields.js';
import { emailPreset, presetFits } from './email-preset.js';
import { EMAIL_KINDS, emailProfile, smsProfile } from './profile.js';

const testimonial = defineEmailBlock({
  type: 'testimonial',
  label: 'Testimonial',
  fields: { author: plainText() },
  render: (_view, h) => h.divider(),
  sample: { fields: { author: 'b' }, variableTypes: {} },
});

const heading: NodeJSON = { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hi' }] };
const paragraph: NodeJSON = {
  type: 'paragraph',
  content: [{ type: 'text', text: 'a', marks: [{ type: 'bold' }] }],
};
const nodes = new Set(['doc', 'paragraph', 'heading', 'text', 'columns', 'column', 'hero', 'emailUnknown']);
const allKinds = new Set<string>(EMAIL_KINDS);

describe('presetFits', () => {
  it('fits an editor holding every node it holds, its marks aside', () => {
    const preset = definePreset({ id: 'intro', label: 'Intro', content: [heading, paragraph] });
    expect(presetFits(preset, { nodes })).toBe(true);
  });

  it('does not fit an editor missing one of its nodes', () => {
    const preset = definePreset({ id: 'intro', label: 'Intro', content: [heading, paragraph] });
    expect(presetFits(preset, { nodes: new Set(['paragraph', 'text']) })).toBe(false);
  });

  it('does not fit a profile whose kinds lack its heading', () => {
    const preset = definePreset({ id: 'intro', label: 'Intro', content: [heading, paragraph] });
    const kinds = new Set(EMAIL_KINDS.filter((kind) => kind !== 'heading'));
    expect(presetFits(preset, { nodes, kinds })).toBe(false);
  });

  it('does not fit a profile whose kinds lack a library block it holds in a lane', () => {
    const preset = definePreset({
      id: 'lanes',
      label: 'Lanes',
      content: [
        {
          type: 'columns',
          content: [
            { type: 'column', content: [paragraph] },
            { type: 'column', content: [{ type: 'hero', attrs: { heading: '' } }] },
          ],
        },
      ],
    });
    expect(presetFits(preset, { nodes, kinds: allKinds })).toBe(true);
    const kinds = new Set(EMAIL_KINDS.filter((kind) => kind !== 'hero'));
    expect(presetFits(preset, { nodes, kinds })).toBe(false);
  });

  it('fits a profile whose kinds hold every kind it maps to', () => {
    const preset = definePreset({ id: 'intro', label: 'Intro', content: [heading, paragraph] });
    expect(presetFits(preset, { nodes, kinds: allKinds })).toBe(true);
  });

  it('never fits with a block no codec read', () => {
    const preset = definePreset({
      id: 'unknown',
      label: 'Unknown',
      content: [{ type: 'emailUnknown', attrs: { block: { type: 'mystery' } } }],
    });
    expect(presetFits(preset, { nodes })).toBe(false);
  });
});

describe('emailPreset', () => {
  it('gives a saved block no id, no key and no stored copy', () => {
    const preset = emailPreset(emailProfile(), {
      id: 'title',
      label: 'Title',
      blocks: [{ id: 'srv-1', key: 'k-1', type: 'heading', attributes: { level: 1 }, content: { text: 'Hello' } }],
    });
    expect(preset.content).toEqual([
      { type: 'heading', attrs: { id: null, level: 1, source: 'Hello' }, content: [{ type: 'text', text: 'Hello' }] },
    ]);
  });

  it('clears the ids of the blocks in a lane', () => {
    const preset = emailPreset(emailProfile(), {
      id: 'two-up',
      label: 'Two up',
      blocks: [
        {
          id: 'c1',
          key: 'kc',
          type: 'columns',
          attributes: {},
          content: {},
          lanes: [
            [{ id: 'p1', key: 'kp', type: 'paragraph', attributes: {}, content: { text: 'a' } }],
            [{ id: 'd1', key: 'kd', type: 'divider', attributes: {}, content: {} }],
          ],
        },
      ],
    });
    expect(JSON.stringify(preset.content)).not.toMatch(/"(c1|p1|d1|kc|kp|kd)"/);
  });

  it("reads a block of the profile's own through its codec", () => {
    const profile = emailProfile({ blocks: [testimonial] });
    const preset = emailPreset(profile, {
      id: 'quote',
      label: 'Quote',
      blocks: [{ id: null, key: '', type: 'testimonial', attributes: {}, content: { author: 'Lan' } }],
    });
    expect(preset.content).toEqual([{ type: 'email_testimonial', attrs: { id: null, author: 'Lan' } }]);
  });

  it('refuses a block the profile has no codec for', () => {
    expect(() =>
      emailPreset(emailProfile(), {
        id: 'quote',
        label: 'Quote',
        blocks: [{ id: null, key: '', type: 'testimonial', attributes: {}, content: { author: 'Lan' } }],
      }),
    ).toThrow(PresetDefinitionInvalid);
  });

  it('refuses a block no codec reads inside a lane', () => {
    expect(() =>
      emailPreset(emailProfile(), {
        id: 'lanes',
        label: 'Lanes',
        blocks: [
          {
            id: null,
            key: '',
            type: 'columns',
            attributes: {},
            content: {},
            lanes: [[{ id: null, key: '', type: 'mystery', attributes: {}, content: {} }], []],
          },
        ],
      }),
    ).toThrow(PresetDefinitionInvalid);
  });

  it('refuses a profile that is not an email one', () => {
    expect(() =>
      emailPreset(smsProfile(), {
        id: 'text',
        label: 'Text',
        blocks: [{ id: null, key: '', type: 'paragraph', attributes: {}, content: { text: 'a' } }],
      }),
    ).toThrow(PresetDefinitionInvalid);
  });

  it('keeps the options it was given', () => {
    const preset = emailPreset(emailProfile(), {
      id: 'text',
      label: 'Text',
      description: 'A paragraph',
      keywords: ['body'],
      icon: 'T',
      blocks: [{ id: null, key: '', type: 'paragraph', attributes: {}, content: { text: 'a' } }],
    });
    expect(preset).toMatchObject({
      id: 'text',
      label: 'Text',
      description: 'A paragraph',
      keywords: ['body'],
      icon: 'T',
    });
  });
});
