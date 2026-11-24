import type { EmailNode, EmailPrimitives } from './primitives/nodes.js';
import type { Region } from './region.js';

/** What a layout frames: the blocks already drawn, the inbox lines, and the product's own props. */
export interface LayoutInput<Props> {
  /** The body's blocks, each in its own row. */
  readonly body: readonly EmailNode[];
  /** Each region's blocks; none where the render was given none. */
  readonly regions: Readonly<Record<Region, readonly EmailNode[]>>;
  /**
   * Text, filled with a person's values: drawn through `h.text`, `h.preheader` or a tagged `` h.raw`...` ``, which
   * escape it; never through `h.raw({ markup })`, which writes trusted markup as given.
   */
  readonly subject: string;
  /** Empty where the template has none; filled with a person's values, as `subject` is. */
  readonly preheader: string;
  readonly locale: string;
  readonly props: Props;
  /**
   * The primitives, printing the product's props as given; a link checks its scheme as a block's does (https,
   * http, mailto), and an image may be an https, http, `data:image/` or `cid:` address.
   */
  readonly h: EmailPrimitives;
}

/**
 * The frame around the body, as primitives: the renderer writes the document, its head and its `<body>`
 * around them. Every look it has is a rule of the renderer's stylesheet, by the classes it gives.
 */
export type EmailLayout<Props> = (input: LayoutInput<Props>) => EmailNode | readonly EmailNode[];

/** What the default layout prints that only the product knows. */
export interface DefaultLayoutProps {
  /** A hosted PNG at 2x: mail clients render no SVG, and images are off by default, so the alt text is read first. */
  readonly logo: { readonly url: string; readonly alt: string; readonly width: number };
  /** In the send's locale, top to bottom: legal name and address, support address, the notice. */
  readonly footer: readonly string[];
}

/**
 * The design's mail frame: the preheader, then a bordered card holding the logo top left, the header, the
 * blocks, and under a rule the footer's blocks and its lines. On the text arm the footer's blocks and lines
 * read as one paragraph.
 */
export const defaultLayout: EmailLayout<DefaultLayoutProps> = ({ body, regions, preheader, props, h }) => [
  h.preheader({ text: preheader }),
  h.card({}, [
    h.section({ class: 'zx-logo' }, [h.image({ src: props.logo.url, alt: props.logo.alt, width: props.logo.width })]),
    h.region('header', regions.header),
    h.region('body', body),
    h.section({ class: 'zx-footer' }, [
      h.region('footer', regions.footer, { textEnd: 'line' }),
      ...props.footer.map((line) => h.text({ class: 'zx-footer-line', text: line, textEnd: 'line' })),
    ]),
  ]),
];
