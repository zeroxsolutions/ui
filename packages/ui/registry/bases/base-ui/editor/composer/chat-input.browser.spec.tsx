import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import type { ChatCommand, ChatMessagePayload } from '@zeroxsolutions/editor-core/composer/index';
import { commandTrigger, mentionTrigger } from './composer-triggers';
import { ChatInput } from './chat-input';

const commands: ChatCommand[] = [
  { id: 'image', name: 'image-gen', label: 'Image' },
  { id: 'video', name: 'video', label: 'Video' },
];
const people = [{ id: 'u1', label: 'Ada' }];
const menu = page.getByTestId('trigger-menu');

/** Draws the chat input on the shipped triggers and puts the caret in it. */
async function mount(): Promise<{ submitted: ChatMessagePayload[] }> {
  const submitted: ChatMessagePayload[] = [];
  const triggers = [mentionTrigger({ people }), commandTrigger(commands)];
  await render(<ChatInput triggers={triggers} onSubmit={(payload) => submitted.push(payload)} />);
  await userEvent.click(page.getByRole('textbox'));
  return { submitted };
}

describe('ChatInput', () => {
  it('sends the typed text and the picked mention on Enter, then clears', async () => {
    const { submitted } = await mount();
    await userEvent.keyboard('a portrait of @Ad');
    await userEvent.click(menu.getByText('Ada'));
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0]).toMatchObject({
      text: expect.stringMatching(/^a portrait of @Ada/),
      tokens: { mention: [{ id: 'u1', label: 'Ada' }], command: [] },
    });
    await expect.element(page.getByRole('textbox')).toHaveTextContent('');
  });

  it('sends nothing for an empty message', async () => {
    const { submitted } = await mount();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(page.getByRole('button', { name: 'Send' }));
    expect(submitted).toEqual([]);
  });

  it('takes Shift+Enter as a new line, not a send', async () => {
    const { submitted } = await mount();
    await userEvent.keyboard('hello{Shift>}{Enter}{/Shift}again');
    expect(submitted).toEqual([]);
    await expect.element(page.getByRole('textbox')).toHaveTextContent('helloagain');
  });

  it('commits a command typed at the start as a pill and sends it under its name', async () => {
    const { submitted } = await mount();
    await userEvent.keyboard('/im');
    await expect.element(menu.getByText('Image')).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByText('/image-gen')).toBeVisible();
    await userEvent.keyboard('a portrait{Enter}');
    await vi.waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].tokens.command).toEqual([{ id: 'image', label: 'Image', name: 'image-gen' }]);
    expect(submitted[0].text).toBe('/image-gen a portrait');
  });
});
