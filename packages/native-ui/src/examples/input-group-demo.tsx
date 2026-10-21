import { Search } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Text } from '@/components/ui/text';

function InputGroupDemo(): ReactNode {
  return (
    <View className="gap-4">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" aria-label="Website" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Copy">
            <Text>Copy</Text>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <Icon as={Search} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search" aria-label="Search" />
      </InputGroup>
    </View>
  );
}

export { InputGroupDemo };
