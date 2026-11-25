import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp } from 'vitest/browser';
import { card as cardBlock } from '@zeroxsolutions/editor-core/blocks/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import { emailProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { emailKit, emailUi } from '../../profiles/email/email-kit';
import { button } from '../features/button';
import { callout } from '../features/callout';
import { card } from '../features/card';
import { columns } from '../features/columns';
import { documentPresets, emailPresets, presetsFeature } from '../features/presets';
import { standardKit } from '../features/standard';
import { toggleHeading } from '../features/toggle-heading';
import { ChromeIcon } from './chrome-icon';

const profile = emailProfile();
const emailSlash = emailUi(
  collectUiContributions([...emailKit(profile), presetsFeature(emailPresets(profile))]),
  profile,
).slash;
const documentSlash = collectUiContributions([
  standardKit(),
  button(),
  callout(),
  card(cardBlock),
  columns(),
  toggleHeading(),
  presetsFeature(documentPresets()),
]).slash;

/** Each slash item's icon once, by the item that first offers it. */
const icons = [
  ...new Map([...emailSlash, ...documentSlash].reverse().map((item) => [item.icon, item.id] as const)),
].map(([icon, id]) => [id, icon] as const);

describe('ChromeIcon', () => {
  it.each(icons)(
    "plays the %s slash item's icon as the menu opens on it, never drawing a value it has not set",
    async (_id, icon) => {
      // The suite runs as a reader who asked for reduced motion, under which the icons start nothing.
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
      });
      // A frame loop still running from the case before draws the first frame in another order, hiding the fault.
      await new Promise((idle) => setTimeout(idle, 500));
      const unset: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const value = (record.target as Element).getAttribute(record.attributeName ?? '');
          if (value?.includes('undefined')) unset.push(`${record.attributeName}=${value}`);
        }
      });
      observer.observe(document.body, { subtree: true, attributes: true });

      const { unmount } = await render(<ChromeIcon icon={icon} active />);
      await new Promise((settled) => setTimeout(settled, 100));
      observer.disconnect();
      await unmount();
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });

      expect(unset).toEqual([]);
    },
  );
});
