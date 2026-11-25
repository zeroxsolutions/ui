import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { emailProfile, type EditorEmailBlock } from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { EmailEditor } from './email-editor';

const profile = emailProfile({
  variables: [
    { name: 'name', type: 'string', label: 'Name', sampleValue: 'Lan' },
    { name: 'trip_url', type: 'url', label: 'Trip link', sampleValue: 'https://trip.test' },
    { name: 'unsubscribe_url', type: 'url', label: 'Unsubscribe link', sampleValue: 'https://out.test' },
  ],
});

const IMAGE = 'https://i.test/bay.png';

const hero: EditorEmailBlock = {
  id: 'h1',
  key: 'h1',
  type: 'hero',
  attributes: {},
  content: {
    image: IMAGE,
    alt: 'The bay',
    heading: 'Welcome',
    text: 'Your stay',
    buttonLabel: 'Go',
    buttonHref: '{{trip_url}}',
  },
};

const social: EditorEmailBlock = {
  id: 's1',
  key: 's1',
  type: 'socialLinks',
  attributes: {},
  content: { links: [{ label: 'Site', icon: 'https://i.test/site.png', href: 'https://x.test' }] },
};

const footer: EditorEmailBlock = {
  id: 'f1',
  key: 'f1',
  type: 'legalFooter',
  attributes: {},
  content: {
    sender: 'ZUI sends this.',
    reason: 'You joined.',
    address: '1 Harbour Road',
    unsubscribe: '{{unsubscribe_url}}',
    unsubscribeLabel: '',
  },
};

interface Probe {
  editor: IEditor | null;
  reported: EditorEmailBlock[][];
}

function Host({ initial, probe }: { initial: EditorEmailBlock[]; probe: Probe }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="style-nova p-12">
      <EmailEditor
        label="Body"
        profile={profile}
        value={value}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onReady={(editor) => (probe.editor = editor)}
      />
    </div>
  );
}

async function mount(initial: EditorEmailBlock[]): Promise<Probe> {
  const probe: Probe = { editor: null, reported: [] };
  await render(<Host initial={initial} probe={probe} />);
  await vi.waitFor(() => {
    if (!probe.editor) throw new Error('the editor is not ready');
  });
  return probe;
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];
const reportedOf = (probe: Probe, id: string) => last(probe.reported)?.find((block) => block.id === id);

