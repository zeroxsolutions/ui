import { expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { DESKTOP, describeVisual, MOBILE } from '../../../../test/visual';
import { DocumentEditorDemo } from '../examples/document-editor-demo';
import { EditorColumnsDemo } from '../examples/editor-columns-demo';
import { EditorImageDemo } from '../examples/editor-image-demo';
import { EditorSectionDemo } from '../examples/editor-section-demo';
import { EditorTableDemo } from '../examples/editor-table-demo';
import { EmailEditorDemo } from '../examples/email-editor-demo';

const BOTH = [DESKTOP, MOBILE] as const;

/** Clicks into the text `text`, which puts the caret in its block and shows that block's toolbar. */
async function clickInto(text: string): Promise<undefined> {
  await userEvent.click(page.getByText(text, { exact: true }));
  await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();
  return undefined;
}

/** Selects the paragraph holding `text`, which shows the bubble menu over it. */
async function select(text: string): Promise<void> {
  await userEvent.tripleClick(page.getByText(text, { exact: true }));
  await expect.element(page.getByRole('button', { name: 'Text color' })).toBeVisible();
}

const LEAD = 'Select text to format it, or type / on an empty line to add a block.';

// Each editor's surfaces at rest are its demo's capture in `examples.visual.spec.tsx`; these are the ones a
// reader only meets once they act on it.
describeVisual('the editors, acted on', [
  {
    name: 'document-bubble-menu',
    window: true,
    widths: BOTH,
    render: () => <DocumentEditorDemo />,
    arrange: () => select(LEAD).then(() => undefined),
  },
  {
    name: 'document-color-menu',
    window: true,
    render: () => <DocumentEditorDemo />,
    arrange: async () => {
      await select(LEAD);
      await userEvent.click(page.getByRole('button', { name: 'Text color' }));
      await expect.element(page.getByRole('dialog', { name: 'Text color' })).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'document-slash-menu',
    window: true,
    render: () => <DocumentEditorDemo />,
    arrange: async () => {
      await userEvent.click(page.getByText('An Bang beach in the morning', { exact: true }));
      await userEvent.keyboard('{End}{Enter}{Enter}/');
      await expect.element(page.getByRole('listbox').first()).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'document-block-menu',
    window: true,
    render: () => <DocumentEditorDemo />,
    arrange: async () => {
      await userEvent.hover(page.getByText(LEAD, { exact: true }));
      await userEvent.click(page.getByTestId('grip-vertical-icon'));
      await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'image-toolbar-and-handles',
    window: true,
    widths: BOTH,
    render: () => <EditorImageDemo />,
    arrange: async () => {
      await userEvent.click(page.getByRole('img', { name: 'A red paper lantern on an amber wall' }));
      await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'columns-toolbar',
    window: true,
    widths: BOTH,
    render: () => <EditorColumnsDemo />,
    arrange: () => clickInto('Write the document in the editor.'),
  },
  {
    name: 'table-toolbar',
    window: true,
    widths: BOTH,
    render: () => <EditorTableDemo />,
    arrange: () => clickInto('Homestay'),
  },
  {
    name: 'section-toolbar',
    window: true,
    widths: BOTH,
    render: () => <EditorSectionDemo />,
    arrange: () => clickInto('A section of the page'),
  },
  {
    name: 'section-background-menu',
    window: true,
    render: () => <EditorSectionDemo />,
    arrange: async () => {
      await clickInto('A section of the page');
      await userEvent.click(page.getByRole('button', { name: 'Background' }));
      await expect.element(page.getByRole('dialog', { name: 'Background' })).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'email-bubble-menu',
    window: true,
    widths: BOTH,
    render: () => <EmailEditorDemo />,
    arrange: () => select('Everything your team needs to write and send mail, in one place.').then(() => undefined),
  },
]);
