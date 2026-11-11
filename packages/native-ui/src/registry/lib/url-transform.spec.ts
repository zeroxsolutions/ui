import { defaultUrlTransform as defaultUrlTransformOnTheWeb } from 'react-markdown';
import { defaultUrlTransform } from './url-transform';

/** Relative and absolute URLs, each protocol react-markdown allows and some it drops, in mixed case and with a colon after the first `/`, `?` or `#`. */
const URLS = [
  '',
  '/docs',
  './guide.md',
  '../up',
  '#section',
  '?q=1',
  'page',
  'page.html#a:b',
  'search?q=a:b',
  'dir/file:name',
  'http://example.test',
  'https://example.test/path?q=1#top',
  'HTTPS://EXAMPLE.TEST',
  'HtTp://example.test',
  'mailto:someone@example.test',
  'MAILTO:someone@example.test',
  'irc://irc.example.test/channel',
  'ircs://irc.example.test/channel',
  'xmpp:someone@example.test',
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  ' javascript:alert(1)',
  'javascript:alert(1)#a',
  'data:text/html;base64,PHNjcmlwdD4=',
  'DATA:image/png;base64,AAAA',
  'vbscript:msgbox(1)',
  'VBScript:msgbox(1)',
  'file:///etc/passwd',
  'tel:+15551234567',
  'ftp://example.test',
  'https:',
  ':no-scheme',
  'www.example.test',
  'http//missing-colon',
];

describe('defaultUrlTransform', () => {
  it('keeps a relative URL and an allowed protocol, and empties any other protocol', () => {
    expect(defaultUrlTransform('/docs')).toBe('/docs');
    expect(defaultUrlTransform('https://example.test')).toBe('https://example.test');
    expect(defaultUrlTransform('mailto:a@example.test')).toBe('mailto:a@example.test');
    expect(defaultUrlTransform('javascript:alert(1)')).toBe('');
    expect(defaultUrlTransform('data:text/html,x')).toBe('');
  });

  it("answers each URL as react-markdown's own filter does", () => {
    expect(URLS.map((url) => [url, defaultUrlTransform(url)])).toEqual(
      URLS.map((url) => [url, defaultUrlTransformOnTheWeb(url)]),
    );
  });
});
