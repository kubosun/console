import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from './AppShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('./NamespaceSelector', () => ({
  NamespaceSelector: () => <div data-testid="ns-selector">NS</div>,
}));

describe('AppShell', () => {
  it('renders brand and children', () => {
    const { container } = render(
      <AppShell>
        <div>Hello World</div>
      </AppShell>,
    );
    expect(container.textContent).toContain('Kubosun');
    expect(container.textContent).toContain('Hello World');
  });

  it('renders navigation sections and items', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('Workloads');
    expect(text).toContain('Pods');
    expect(text).toContain('Deployments');
    expect(text).toContain('Services');
    expect(text).toContain('ConfigMaps');
  });
});
