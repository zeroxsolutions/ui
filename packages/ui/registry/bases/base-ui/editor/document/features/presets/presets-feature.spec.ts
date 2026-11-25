import { describe, expect, it } from 'vitest';
import { definePreset } from '@zeroxsolutions/editor-core/blocks/index';
import { EditorError } from '@zeroxsolutions/editor-core/document/core/index';
import { presetsFeature } from './presets-feature';

const preset = (id: string, label: string) =>
  definePreset({ id, label, content: [{ type: 'paragraph', content: [{ type: 'text', text: label }] }] });

describe('presetsFeature', () => {
  it('refuses two presets with one id, naming the id', () => {
    const build = () => presetsFeature([preset('intro', 'Intro'), preset('outro', 'Outro'), preset('intro', 'Again')]);

    expect(build).toThrow(EditorError);
    expect(build).toThrow(expect.objectContaining({ code: 'editor.presets.duplicate_id' }));
    expect(build).toThrow(/"intro"/);
  });

  it('takes presets whose ids differ', () => {
    expect(() => presetsFeature([preset('intro', 'Intro'), preset('outro', 'Outro')])).not.toThrow();
  });
});
