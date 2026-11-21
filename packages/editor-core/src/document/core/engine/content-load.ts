/**
 * The transaction meta a host's content load carries, so a plugin guarding the author's edits can let
 * the host replace the document. Only the facade's `setContent` sets it; the built-in `setContent`
 * command does not, because a feature running it acts for the author.
 */
export const CONTENT_LOAD_META = 'zeroxContentLoad';
