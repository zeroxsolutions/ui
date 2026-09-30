import { useState, type ReactNode } from 'react';

import {
  TagInput,
  TagInputInput,
  TagInputList,
  TagInputTag,
  TagInputTagRemove,
} from '@/registry/bases/base-ui/components/data-entry/tag-input';

/** A tag editor over two starting tags. */
function TagInputDemo(): ReactNode {
  const [tags, setTags] = useState(['design', 'ui']);

  return (
    <TagInput value={tags} onValueChange={setTags} className="w-64">
      <TagInputList>
        {tags.map((tag) => (
          <TagInputTag key={tag} value={tag}>
            {tag}
            <TagInputTagRemove aria-label={`Remove ${tag}`} />
          </TagInputTag>
        ))}
      </TagInputList>
      <TagInputInput placeholder="Add a tag" aria-label="Add a tag" />
    </TagInput>
  );
}

export { TagInputDemo };
