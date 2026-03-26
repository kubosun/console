'use client';

import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavItem,
  NavList,
  Page,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
} from '@patternfly/react-core';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/' },
  { id: 'workloads', label: 'Workloads', href: '/resources/workloads' },
  { id: 'networking', label: 'Networking', href: '/resources/networking' },
  { id: 'storage', label: 'Storage', href: '/resources/storage' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <Brand alt="Kubosun Console" heights={{ default: '36px' }}>
            <source media="(min-width: 768px)" srcSet="" />
          </Brand>
          <span style={{ fontSize: '1.25rem', fontWeight: 600, marginLeft: '0.5rem' }}>
            Kubosun
          </span>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        {/* Header toolbar will go here: namespace selector, user menu, AI toggle */}
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen}>
      <PageSidebarBody>
        <Nav onSelect={(_event, result) => setActiveItem(result.itemId as string)}>
          <NavList>
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.id} itemId={item.id} isActive={activeItem === item.id}>
                {item.label}
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page masthead={masthead} sidebar={sidebar}>
      {children}
    </Page>
  );
}
