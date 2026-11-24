import type { EmailBlockKind, ProblemKind, ProfileProblem } from '@zeroxsolutions/editor-core/profiles/index';
import type { RenderProblem, RenderProblemKind } from '@zeroxsolutions/editor-core/template/email/index';

/** The attributes the email block menu sets. */
export type EmailBlockAttribute = 'align' | 'spaceAfter' | 'tone' | 'width';

/** The values those attributes take. */
export type EmailBlockAttributeValue =
  | 'left'
  | 'center'
  | 'right'
  | 'small'
  | 'medium'
  | 'large'
  | 'default'
  | 'muted'
  | 'inline'
  | 'full';

/** What the SMS meter reads: the units used of a segment's limit, and the segments against the profile's cap. */
export interface SmsMeterReading {
  units: number;
  limit: number;
  encoding: 'gsm7' | 'ucs2';
  segments: number;
  /** The most segments the profile allows; the default wording names the segments only when it is above one. */
  maxSegments: number;
}

/** The words of a product's own block; its definition's labels where one is absent. */
export interface CustomBlockMessages {
  /** Its name in the slash menu and over its view. */
  title?: string;
  /** Its line in the slash menu. */
  description?: string;
  /** Each field's name, by the field's name in the definition. */
  fields?: Readonly<Record<string, string>>;
  /** Each attribute's name, by the attribute's name in the definition. */
  attributes?: Readonly<Record<string, string>>;
  /** Each choice's values' names, by the attribute's name, then the value. */
  values?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * Every string the email and SMS editors draw. A host passes some of them as `messages`, in its own catalogue's
 * words, and the rest stay `DEFAULT_PROFILE_MESSAGES`'s English.
 */
export interface ProfileEditorMessages {
  /** What a problem says to the author, naming the variable it is about. */
  problem(problem: ProfileProblem): string;
  /** What a problem the renderer met says, and where it is; `block` is the place in the document of its block. */
  renderProblem(problem: RenderProblem, block?: number): string;
  /** The SMS meter's count. */
  smsMeter(reading: SmsMeterReading): string;
  /** The name of the button that shows a problem's messages. */
  problemMarker: string;
  /** The title of the email preview's frame. */
  emailPreview: string;
  /** The tab that shows the email editor where the editor and the preview take turns. */
  editTab: string;
  /** The tab that shows the email preview there. */
  previewTab: string;
  /** The hint an empty email line shows. */
  emptyLine: string;
  /** The hint after a typed `/` before anything follows it. */
  slashSearch: string;
  /** What the slash menu says when nothing matches. */
  slashEmpty: string;
  /** The slash menu's heading over the email blocks. */
  blockGroup: string;
  /** The SMS slash menu's heading over the variables it inserts. */
  variableGroup: string;
  /** Each email block's name and line in the slash menu. */
  blocks: Readonly<Record<EmailBlockKind, { title: string; description: string }>>;
  bold: string;
  italic: string;
  removeLink: string;
  /** The link control in the toolbar, the bubble and a button's block menu, and the heading of its popover. */
  link: string;
  /** The hint the link popover's address field shows while it is empty. */
  linkPlaceholder: string;
  /** The heading over the declared link variables the popover offers. */
  linkVariables: string;
  /** The popover's button that sets the link. */
  applyLink: string;
  /** The toolbar's variable picker. */
  variable: string;
  findVariable: string;
  /** What a variable picker, or the `{{` menu, says when no declaration matches. */
  noVariables: string;
  blockActions: string;
  /** The block menu's submenu of the kinds a block can become. */
  turnInto: string;
  /** The block menu's submenu heading of each attribute. */
  attributes: Readonly<Record<EmailBlockAttribute, string>>;
  attributeValues: Readonly<Record<EmailBlockAttributeValue, string>>;
  /** The block menu's submenu of the lane shares. */
  columns: string;
  duplicate: string;
  delete: string;
  /** Why a block menu item is disabled in locked structure. */
  deleteLocked: string;
  /** Why a block menu item is disabled on a block the host requires. */
  deleteRequired: string;
  /** Why Duplicate is disabled on a block of a kind the profile does not let the author add. */
  kindNotAllowed: string;
  buttonLabel: string;
  /** The heading over an HTML block's source. */
  htmlBlock: string;
  /** What a stored block of a type no feature reads shows in its place. */
  unknownBlock(type: string): string;
  /** The words of the product's own blocks, by type. */
  customBlocks?: Readonly<Record<string, CustomBlockMessages>>;
}

const PROBLEMS: Readonly<Record<ProblemKind, string>> = {
  'variable-undeclared': 'This variable is not declared',
  'href-invalid': 'The link must start with https://, http://, mailto: or a link variable',
  'link-invalid': 'This link must start with https://, http://, mailto: or a link variable',
  'required-variable-not-printed': 'A required variable is not used',
  'markup-malformed': 'The formatting is not closed',
  'block-not-allowed': 'This block is not allowed here',
  'unknown-block-type': 'This block is of an unknown type',
  'block-nested-too-deep': 'A block with lanes cannot sit inside a lane',
  'lanes-mismatch': 'The columns do not match their widths',
  'lanes-count': 'This block holds more or fewer lanes than it takes',
  'content-invalid': 'This block holds something its type does not read',
  'attributes-invalid': 'This block has a setting its type does not take',
  'text-empty': 'This block is empty',
  'text-too-long': 'This text is too long',
  'list-too-long': 'This list has too many items',
  'too-many-blocks': 'The email has too many blocks',
  'block-not-carried': 'The email keeps only the text of this block',
  'sms-segment-exceeded': 'The message is longer than allowed',
  'sms-placeholder-malformed': 'A variable is not closed',
};

const RENDER_PROBLEMS: Readonly<Record<RenderProblemKind, string>> = {
  'variable-missing': 'This variable has no sample value to preview',
  'href-invalid': 'The link must start with https://, http://, mailto: or a link variable',
  'href-scheme-refused': 'The link is not a web or mail address',
  'unknown-block-type': 'This block is of an unknown type',
  'block-nested-too-deep': 'A block with lanes cannot sit inside a lane',
  'lanes-count': 'This block holds more or fewer lanes than it takes',
};

const ENCODINGS = { gsm7: 'GSM-7', ucs2: 'UCS-2' } as const;

/** The editors' English, which a host's `messages` are merged over. */
export const DEFAULT_PROFILE_MESSAGES: ProfileEditorMessages = {
  problem(problem) {
    const message = PROBLEMS[problem.kind];
    return problem.name === undefined ? message : `${message}: {{${problem.name}}}`;
  },
  renderProblem(problem, block) {
    const message = RENDER_PROBLEMS[problem.kind];
    const named =
      problem.name === undefined
        ? ''
        : problem.kind === 'unknown-block-type'
          ? `: ${problem.name}`
          : `: {{${problem.name}}}`;
    const where =
      problem.region !== undefined
        ? ` (in the ${problem.region})`
        : problem.blockId === null
          ? ' (in the subject or preheader)'
          : block !== undefined
            ? ` (block ${block})`
            : '';
    return `${message}${named}${where}`;
  },
  smsMeter({ units, limit, encoding, segments, maxSegments }) {
    const count = `${units} / ${limit} ${ENCODINGS[encoding]}`;
    return maxSegments > 1 ? `${count} - ${segments} of ${maxSegments} segments` : count;
  },
  problemMarker: 'Problem',
  emailPreview: 'Email preview',
  editTab: 'Edit',
  previewTab: 'Preview',
  emptyLine: "Type '/' for blocks",
  slashSearch: 'Type to search',
  slashEmpty: 'No matching blocks',
  blockGroup: 'Email',
  variableGroup: 'Variables',
  blocks: {
    paragraph: { title: 'Text', description: 'A paragraph of text' },
    button: { title: 'Button', description: 'A button that opens a link' },
    code: { title: 'Code', description: 'Text set in a fixed-width font' },
    list: { title: 'Bulleted list', description: 'A bulleted list of short lines' },
    callout: { title: 'Callout', description: 'Text set apart in a panel' },
    divider: { title: 'Divider', description: 'A rule between two parts' },
    columns: { title: 'Columns', description: 'Two to four lanes side by side' },
    html: { title: 'HTML', description: 'Markup the email prints as written' },
  },
  bold: 'Bold',
  italic: 'Italic',
  removeLink: 'Remove link',
  link: 'Link',
  linkPlaceholder: 'URL or {{variable}}',
  linkVariables: 'Variables',
  applyLink: 'Apply',
  variable: 'Variable',
  findVariable: 'Find a variable',
  noVariables: 'No variables found',
  blockActions: 'Block actions',
  turnInto: 'Turn into',
  attributes: { align: 'Align', spaceAfter: 'Space after', tone: 'Tone', width: 'Width' },
  attributeValues: {
    left: 'Left',
    center: 'Center',
    right: 'Right',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    default: 'Default',
    muted: 'Muted',
    inline: 'Fit the label',
    full: 'Full width',
  },
  columns: 'Lanes',
  duplicate: 'Duplicate',
  delete: 'Delete',
  deleteLocked: 'The structure is locked: only text and variables change',
  deleteRequired: 'This block is required',
  kindNotAllowed: 'This kind of block is not allowed here',
  buttonLabel: 'Button label',
  htmlBlock: 'HTML',
  unknownBlock: (type) => `A ${type} block this editor cannot show`,
};

/** `messages` over the English, so a host passing some of them keeps the rest. */
export function profileMessages(messages?: Partial<ProfileEditorMessages>): ProfileEditorMessages {
  return messages ? { ...DEFAULT_PROFILE_MESSAGES, ...messages } : DEFAULT_PROFILE_MESSAGES;
}
