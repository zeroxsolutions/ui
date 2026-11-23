# Variables in every text field

Decided 2026-11-23 with the owner. Extends `2026-11-23-email-sms-on-the-document-frame-design.md` and
revises the 2026-11-20 rule that a link is "a declared `url` variable only".

## Why

A variable is text the server fills in. The owner's words: an author inserts a variable anywhere there is
text, and the editor detects it. A link can be a fixed URL, a URL with a variable inside it (an access
token, a place id), or a variable on its own; a link's label and a button's label can hold variables too
("Continue {{place}}"). Markdown and email both allow this. The 0.1.x editor offered variables only in
rich text (paragraph, list, callout, lanes) and limited every link to one `url` variable.

## Goals

1. Every text field in the email and SMS profiles takes `{{name}}` tokens, inserted by typing `{{` (the
   variable menu opens, filtered by what follows) or from the toolbar's variable control, and every token
   is detected where it is shown: declared tokens drawn as tokens, undeclared ones marked with the
   destructive token and a `variable-undeclared` problem.
2. The fields and how each shows its tokens:

   | Field                                                    | Shown as                                                            |
   | -------------------------------------------------------- | ------------------------------------------------------------------- |
   | Paragraph, list item, callout, lane text, a link's label | variable chips (unchanged)                                          |
   | A button's label, a link's href, a button's href         | one shared single-line variable text field: chips, `{{` menu        |
   | Code block, HTML block                                   | tokens highlighted in place, undeclared ones marked; `{{` completes |

3. An href is a string that may hold tokens. It is valid when, trimmed, it is not empty and either starts
   with a literal `https://`, `http://` or `mailto:` (the renderer's existing scheme list), or starts with
   a token whose declared type is `url`. A token anywhere else in the href may be of any declared type.
4. The renderer fills an href's leading `url` token as it is (HTML-escaped, its value's scheme checked as
   today) and URL-encodes every other token's value (`encodeURIComponent`), so a value with `&`, `?`, `#`
   or a space cannot break the link. Labels, code and HTML are filled as they are today.
5. Problems: `href-not-url-variable` and `link-not-url-variable` are replaced by `href-invalid` and
   `link-invalid` (the href is empty or starts with neither a scheme nor a `url` token); undeclared tokens
   anywhere stay `variable-undeclared`. The renderer's `href-not-url-variable` becomes `href-invalid`;
   `href-scheme-refused` stays for a `url` value whose scheme is refused.

## Non-goals

- Variables in the document profile (the plain Document Editor has no declarations).
- Formatting a variable's value (dates, money): the server's, as before.

## Wire

Unchanged shapes: every field is still a string holding `{{name}}` tokens. The inline markup's link
becomes `[label](href)` with `href` as above; `[label]({{name}})` reads exactly as before, so stored
templates need no migration. `InlineLink` carries `href: string` in place of `variable: string`; the
editor's `emailLink` mark carries `href`. A stored `emailLink{variable}` reads as `href: '{{variable}}'`.

## Testing

- Markup: parse and print round-trip for a fixed href, an href with an inner token, a single-token href,
  and a label with a token; the old `[l]({{n}})` form parses to the same run as before.
- Validate: one case per href rule (empty, fixed https, http, mailto, leading url token, leading
  non-url token, inner token of any type, undeclared inner token).
- Renderer: an inner token's value `a&b c` is encoded as `a%26b%20c`; a leading url token is not encoded.
- Browser: typing `{{` in a button label, a link href, a code block and an HTML block opens the variable
  menu and inserts the token; an undeclared token in each is marked.
