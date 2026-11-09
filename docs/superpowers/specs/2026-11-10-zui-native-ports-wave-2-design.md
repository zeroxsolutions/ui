# zui native, wave 2: the inputs

The first spec, `2026-11-09-zui-native-zui-ports-design.md`, governs this wave: same names, parts and props,
same `cn-` tokens, static icons, all 16 registries, a demo, a docs page and a spec per item. This one decides
what that spec left open for the seven items of wave 2: number-field, tag-input, language-toggle-group,
language-combobox, frontmatter-form, emoji-appearance-toggle-group and command-menu.

Every primitive they compose is in the native registries already: input-group, input, badge, button, field,
toggle-group, combobox, command and dialog. None composes a wave 1 item. Only number-field writes a zui slot.

## Per item

**number-field.**

- Parts: `NumberField` and `NumberFieldInput`, over InputGroup, with the web's props.
- `evaluateExpression` (`lib/expr-eval.ts`) is pure and ships as a native registry lib, unchanged.
- Committing and cancelling:
  - The return key commits (`onSubmitEditing`), and so does leaving the field.
  - ArrowUp and ArrowDown step, and Escape drops the draft, through `onKeyPress`. That works where the
    platform reports those keys: the web and a hardware keyboard.
  - A touch keyboard has no such key, so on a phone `step` has no trigger and leaving the field always
    commits. The docs page says so, and shows composing step buttons from InputGroup addons where a screen
    needs them.
- The keyboard is iOS's `numbers-and-punctuation`, since its decimal pad has no minus sign and no operators.
- `cn-number-field` redraws InputGroup's focus ring for the web's input slot. It goes in `UNDRAWN_SLOTS` with
  the reason password-input's has: native InputGroup rings itself from its focused state.

**tag-input.**

- Parts, props and the add rule (trimmed, non-empty, no duplicate) as on the web.
- A tag is added three ways:
  - by the return key, with focus kept in the field so the next tag can be typed;
  - by a comma, read from the text as it changes rather than as a key;
  - by leaving the field.
- Backspace in an empty field removes the last tag through `onKeyPress`. Android's soft keyboards do not
  report Backspace in an empty field, so there a tag goes by its own remove button. The docs page says so.
- The web's animated X becomes lucide's static `X`.

**language-toggle-group.** A thin wrapper over the native ToggleGroup in single mode. It ignores a press that
would leave nothing selected, as the web's does.

**language-combobox.**

- The native Combobox takes `{ value, label }` items and a string value, so the wrapper maps
  `LanguageOption` onto those.
- `options`, `kind` and `locales` keep the web's meaning.
- The code-language table and its aliases (`lib/language-options`) are copied into a native lib. A spec checks
  that its ids, labels and aliases equal the web table's, since a reader who picks a language on one platform
  and finds it missing or renamed on the other gets a wrong answer.
- The web table's icons are DOM svg components from `@zeroxsolutions/icons`, which React Native cannot draw.
  So the native table has none. An `icon` a caller passes on an option is drawn where the native Combobox
  draws a non-text child.
- Locale labels:
  - The web reads them from `Intl.DisplayNames`, inside a try that falls back to the code.
  - Hermes's Intl document does not list `Intl.DisplayNames` on either platform
    (`facebook/hermes`, `doc/IntlAPIs.md`). So in a native app the fallback is the likely path, and a locale
    shows as its code.
  - The port keeps the web's code. The docs page tells a caller to pass `options` with their own labels, and
    the Expo Go check records what the device shows.

**frontmatter-form.**

- Parts and context as on the web.
- `FrontmatterFormFieldControl` clones its `render` element with:
  - the string value and `onChangeText`;
  - `aria-invalid`;
  - the label's `nativeID` through `aria-labelledby`, in place of `htmlFor` and `id`;
  - the error through the control's `accessibilityHint`, since React Native does not announce
    `aria-invalid`.
- The web label's container-query classes are dropped.

**emoji-appearance-toggle-group.**

- Each swatch draws U+1F600 in its style through a `fluent-emoji` native registry lib:
  - The lib builds `https://fluent-emoji.zeroxsolutions.com/<style>/<codepoint>.<ext>` the way the package's
    `fluentEmojiUrl` does: lowercase hex joined by `-`, with `3d` and `anim` as webp and `flat`, `modern` and
    `mono` as svg.
  - A spec checks it against the package's builder over a set of glyphs that includes a ZWJ sequence and a
    flag.
  - Its `FluentEmoji` part draws the glyph as text when the image fails, as the web's does.
- The image is drawn by `expo-image`, not React Native's `Image`. This changes the first spec:
  - Plain `Image` lists no svg among its formats (reactnative.dev/docs/image), and three of the five styles
    are svg.
  - On iOS, plain `Image` reads webp only when it is bundled with the app.
  - `expo-image` lists svg, webp and animated images on both platforms (docs.expo.dev/versions/latest/sdk/image).
- `mono` takes the foreground colour through `tintColor`, as the web inverts it in dark mode.

**command-menu.**

- `CommandMenu` wraps the native CommandDialog and Command with the web's default title and description, and
  `CommandMenuItem` requires `value` and closes the menu on select.
- The web's `use-command-shortcut` hook is not ported, since a phone has no Cmd+K. The demo opens the menu
  from a button.

## Tests

Each item's spec follows the testing skills, which wave 1's specs were brought into line with in `cdd8c446`:

- It asserts what a reader gets and what a press or typed text calls. It never asserts a class.
- Every interaction goes through `userEvent`.
- A case is seen to fail before the code that passes it.

The case lists, per item:

- **number-field:** an expression commits on return and on blur, clamped; `mixed` and `displayText`.
- **tag-input:** each of the three ways to add; the add rule.
- **frontmatter-form:** a typed value reaches `onValueChange`; an invalid field names its error to a screen
  reader.
- **The two libs:** the table check and the URL check above.

What jest cannot show runs in a real browser, as a case in `registry-native-ui-docs-zone-e2e` driving the
demo in its preview frame:

- the key handling only React Native for Web reports (number-field's Escape and arrows, tag-input's
  Backspace);
- wave 1's three open cases: editor-tab's close not activating its tab, and chat-suggestion-item's and
  copy-button's prevented default. Their demos gain the state that shows each one.

A behaviour only a device shows is on the Expo Go list in the pull request:

- the soft keyboards;
- the locale labels on Hermes;
- the svg and animated emoji;
- CommandDialog staying above the keyboard.

How each item looks stays a screenshot check in vega and nova, since the repo has no visual regression suite.

## Not in this wave

- The emoji catalog (wave 4).
- Native code-language icons.
- A hardware-keyboard shortcut for command-menu.
