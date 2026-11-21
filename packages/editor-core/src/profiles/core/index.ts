export { EMAIL_KINDS, emailProfile, MAIL_LAYOUT_KINDS, smsProfile } from './profile.js';
export { fromSmsText, measureSmsBody, toSmsText } from './sms-text.js';
export { validate } from './validate.js';
export type {
  EditorEmailBlock,
  EditorProfile,
  EmailBlockKind,
  EmailBounds,
  ProblemKind,
  ProfileProblem,
  VariableDeclaration,
} from './types.js';
