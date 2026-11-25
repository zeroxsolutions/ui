import { CircleQuestionMarkIcon } from '@/registry/bases/base-ui/icons/lucide/circle-question-mark-icon';
import { IdCardIcon } from '@/registry/bases/base-ui/icons/lucide/id-card-icon';
import { ImageIcon } from '@/registry/bases/base-ui/icons/lucide/image-icon';
import { InfoIcon } from '@/registry/bases/base-ui/icons/lucide/info-icon';
import { LayoutGridIcon } from '@/registry/bases/base-ui/icons/lucide/layout-grid-icon';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { MailboxIcon } from '@/registry/bases/base-ui/icons/lucide/mailbox-icon';
import { MousePointerClickIcon } from '@/registry/bases/base-ui/icons/lucide/mouse-pointer-click-icon';
import { definePreset, type BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { emailPreset, type EditorEmailBlock, type EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';

/** A library preset's name, its line in a menu, and the words besides its name a search finds it by. */
export interface LibraryPresetWords {
  readonly label: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

/**
 * Every word the library's presets hold: each preset's name, and the placeholder text inside its blocks, which
 * the author replaces. A host passes some of them in its own catalogue's words; the rest stay
 * `DEFAULT_LIBRARY_PRESET_MESSAGES`'s English.
 */
export interface LibraryPresetMessages {
  readonly header: LibraryPresetWords;
  readonly hero: LibraryPresetWords;
  readonly callToAction: LibraryPresetWords;
  readonly twoUp: LibraryPresetWords;
  readonly footer: LibraryPresetWords;
  readonly twoColumns: LibraryPresetWords;
  readonly faq: LibraryPresetWords;
  readonly calloutButton: LibraryPresetWords;
  readonly cardsInColumns: LibraryPresetWords;
  /** The alt text of the header's logo, read where images are off. */
  readonly logoAlt: string;
  /** The alt text of every other image. */
  readonly imageAlt: string;
  readonly heading: string;
  readonly text: string;
  readonly buttonLabel: string;
  /** The FAQ's toggle headings. */
  readonly question: string;
  /** What each FAQ question opens to. */
  readonly answer: string;
  /** One social link per label, each with no icon or link yet. */
  readonly socialLinks: readonly string[];
  /** The legal footer's line naming who sends the mail. */
  readonly sender: string;
  /** The legal footer's line saying why the reader gets the mail. */
  readonly reason: string;
  readonly unsubscribeLabel: string;
}

export const DEFAULT_LIBRARY_PRESET_MESSAGES: LibraryPresetMessages = {
  header: { label: 'Header', description: 'A logo over a divider', keywords: ['logo', 'brand', 'top'] },
  hero: {
    label: 'Hero',
    description: 'A wide image, a heading, text and a button',
    keywords: ['banner', 'masthead', 'opening'],
  },
  callToAction: {
    label: 'Call to action',
    description: 'A heading, text and a button',
    keywords: ['cta', 'action', 'button'],
  },
  twoUp: {
    label: 'Two-up',
    description: 'Two columns, each an image, a heading, text and a button',
    keywords: ['columns', 'side by side', 'feature'],
  },
  footer: {
    label: 'Footer',
    description: 'Social links and the legal footer',
    keywords: ['social', 'unsubscribe', 'address', 'legal', 'bottom'],
  },
  twoColumns: {
    label: 'Two columns',
    description: 'Two columns, each a heading and text',
    keywords: ['columns', 'side by side', 'layout'],
  },
  faq: { label: 'FAQ', description: 'Questions that open to their answers', keywords: ['questions', 'toggle', 'help'] },
  calloutButton: {
    label: 'Callout with a button',
    description: 'A highlighted note and a button',
    keywords: ['note', 'notice', 'action'],
  },
  cardsInColumns: {
    label: 'Cards in columns',
    description: 'Two cards side by side',
    keywords: ['cards', 'columns', 'grid'],
  },
  logoAlt: 'Logo',
  imageAlt: 'Describe the image',
  heading: 'Add a heading',
  text: 'Write a sentence or two here.',
  buttonLabel: 'Learn more',
  question: 'Add a question',
  answer: 'Write its answer here.',
  socialLinks: ['Facebook', 'Instagram', 'LinkedIn'],
  sender: 'Who sends this mail.',
  reason: 'Why the reader gets it.',
  unsubscribeLabel: 'Unsubscribe',
};

function libraryPresetMessages(messages?: Partial<LibraryPresetMessages>): LibraryPresetMessages {
  return messages ? { ...DEFAULT_LIBRARY_PRESET_MESSAGES, ...messages } : DEFAULT_LIBRARY_PRESET_MESSAGES;
}

/** The header logo's width in px: an image drawn at none fills the mail's width. */
const LOGO_WIDTH = 120;

// A preset's blocks are new ones, so they carry no id or key; `emailPreset` drops whatever they hold.
function stored(
  type: string,
  content: Record<string, unknown>,
  attributes: Record<string, unknown> = {},
  lanes?: EditorEmailBlock[][],
): EditorEmailBlock {
  return { id: null, key: '', type, attributes, content, ...(lanes ? { lanes } : {}) };
}

function lane(words: LibraryPresetMessages): EditorEmailBlock[] {
  return [
    stored('image', { src: '', alt: words.imageAlt }),
    stored('heading', { text: words.heading }, { level: 3 }),
    stored('paragraph', { text: words.text }),
    stored('button', { label: words.buttonLabel, href: '' }),
  ];
}

/**
 * The library's email presets, read as `profile` reads them: a header (a logo and a divider), a hero, a call to
 * action (a heading, text and a button), a two-up (two columns, each an image, a heading, text and a button) and
 * a footer (social links and the legal footer). Their text is `messages`' placeholders, with no variable, and
 * every image and link is empty, so each shows the problems a block inserted empty shows until it is filled.
 *
 * @throws {PresetDefinitionInvalid} for a profile that is not an email one
 */
export function emailPresets(profile: EditorProfile, messages?: Partial<LibraryPresetMessages>): BlockPreset[] {
  const words = libraryPresetMessages(messages);
  return [
    emailPreset(profile, {
      id: 'header',
      icon: ImageIcon,
      ...words.header,
      blocks: [
        stored('image', { src: '', alt: words.logoAlt }, { align: 'left', width: LOGO_WIDTH }),
        stored('divider', {}),
      ],
    }),
    emailPreset(profile, {
      id: 'hero',
      icon: LayoutPanelTopIcon,
      ...words.hero,
      blocks: [
        stored(
          'hero',
          {
            image: '',
            alt: words.imageAlt,
            heading: words.heading,
            text: words.text,
            buttonLabel: words.buttonLabel,
            buttonHref: '',
          },
          { align: 'center' },
        ),
      ],
    }),
    emailPreset(profile, {
      id: 'call-to-action',
      icon: MousePointerClickIcon,
      ...words.callToAction,
      blocks: [
        stored('heading', { text: words.heading }, { level: 2, align: 'center' }),
        stored('paragraph', { text: words.text }, { align: 'center' }),
        stored('button', { label: words.buttonLabel, href: '' }, { align: 'center' }),
      ],
    }),
    emailPreset(profile, {
      id: 'two-up',
      icon: LayoutGridIcon,
      ...words.twoUp,
      blocks: [stored('columns', {}, { ratio: [1, 1] }, [lane(words), lane(words)])],
    }),
    emailPreset(profile, {
      id: 'footer',
      icon: MailboxIcon,
      ...words.footer,
      blocks: [
        stored(
          'socialLinks',
          { links: words.socialLinks.map((label) => ({ label, icon: '', href: '' })) },
          { align: 'center', size: 'small' },
        ),
        stored(
          'legalFooter',
          {
            sender: words.sender,
            reason: words.reason,
            address: '',
            unsubscribe: '',
            unsubscribeLabel: words.unsubscribeLabel,
          },
          { align: 'center' },
        ),
      ],
    }),
  ];
}

const text = (value: string): NodeJSON[] => [{ type: 'text', text: value }];
const heading = (level: number, value: string): NodeJSON => ({
  type: 'heading',
  attrs: { level },
  content: text(value),
});
const paragraph = (value: string): NodeJSON => ({ type: 'paragraph', content: text(value) });
const columns = (lanes: NodeJSON[][]): NodeJSON => ({
  type: 'columns',
  attrs: { ratio: lanes.map(() => 1) },
  content: lanes.map((content) => ({ type: 'column', content })),
});

function card(words: LibraryPresetMessages): NodeJSON {
  return {
    type: 'card',
    attrs: { image: '', alt: words.imageAlt, heading: words.heading, buttonLabel: words.buttonLabel, buttonHref: '' },
    content: text(words.text),
  };
}

function question(words: LibraryPresetMessages): NodeJSON {
  return {
    type: 'toggleHeading',
    attrs: { open: true },
    content: [heading(3, words.question), paragraph(words.answer)],
  };
}

/**
 * The library's Document Editor presets: two columns (each a heading and text), an FAQ (three toggle headings,
 * each open to its answer), a callout holding a button, and two cards in columns. They need the `columns`,
 * `toggleHeading`, `callout`, `button` and `card` features beside the standard kit; an editor without one does
 * not offer the presets holding it. Their text is `messages`' placeholders, and every image and link is empty.
 */
export function documentPresets(messages?: Partial<LibraryPresetMessages>): BlockPreset[] {
  const words = libraryPresetMessages(messages);
  return [
    definePreset({
      id: 'two-columns',
      icon: LayoutGridIcon,
      ...words.twoColumns,
      content: [
        columns([
          [heading(3, words.heading), paragraph(words.text)],
          [heading(3, words.heading), paragraph(words.text)],
        ]),
      ],
    }),
    definePreset({
      id: 'faq',
      icon: CircleQuestionMarkIcon,
      ...words.faq,
      content: [question(words), question(words), question(words)],
    }),
    definePreset({
      id: 'callout-button',
      icon: InfoIcon,
      ...words.calloutButton,
      content: [
        {
          type: 'callout',
          attrs: { variant: 'info' },
          content: [paragraph(words.text), { type: 'button', attrs: { label: words.buttonLabel, href: '' } }],
        },
      ],
    }),
    definePreset({
      id: 'cards-in-columns',
      icon: IdCardIcon,
      ...words.cardsInColumns,
      content: [columns([[card(words)], [card(words)]])],
    }),
  ];
}
