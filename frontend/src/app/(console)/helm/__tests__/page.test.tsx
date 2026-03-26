import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HelmReleasesPage from '../page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/namespace-store', () => ({
  useActiveNamespace: () => ['default', vi.fn()],
}));

vi.mock('@/hooks/useHelmReleases', () => ({
  useHelmReleases: () => ({
    data: [
      {
        name: 'my-release',
        namespace: 'default',
        chart: 'nginx',
        chartVersion: '1.2.3',
        appVersion: '1.25',
        status: 'deployed',
        revision: 1,
        deployedAt: new Date().toISOString(),
        description: 'Install complete',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('HelmReleasesPage', () => {
  it('renders the page title and release data', () => {
    const { container } = render(<HelmReleasesPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Helm Releases');
    expect(text).toContain('my-release');
    expect(text).toContain('nginx');
    expect(text).toContain('deployed');
  });

  it('shows release count badge', () => {
    const { container } = render(<HelmReleasesPage />);
    expect(container.textContent).toContain('1');
  });
});
