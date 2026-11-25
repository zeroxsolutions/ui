import { afterEach, describe, expect, it } from 'vitest';
import { card as cardDefinition, type BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import { Plugin, type NodeType } from '@zeroxsolutions/editor-core/document/advanced';
import {
  createEditor,
  type DocJSON,
  type EditorFeature,
  type IEditor,
  type NodeJSON,
} from '@zeroxsolutions/editor-core/document/core/index';
import {
  docProblems,
  emailProfile,
  presetFits,
  smsProfile,
  toEmailBlocks,
  type EditorEmailBlock,
} from '@zeroxsolutions/editor-core/profiles/index';
import {
  createEmailRenderer,
  type RenderedEmail,
  type RenderEmailInput,
} from '@zeroxsolutions/editor-core/template/email/index';
import { emailKit } from '../../../profiles/email/email-kit';
import { button } from '../button/index';
import { callout } from '../callout/index';
import { card } from '../card/index';
import { columns } from '../columns/index';
import { standardKit } from '../standard/index';
import { toggleHeading } from '../toggle-heading/index';
import { DEFAULT_LIBRARY_PRESET_MESSAGES, documentPresets, emailPresets } from './library-presets';

type Schema = NodeType['schema'];

const editors: IEditor[] = [];
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

/** The schema an editor of `features` builds, read by a plugin as the editor starts. */
function schemaOf(features: readonly EditorFeature[]): Schema {
  let schema: Schema | undefined;
  const probe: EditorFeature = {
    id: 'schemaProbe',
    advanced: {
      prosePlugins: [
        new Plugin({
          state: {
            init: (_config, state) => {
              schema = state.schema;
              return null;
            },
            apply: (_tr, value) => value,
          },
        }),
      ],
    },
  };
  const element = document.createElement('div');
  document.body.append(element);
  editors.push(
    createEditor()
      .use(...features, probe)
      .build({ element }),
  );
  if (schema === undefined) throw new Error('the editor built no schema');
  return schema;
}

/** Whether `content` is a document the schema accepts, every node's content expression included. */
function parses(schema: Schema, content: readonly NodeJSON[]): boolean {
  try {
    schema.nodeFromJSON({ type: 'doc', content }).check();
    return true;
  } catch {
    return false;
  }
}

/** An image's or a link's address left empty, in the stored blocks' JSON. */
const EMPTY_ADDRESS = /"(src|image|icon|href|buttonHref|unsubscribe)":""/g;

const docOf = (preset: BlockPreset): DocJSON => ({ type: 'doc', content: [...preset.content] });
const typesOf = (blocks: readonly EditorEmailBlock[]): unknown[] =>
  blocks.map((block) => (block.lanes ? [block.type, block.lanes.map(typesOf)] : block.type));
const withIds = (blocks: readonly EditorEmailBlock[], prefix = 'b'): RenderEmailInput<unknown>['blocks'] =>
  blocks.map(({ lanes, ...block }, index) => ({
    ...block,
    id: `${prefix}${index}`,
    ...(lanes ? { lanes: lanes.map((lane, at) => withIds(lane, `${prefix}${index}-${at}-`)) } : {}),
  }));

describe('emailPresets', () => {
  const profile = emailProfile();
  const kinds = new Set<string>(profile.kinds);
  const presets = emailPresets(profile);
  const schema = schemaOf(emailKit(profile));
  const nodes = new Set(Object.keys(schema.nodes));
  const renderer = createEmailRenderer();

  it('holds the header, hero, call to action, two-up and footer, exported as those blocks', () => {
    const lane = ['image', 'heading', 'paragraph', 'button'];
    expect(
      presets.map((preset) => [preset.id, typesOf(toEmailBlocks(docOf(preset), [], { kinds: profile.kinds }))]),
    ).toEqual([
      ['header', ['image', 'divider']],
      ['hero', ['hero']],
      ['call-to-action', ['heading', 'paragraph', 'button']],
      ['two-up', [['columns', [lane, lane]]]],
      ['footer', ['socialLinks', 'legalFooter']],
    ]);
  });

  it('centres the legal footer under the centred social links in the footer', () => {
    const footer = presets.find((preset) => preset.id === 'footer')!;
    const blocks = toEmailBlocks(docOf(footer), [], { kinds: profile.kinds });
    expect(blocks.map((block) => [block.type, block.attributes.align])).toEqual([
      ['socialLinks', 'center'],
      ['legalFooter', 'center'],
    ]);
  });

  it.each(presets.map((preset) => [preset.id, preset] as const))(
    'fits the default email profile: %s',
    (_id, preset) => {
      expect(presetFits(preset, { nodes, kinds })).toBe(true);
      expect(parses(schema, preset.content)).toBe(true);
    },
  );

  it.each(presets.map((preset) => [preset.id, preset] as const))(
    'exports with every block carried and renders: %s',
    (_id, preset) => {
      const doc = docOf(preset);
      expect(docProblems(doc, { kinds: profile.kinds })).toEqual([]);
      const blocks = withIds(toEmailBlocks(doc, [], { kinds: profile.kinds }));
      const render = (from: typeof blocks): RenderedEmail =>
        renderer.render({
          blocks: from,
          subject: 'Subject',
          preheader: null,
          locale: 'en',
          variables: {},
          variableTypes: {},
          layoutProps: { logo: { url: 'https://x.test/logo.png', alt: 'Logo', width: 120 }, footer: [] },
        });
      const empty = render(blocks);
      expect(empty.problems.map((problem) => problem.kind)).toEqual(empty.problems.map(() => 'href-invalid'));
      const filled = render(JSON.parse(JSON.stringify(blocks).replace(EMPTY_ADDRESS, '"$1":"https://x.test/a.png"')));
      expect(filled.problems).toEqual([]);
      expect(filled.html).toContain(`zx-block-${blocks[0].type}`);
    },
  );

  it('holds no variable, and leaves every image and link empty', () => {
    const wire = JSON.stringify(presets.map((preset) => toEmailBlocks(docOf(preset))));
    expect(wire).not.toContain('{{');
    expect(wire).toMatch(EMPTY_ADDRESS);
    expect(wire).not.toMatch(/"(src|image|icon|href|buttonHref|unsubscribe)":"[^"]/);
  });

  it('is not offered by a profile whose kinds lack a block it holds', () => {
    const narrow = emailProfile({ allow: ['paragraph', 'heading', 'button', 'divider', 'image'] });
    const narrowKinds = new Set<string>(narrow.kinds);
    const fitting = emailPresets(narrow).filter((preset) => presetFits(preset, { nodes, kinds: narrowKinds }));
    expect(fitting.map((preset) => preset.id)).toEqual(['header', 'call-to-action']);
  });

  it('refuses a profile that is not an email one', () => {
    expect(() => emailPresets(smsProfile())).toThrow(/not email/);
  });
});

