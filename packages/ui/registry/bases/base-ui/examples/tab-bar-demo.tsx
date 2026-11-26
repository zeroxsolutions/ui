'use client';

import { Compass, House, Inbox, Search, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  TabBar,
  TabBarBadge,
  TabBarIcon,
  TabBarIndicator,
  TabBarItem,
  TabBarLabel,
} from '@/registry/bases/base-ui/components/navigation/tab-bar';
import { Card } from '@/registry/bases/base-ui/ui/card';
import { Skeleton } from '@/registry/bases/base-ui/ui/skeleton';

const DESTINATIONS = [
  { id: 'home', label: 'Home', icon: <House /> },
  { id: 'search', label: 'Search', icon: <Search /> },
  { id: 'explore', label: 'Explore', icon: <Compass /> },
  { id: 'inbox', label: 'Inbox', icon: <Inbox />, unread: 3 },
  { id: 'profile', label: 'Profile', icon: <User /> },
];

/**
 * A phone-sized screen with its tab bar at the bottom, showing only the active label, over content
 * that scrolls behind the blur. In an app each item renders the router's link to a route, and the
 * route's path sets `active`; here the links are fragments and a click moves `active`. The preview
 * contains the bar, which otherwise is fixed to the viewport's edge.
 */
function TabBarDemo(): ReactNode {
  const [active, setActive] = useState('home');
  return (
    <Card className="relative h-96 w-full max-w-sm contain-layout">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-24">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-16 shrink-0" />
        ))}
      </div>
      <TabBar aria-label="Main" labels="selected">
        {DESTINATIONS.map((destination) => (
          <TabBarItem
            key={destination.id}
            href={`#${destination.id}`}
            active={destination.id === active}
            onClick={() => setActive(destination.id)}
          >
            <TabBarIndicator>
              <TabBarIcon>{destination.icon}</TabBarIcon>
              {destination.unread !== undefined && <TabBarBadge>{destination.unread}</TabBarBadge>}
            </TabBarIndicator>
            <TabBarLabel>{destination.label}</TabBarLabel>
          </TabBarItem>
        ))}
      </TabBar>
    </Card>
  );
}

export { TabBarDemo };
