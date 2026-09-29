/** Font extension -> CSS `format()` hint. */
const FORMAT_BY_EXTENSION: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
  eot: 'embedded-opentype',
};

/** The CSS `format()` hint for a font URL, read off its extension; `undefined` for an unknown one. */
function formatOf(src: string): string | undefined {
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return ext ? FORMAT_BY_EXTENSION[ext] : undefined;
}

export { formatOf };