describe("the email editor's library blocks", () => {
  it("edits a hero's heading in place, and undoes the edit from the document", async () => {
    const probe = await mount([hero]);

    const heading = page.getByRole('group', { name: 'Hero' }).getByRole('textbox', { name: 'Heading' });
    await expect.element(heading).toHaveTextContent('Welcome');
    await userEvent.click(heading);
    await userEvent.keyboard('{End} home');
    await vi.waitFor(() => expect(reportedOf(probe, 'h1')?.content.heading).toBe('Welcome home'));
    expect(document.querySelector('[data-type=hero] input')).toBeNull();

    await userEvent.click(page.getByText('Your stay'));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(reportedOf(probe, 'h1')?.content.heading).toBe('Welcome'));
    await expect.element(heading).toHaveTextContent('Welcome');
    expect(reportedOf(probe, 'h1')?.content.text).toBe('Your stay');
  });

  it("changes a hero's image through the popover its image opens, by keyboard, and refuses an insecure one", async () => {
    const probe = await mount([hero]);

    const image = page.getByRole('button', { name: 'Image', exact: true });
    await expect.element(image).toBeInTheDocument();
    (image.element() as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    const popover = page.getByRole('dialog', { name: 'Image' });
    const address = popover.getByRole('textbox', { name: 'Image' });
    await expect.element(address).toHaveFocus();
    await expect.element(address).toHaveTextContent(IMAGE);

    await userEvent.keyboard('{Control>}a{/Control}{Meta>}a{/Meta}http://i.test/new.png{Enter}');
    await expect.element(address).toHaveAttribute('aria-invalid', 'true');
    await expect.element(popover.getByRole('button', { name: 'Apply' })).toBeDisabled();

    await userEvent.keyboard('{Control>}a{/Control}{Meta>}a{/Meta}https://i.test/new.png{Enter}');
    await vi.waitFor(() => expect(reportedOf(probe, 'h1')?.content.image).toBe('https://i.test/new.png'));
    await expect.element(popover).not.toBeInTheDocument();
    await expect.element(image).toHaveFocus();
  });

  it("sets a hero's button link to a url variable in one click, and never draws the address", async () => {
    const probe = await mount([{ ...hero, content: { ...hero.content, buttonHref: 'https://x.test/a' } }]);

    expect(document.querySelector('[data-type=hero]')?.textContent).not.toContain('https://x.test/a');
    await userEvent.click(page.getByRole('button', { name: 'Button link' }));
    await userEvent.click(page.getByRole('dialog', { name: 'Button link' }).getByRole('button', { name: 'Trip link' }));
    await vi.waitFor(() => expect(reportedOf(probe, 'h1')?.content.buttonHref).toBe('{{trip_url}}'));
  });

  it('refuses a javascript: button link in the popover', async () => {
    const probe = await mount([hero]);

    await userEvent.click(page.getByRole('button', { name: 'Button link' }));
    const popover = page.getByRole('dialog', { name: 'Button link' });
    await userEvent.keyboard('{Control>}a{/Control}{Meta>}a{/Meta}javascript:alert(1){Enter}');
    await expect.element(popover.getByRole('textbox', { name: 'Button link' })).toHaveAttribute('aria-invalid', 'true');
    expect(reportedOf(probe, 'h1')?.content.buttonHref ?? '{{trip_url}}').toBe('{{trip_url}}');
  });

  it('draws social links as their icons, adds one from the plus and removes it from its popover', async () => {
    const probe = await mount([social]);

    const site = page.getByRole('button', { name: 'Site' });
    await expect.element(site).toBeVisible();
    expect(site.element().querySelector('img')?.getAttribute('src')).toBe('https://i.test/site.png');

    await userEvent.click(page.getByRole('button', { name: 'Add to Links' }));
    const added = page.getByRole('dialog', { name: 'Links 2' });
    await expect.element(added.getByRole('textbox', { name: 'Label' })).toHaveFocus();
    await userEvent.keyboard('Shop');
    await vi.waitFor(() => expect(reportedOf(probe, 's1')?.content.links).toHaveLength(2));

    await userEvent.click(added.getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => expect(reportedOf(probe, 's1')?.content.links).toEqual(social.content.links));
    await expect.element(page.getByRole('button', { name: 'Shop' })).not.toBeInTheDocument();
  });

  it("edits a legal footer's line in place, and draws its unsubscribe link by its label", async () => {
    const probe = await mount([footer]);

    const block = page.getByRole('group', { name: 'Legal footer' });
    const address = block.getByRole('textbox', { name: 'Postal address' });
    await userEvent.click(address);
    await userEvent.keyboard('{End}, Bayside');
    await vi.waitFor(() => expect(reportedOf(probe, 'f1')?.content.address).toBe('1 Harbour Road, Bayside'));
    expect(block.element().textContent).not.toContain('unsubscribe_url');

    await userEvent.click(block.getByRole('button', { name: 'Unsubscribe link' }));
    const popover = page.getByRole('dialog', { name: 'Unsubscribe link' });
    await expect
      .element(popover.getByRole('textbox', { name: 'Unsubscribe link' }))
      .toHaveTextContent('Unsubscribe link');
  });

  it('draws a spacer at the height the email gives it', async () => {
    await mount([{ id: 'g1', key: 'g1', type: 'spacer', attributes: { height: 'large' }, content: {} }]);

    const gap = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('[data-slot=email-spacer]');
      if (!found) throw new Error('no spacer');
      return found;
    });
    expect(gap.getBoundingClientRect().height).toBe(32);
    expect(gap.textContent).toContain('Large, 32px');
  });
});