describe('documentPresets', () => {
  const presets = documentPresets();
  const schema = schemaOf([standardKit(), columns(), toggleHeading(), callout(), button(), card(cardDefinition)]);
  const nodes = new Set(Object.keys(schema.nodes));

  it('holds two columns, an FAQ, a callout with a button and cards in columns', () => {
    expect(presets.map((preset) => [preset.id, preset.content.map((node) => node.type)])).toEqual([
      ['two-columns', ['columns']],
      ['faq', ['toggleHeading', 'toggleHeading', 'toggleHeading']],
      ['callout-button', ['callout']],
      ['cards-in-columns', ['columns']],
    ]);
  });

  it.each(presets.map((preset) => [preset.id, preset] as const))(
    "fits the Document Editor's standard kit with the library features: %s",
    (_id, preset) => {
      expect(presetFits(preset, { nodes })).toBe(true);
      expect(parses(schema, preset.content)).toBe(true);
    },
  );

  it('does not fit an editor with the standard kit alone', () => {
    const plain = new Set(Object.keys(schemaOf([standardKit()]).nodes));
    expect(presets.filter((preset) => presetFits(preset, { nodes: plain }))).toEqual([]);
  });
});

describe('the library presets in a host catalogue', () => {
  it("draw the host's words and keep the English for the rest", () => {
    const [header] = emailPresets(emailProfile(), {
      header: { label: 'En-tete', description: 'Un logo', keywords: ['logo'] },
      logoAlt: 'Le logo',
    });
    expect([header.label, header.description, header.keywords]).toEqual(['En-tete', 'Un logo', ['logo']]);
    expect(JSON.stringify(header.content)).toContain('Le logo');
    const [twoColumns] = documentPresets({ heading: 'Un titre' });
    expect(twoColumns.label).toBe(DEFAULT_LIBRARY_PRESET_MESSAGES.twoColumns.label);
    expect(JSON.stringify(twoColumns.content)).toContain('Un titre');
  });
});
