import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { CodeEditorPane } from '@zeroxsolutions/ui/components/code-editor-pane';
import { Label } from '@zeroxsolutions/ui/components/ui/label';
import { Switch } from '@zeroxsolutions/ui/components/ui/switch';

const TS_SAMPLE = `import { createHighlighter } from 'shiki';

// Tokenize once, decorate the document.
export async function highlight(code: string, lang: string) {
  const hl = await createHighlighter({ themes: ['github-dark'], langs: [lang] });
  return hl.codeToTokens(code, { lang, theme: 'github-dark' });
}

const answer = 42;
const ready = answer > 0 && lang !== 'plaintext';
`;

const PY_SAMPLE = `import json


def load_skill(path: str) -> dict:
    """Read a SKILL.md bundle manifest."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    print(load_skill("manifest.json"))
`;

/**
 * `CodeEditorPane` is a single text-editing surface built on CodeMirror 6 with
 * Shiki syntax highlighting. It behaves as a controlled or uncontrolled textbox
 * (`value` / `defaultValue` / `onValueChange`), while `language`, `readOnly`, and
 * `wrap` reconfigure the live editor without remounting. The editor fills the
 * height it is given, so each story sizes the wrapper element.
 */
const meta: Meta<typeof CodeEditorPane> = {
  title: 'Code Editor/CodeEditorPane',
  component: CodeEditorPane,
};
export default meta;

type Story = StoryObj<typeof CodeEditorPane>;

/** A TypeScript document highlighted live, driven by controlled `value` state. */
export const TypeScript: Story = {
  render: () => {
    const [value, setValue] = React.useState(TS_SAMPLE);
    return (
      <div className="h-[420px] w-[640px]">
        <CodeEditorPane
          value={value}
          onValueChange={setValue}
          language="typescript"
        />
      </div>
    );
  },
};

/** The same surface highlighting a Python document, showing the `language` swap. */
export const Python: Story = {
  render: () => {
    const [value, setValue] = React.useState(PY_SAMPLE);
    return (
      <div className="h-[360px] w-[640px]">
        <CodeEditorPane
          value={value}
          onValueChange={setValue}
          language="python"
        />
      </div>
    );
  },
};

/**
 * Toggles the `readOnly` and `wrap` props live against a JSON document; the long
 * single line contrasts soft-wrapping with horizontal scrolling.
 */
export const ReadOnlyAndWrap: Story = {
  render: () => {
    const [readOnly, setReadOnly] = React.useState(true);
    const [wrap, setWrap] = React.useState(true);
    return (
      <div className="flex w-[640px] flex-col gap-3">
        <div className="flex items-center gap-6">
          <Label className="flex items-center gap-2">
            <Switch checked={readOnly} onCheckedChange={setReadOnly} />{' '}
            Read-only
          </Label>
          <Label className="flex items-center gap-2">
            <Switch checked={wrap} onCheckedChange={setWrap} /> Wrap
          </Label>
        </div>
        <div className="h-[300px]">
          <CodeEditorPane
            defaultValue={`{ "name": "demo", "description": "${'a very long single line that demonstrates soft wrapping versus horizontal scrolling — toggle the switch above to compare the two behaviours in the editor surface'}" }`}
            language="json"
            readOnly={readOnly}
            wrap={wrap}
          />
        </div>
      </div>
    );
  },
};
