import { useState, type ReactNode } from 'react';

import {
  TagInput,
  TagInputInput,
  TagInputList,
  TagInputTag,
  TagInputTagRemove,
} from '@/components/data-entry/tag-input';
import { Text } from '@/components/ui/text';

/** A tag editor over two starting tags, whose remove button asks for a second press before a tag goes. */
function TagInputDemo(): ReactNode {
  const [tags, setTags] = useState(['design', 'ui']);
  const [armed, setArmed] = useState<string | null>(null);

  return (
    <TagInput
      value={tags}
      onValueChange={(next) => {
        setTags(next);
        setArmed(null);
      }}
      className="w-64"
    >
      <TagInputList>
        {tags.map((tag) => (
          <TagInputTag key={tag} value={tag}>
            {tag}
            <TagInputTagRemove
              aria-label={armed === tag ? `Confirm removing ${tag}` : `Remove ${tag}`}
              onPress={(event) => {
                if (armed === tag) return;
                event.preventDefault();
                setArmed(tag);
              }}
            />
          </TagInputTag>
        ))}
      </TagInputList>
      <TagInputInput placeholder="Add a tag" aria-label="Add a tag" />
      {armed && <Text className="text-muted-foreground text-xs">{`Press its X again to remove ${armed}`}</Text>}
    </TagInput>
  );
}

export { TagInputDemo };
