/** The protocols a URL may name and still be kept: the web, IRC, mail and XMPP. */
const SAFE_PROTOCOL = /^(https?|ircs?|mailto|xmpp)$/i;

/**
 * `value` when it is relative or names a safe protocol (http, https, irc, ircs, mailto or xmpp, in any case),
 * and an empty string otherwise, so `javascript:`, `data:` and `vbscript:` URLs never open. A colon after the
 * first `/`, `?` or `#` does not end a protocol, so `page?q=a:b` stays relative. It answers as react-markdown's
 * `defaultUrlTransform` does, which the web's markdown view filters its links and images through.
 */
function defaultUrlTransform(value: string): string {
  const colon = value.indexOf(':');
  const questionMark = value.indexOf('?');
  const numberSign = value.indexOf('#');
  const slash = value.indexOf('/');
  const relative =
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign);
  return relative || SAFE_PROTOCOL.test(value.slice(0, colon)) ? value : '';
}

export { defaultUrlTransform };
