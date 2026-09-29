import { useState, type ReactNode } from 'react';

import { TagInput } from '@/registry/bases/base-ui/components/data-entry/tag-input';

/** A tag editor over two starting tags. */
function TagInputDemo(): ReactNode {
  const [tags, setTags] = useState(['design', 'ui']);

  return <TagInput value={tags} onValueChange={setTags} placeholder="Add a tag" className="w-64" />;
}

export { TagInputDemo };
