import { House, Search, User } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  TabBar,
  TabBarIcon,
  TabBarIndicator,
  TabBarItem,
  TabBarLabel,
} from '@/registry/bases/base-ui/components/navigation/tab-bar';

const DESTINATIONS = [
  { id: 'home', label: 'Home', icon: <House /> },
  { id: 'search', label: 'Search', icon: <Search /> },
  { id: 'profile', label: 'Profile', icon: <User /> },
];

/** A tab bar with `labels="none"`: only the icons show, and each label still names its link. */
function TabBarIconsOnlyDemo(): ReactNode {
  return (
    <div className="bg-muted relative h-40 w-full max-w-sm overflow-hidden rounded-xl contain-layout">
      <TabBar aria-label="Sections" labels="none">
        {DESTINATIONS.map((destination, index) => (
          <TabBarItem key={destination.id} href={`#${destination.id}`} active={index === 0}>
            <TabBarIndicator>
              <TabBarIcon>{destination.icon}</TabBarIcon>
            </TabBarIndicator>
            <TabBarLabel>{destination.label}</TabBarLabel>
          </TabBarItem>
        ))}
      </TabBar>
    </div>
  );
}

export { TabBarIconsOnlyDemo };
