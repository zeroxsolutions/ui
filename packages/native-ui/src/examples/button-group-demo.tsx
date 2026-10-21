import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function ButtonGroupDemo(): ReactNode {
  return (
    <View className="items-start gap-4">
      <ButtonGroup aria-label="Navigation">
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Back">
            <Icon as={ArrowLeft} />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">
            <Text>Archive</Text>
          </Button>
          <Button variant="outline">
            <Text>Report</Text>
          </Button>
          <Button variant="outline">
            <Text>Snooze</Text>
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Next">
            <Icon as={ArrowRight} />
          </Button>
        </ButtonGroup>
      </ButtonGroup>
      <ButtonGroup aria-label="Save">
        <Button>
          <Text>Save</Text>
        </Button>
        <ButtonGroupSeparator />
        <Button size="icon" aria-label="More save options">
          <Icon as={ChevronDown} />
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Price">
        <ButtonGroupText>
          <Text>USD</Text>
        </ButtonGroupText>
        <Button variant="outline">
          <Text>Change currency</Text>
        </Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <Button variant="outline">
          <Text>Zoom in</Text>
        </Button>
        <Button variant="outline">
          <Text>Zoom out</Text>
        </Button>
      </ButtonGroup>
    </View>
  );
}

export { ButtonGroupDemo };
