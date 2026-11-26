import './visual.css';

import { beforeAll } from 'vitest';
import { commands } from 'vitest/browser';

declare module 'vitest/browser' {
  interface BrowserCommands {
    /** Answers every request to another host from local files and fixes the page's clock; see the visual config. */
    isolateFromNetwork(): Promise<void>;
  }
}

beforeAll(async () => {
  await commands.isolateFromNetwork();
  // Every weight is one variable file, so loading one face loads the text's every weight.
  await document.fonts.load('16px "Geist Variable"');
});
