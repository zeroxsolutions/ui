import { House, Inbox, Settings } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  TabBar,
  TabBarBadge,
  TabBarIcon,
  TabBarIndicator,
  TabBarItem,
  TabBarLabel,
} from '@/components/navigation/tab-bar';
import { Icon } from '@/components/ui/icon';

function TabBarDemo(): ReactNode {
  const [route, setRoute] = useState('home');

  return (
    <View className="h-40">
      <TabBar accessibilityLabel="Main" labels="selected">
        <TabBarItem active={route === 'home'} onPress={() => setRoute('home')}>
          <TabBarIndicator>
            <TabBarIcon>
              <Icon as={House} />
            </TabBarIcon>
          </TabBarIndicator>
          <TabBarLabel>Home</TabBarLabel>
        </TabBarItem>
        <TabBarItem active={route === 'inbox'} onPress={() => setRoute('inbox')}>
          <TabBarIndicator>
            <TabBarIcon>
              <Icon as={Inbox} />
            </TabBarIcon>
            <TabBarBadge countLabel="unread">3</TabBarBadge>
          </TabBarIndicator>
          <TabBarLabel>Inbox</TabBarLabel>
        </TabBarItem>
        <TabBarItem active={route === 'settings'} onPress={() => setRoute('settings')}>
          <TabBarIndicator>
            <TabBarIcon>
              <Icon as={Settings} />
            </TabBarIcon>
          </TabBarIndicator>
          <TabBarLabel>Settings</TabBarLabel>
        </TabBarItem>
      </TabBar>
    </View>
  );
}

export { TabBarDemo };
