import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import {
  LanguageSwitcher,
  type LanguageOption,
} from '@zeroxsolutions/ui/components/language-switcher';

/**
 * A controlled, i18n-agnostic language selector. The **display form** is the
 * `form` prop — `"dropdown"` (default), `"segmented"`, or `"icon"` — and the
 * **domain** is the `kind` prop: `"locale"` for UI locales (native names via
 * `Intl.DisplayNames`) or `"code"` for programming languages (labelled and
 * carrying their full-color Material file-type icon). `searchable` applies to the
 * `dropdown`/`icon` forms only. The consumer owns `value` and every visible
 * string; pass `options` to override the built-in `kind` data.
 */
const meta: Meta = {
  title: 'Components/LanguageSwitcher',
};
export default meta;

type Story = StoryObj;

const LOCALES = ['en', 'vi', 'ja', 'fr', 'de'];

const CUSTOM_LOCALES: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: '日本語' },
];

const SMALL_CODE: LanguageOption[] = [
  { value: 'javascript', label: 'JS' },
  { value: 'typescript', label: 'TS' },
  { value: 'json', label: 'JSON' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Every form × both kinds, each independently controlled. */
export const Overview: Story = {
  render: () => {
    const [locale, setLocale] = useState('en');
    const [locale2, setLocale2] = useState('vi');
    const [locale3, setLocale3] = useState('ja');
    const [code, setCode] = useState('typescript');
    const [code2, setCode2] = useState('javascript');
    const [code3, setCode3] = useState('python');
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">kind=&quot;locale&quot;</h3>
          <Row label="Dropdown">
            <LanguageSwitcher
              form="dropdown"
              kind="locale"
              value={locale}
              onValueChange={setLocale}
              locales={LOCALES}
            />
          </Row>
          <Row label="Segmented">
            <LanguageSwitcher
              form="segmented"
              kind="locale"
              value={locale2}
              onValueChange={setLocale2}
              options={CUSTOM_LOCALES}
            />
          </Row>
          <Row label="Icon">
            <LanguageSwitcher
              form="icon"
              kind="locale"
              value={locale3}
              onValueChange={setLocale3}
              locales={LOCALES}
            />
          </Row>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">kind=&quot;code&quot;</h3>
          <Row label="Dropdown (searchable)">
            <LanguageSwitcher
              form="dropdown"
              kind="code"
              value={code}
              onValueChange={setCode}
            />
          </Row>
          <Row label="Segmented (custom set)">
            <LanguageSwitcher
              form="segmented"
              kind="code"
              value={code2}
              onValueChange={setCode2}
              options={SMALL_CODE}
            />
          </Row>
          <Row label="Icon">
            <LanguageSwitcher
              form="icon"
              kind="code"
              value={code3}
              onValueChange={setCode3}
            />
          </Row>
        </div>
      </div>
    );
  },
};

/**
 * The dropdown a code block uses: `kind="code"` is searchable by default and
 * lists every highlightable language with its Material icon. `form` defaults to
 * `dropdown`, so it can be omitted.
 */
export const CodeDropdown: Story = {
  render: () => {
    const [value, setValue] = useState('typescript');
    return <LanguageSwitcher kind="code" value={value} onValueChange={setValue} />;
  },
};

/** A locale switcher for an app header, rendered as native language names. */
export const LocaleDropdown: Story = {
  render: () => {
    const [value, setValue] = useState('en');
    return (
      <LanguageSwitcher
        kind="locale"
        value={value}
        onValueChange={setValue}
        locales={LOCALES}
      />
    );
  },
};

/** Two-to-four locales as an inline segmented control — the literal "switch". */
export const LocaleSegmented: Story = {
  render: () => {
    const [value, setValue] = useState('en');
    return (
      <LanguageSwitcher
        form="segmented"
        kind="locale"
        value={value}
        onValueChange={setValue}
        options={CUSTOM_LOCALES}
      />
    );
  },
};
