import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders the Kubosun brand name', () => {
    render(
      <AppShell>
        <div>Test content</div>
      </AppShell>,
    );
    expect(screen.getByText('Kubosun')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <AppShell>
        <div>Hello World</div>
      </AppShell>,
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Workloads').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Networking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Storage').length).toBeGreaterThan(0);
  });
});
