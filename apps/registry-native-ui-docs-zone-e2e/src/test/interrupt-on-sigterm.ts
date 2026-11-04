import type { Reporter } from '@playwright/test/reporter';

/**
 * Hands a SIGTERM to Playwright's own SIGINT interrupt, which runs every teardown registered so far,
 * the worker `webServer` included. Playwright installs no SIGTERM handler in its runner, so without this
 * a terminated run (a cancelled nx task, a CI timeout) leaves the worker holding its port. A reporter's
 * constructor is the one place that runs in the runner alone and before the first `webServer` starts.
 */
export default class InterruptOnSigterm implements Reporter {
  constructor() {
    process.on('SIGTERM', () => {
      // `emit` returns false when no task has registered a SIGINT listener yet: no server is up to free.
      if (!process.emit('SIGINT', 'SIGINT')) process.exit(130);
    });
  }

  printsToStdio(): boolean {
    // Playwright adds its own terminal reporter only when nothing listed prints; this one prints nothing.
    return false;
  }
}
