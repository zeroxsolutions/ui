import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CodeEditorPane } from '@chiselart/ui/code-editor-pane';
import { Label } from '@chiselart/ui/label';
import { Switch } from '@chiselart/ui/switch';

const TS_SAMPLE = `import { createHighlighter } from 'shiki';

// Tokenize once, decorate the document.
export async function highlight(code: string, lang: string) {
  const hl = await createHighlighter({ themes: ['chisel-vars'], langs: [lang] });
  return hl.codeToTokens(code, { lang, theme: 'chisel-vars' });
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

const meta: Meta<typeof CodeEditorPane> = {
  title: 'Code Editor/CodeEditorPane',
  component: CodeEditorPane,
};
export default meta;

type Story = StoryObj<typeof CodeEditorPane>;

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

export const ReadOnlyAndWrap: Story = {
  render: () => {
    const [readOnly, setReadOnly] = React.useState(true);
    const [wrap, setWrap] = React.useState(true);
    return (
      <div className="flex w-[640px] flex-col gap-3">
        <div className="flex items-center gap-6">
          <Label className="flex items-center gap-2">
            <Switch checked={readOnly} onCheckedChange={setReadOnly} /> Read-only
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
