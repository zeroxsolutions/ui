import type { ReactNode } from 'react';

import { MarkdownView } from '@/components/data-display/markdown-view';

const SOURCE = [
  '## Release notes',
  '',
  '**v1.2** adds GFM tables and task lists. See the [changelog](https://example.test/changelog) for details.',
  '',
  '- [x] Ship the parser',
  '- [ ] Document the API',
  '',
  '| Feature | Status |',
  '| --- | --- |',
  '| Tables | Done |',
  '| Autolinks | Done |',
].join('\n');

/** A short GFM document: a heading, bold text, a link, a task list and a table. */
function MarkdownViewDemo(): ReactNode {
  return <MarkdownView className="w-full max-w-sm">{SOURCE}</MarkdownView>;
}

export { MarkdownViewDemo };
