import type { ThemeRegistrationRaw } from 'shiki';

/**
 * The Chisel brand syntax theme — a hand-authored Shiki TextMate theme whose
 * token colors are `var(--code-*)` references, NOT concrete hex. The actual hues
 * live in the design-token layer (`styles.css`, `:root` + `.dark`), derived from
 * base-vega's chromatic family, so the palette is brand-linked AND flips
 * light/dark for free — the same CSS var resolves to a different OKLch value
 * under `.dark`, no Shiki dual-theme plumbing required.
 *
 * This replaces Shiki's built-in `createCssVariablesTheme`, which exposes only
 * ~9 token buckets (every other scope collapses to `foreground`). Here ~30
 * TextMate scopes are mapped onto ~16 semantic buckets for a full, legible
 * palette across JS/TS, JSON, Python, HTML/JSX, CSS, shell, and Markdown.
 *
 * Shared by the chat `CodeBlock` (static) and the CodeMirror editor (both read
 * `token.color` straight off `codeToTokens`), so the two surfaces always match.
 */

/** Registered theme name; passed as `theme` to `codeToTokens`. */
export const CODE_THEME_NAME = 'chisel-code';

/** The `--code-*` CSS variables the theme references (must exist in `styles.css`). */
export const CODE_TOKEN_VARS = [
  '--code-fg',
  '--code-comment',
  '--code-keyword',
  '--code-function',
  '--code-string',
  '--code-string-escape',
  '--code-number',
  '--code-constant',
  '--code-type',
  '--code-parameter',
  '--code-property',
  '--code-operator',
  '--code-punctuation',
  '--code-tag',
  '--code-attribute',
  '--code-regex',
  '--code-heading',
  '--code-link',
] as const;

const v = (name: (typeof CODE_TOKEN_VARS)[number]) => `var(${name})`;

export const codeTheme: ThemeRegistrationRaw = {
  name: CODE_THEME_NAME,
  // `type` only seeds Shiki's default fg/bg; we override both, and every token
  // color is a CSS var, so the registered `type` is immaterial to the output.
  type: 'dark',
  fg: v('--code-fg'),
  bg: 'transparent',
  colors: {
    'editor.foreground': v('--code-fg'),
    'editor.background': 'transparent',
  },
  settings: [
    { settings: { foreground: v('--code-fg') } },

    // Comments — muted + italic.
    {
      scope: [
        'comment',
        'punctuation.definition.comment',
        'string.comment',
        'comment.block.documentation',
      ],
      settings: { foreground: v('--code-comment'), fontStyle: 'italic' },
    },

    // Keywords / storage / control flow / modifiers.
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.control.flow',
        'keyword.control.import',
        'keyword.control.conditional',
        'keyword.other',
        'keyword.operator.new',
        'keyword.operator.expression',
        'storage',
        'storage.type',
        'storage.modifier',
        'variable.language',
        'keyword.control.loop',
        'markup.bold markup.heading',
      ],
      settings: { foreground: v('--code-keyword') },
    },

    // Functions / methods.
    {
      scope: [
        'entity.name.function',
        'entity.name.method',
        'support.function',
        'meta.function-call entity.name.function',
        'meta.function-call.generic',
        'variable.function',
      ],
      settings: { foreground: v('--code-function') },
    },

    // Strings.
    {
      scope: [
        'string',
        'string.quoted',
        'string.template',
        'string.unquoted',
        'punctuation.definition.string',
      ],
      settings: { foreground: v('--code-string') },
    },

    // Escapes / interpolation punctuation inside strings.
    {
      scope: [
        'constant.character.escape',
        'constant.other.placeholder',
        'punctuation.definition.template-expression',
      ],
      settings: { foreground: v('--code-string-escape') },
    },

    // Numbers.
    {
      scope: ['constant.numeric', 'keyword.other.unit'],
      settings: { foreground: v('--code-number') },
    },

    // Language constants — booleans, null/None/undefined, builtins.
    {
      scope: [
        'constant.language',
        'constant.language.boolean',
        'constant.language.null',
        'constant.language.undefined',
        'support.constant',
        'variable.other.constant',
      ],
      settings: { foreground: v('--code-constant') },
    },

    // Types / classes / interfaces / builtin types.
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.name.type.class',
        'entity.name.type.interface',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'support.type.builtin',
      ],
      settings: { foreground: v('--code-type') },
    },

    // Function parameters.
    {
      scope: ['variable.parameter', 'meta.parameter', 'parameter'],
      settings: { foreground: v('--code-parameter') },
    },

    // Object properties / keys (incl. JSON keys, YAML keys, CSS prop names).
    {
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'meta.object-literal.key',
        'support.type.property-name',
        'support.type.property-name.json',
        'support.type.property-name.css',
        'entity.name.tag.yaml',
      ],
      settings: { foreground: v('--code-property') },
    },

    // Operators.
    {
      scope: [
        'keyword.operator',
        'keyword.operator.assignment',
        'keyword.operator.arithmetic',
        'keyword.operator.logical',
        'keyword.operator.comparison',
        'storage.type.function.arrow',
      ],
      settings: { foreground: v('--code-operator') },
    },

    // Punctuation — brackets, commas, separators, accessors.
    {
      scope: [
        'punctuation',
        'meta.brace',
        'punctuation.separator',
        'punctuation.terminator',
        'punctuation.accessor',
        'punctuation.definition.parameters',
      ],
      settings: { foreground: v('--code-punctuation') },
    },

    // Markup / HTML / JSX tags.
    {
      scope: [
        'entity.name.tag',
        'punctuation.definition.tag',
        'support.class.component',
      ],
      settings: { foreground: v('--code-tag') },
    },

    // HTML / JSX / CSS attribute names.
    {
      scope: [
        'entity.other.attribute-name',
        'entity.other.attribute-name.class.css',
        'entity.other.attribute-name.id.css',
      ],
      settings: { foreground: v('--code-attribute') },
    },

    // Regular expressions.
    {
      scope: ['string.regexp', 'constant.other.character-class.regexp'],
      settings: { foreground: v('--code-regex') },
    },

    // Markdown headings / bold / links.
    {
      scope: ['markup.heading', 'entity.name.section'],
      settings: { foreground: v('--code-heading'), fontStyle: 'bold' },
    },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    {
      scope: ['markup.underline.link', 'string.other.link', 'constant.other.reference.link'],
      settings: { foreground: v('--code-link') },
    },
  ],
};
