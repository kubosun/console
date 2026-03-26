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
    const navButtons = screen.getAllByRole('button');
    const navLabels = navButtons.map((btn) => btn.textContent?.trim());
    expect(navLabels).toContain('Overview');
    expect(navLabels).toContain('Workloads');
    expect(navLabels).toContain('Networking');
    expect(navLabels).toContain('Storage');
  });

  it('renders sidebar toggle button', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );
    const toggleButtons = screen.getAllByLabelText('Toggle sidebar');
    expect(toggleButtons.length).toBeGreaterThan(0);
  });
});
