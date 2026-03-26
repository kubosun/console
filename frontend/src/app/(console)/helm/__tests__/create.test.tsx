import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateHelmReleasePage from '../create/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/namespace-store', () => ({
  useActiveNamespace: () => ['default', vi.fn()],
}));

describe('CreateHelmReleasePage', () => {
  it('renders the form with all fields', () => {
    const { container } = render(<CreateHelmReleasePage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Create Helm Release');
    expect(text).toContain('Release Name');
    expect(text).toContain('Namespace');
    expect(text).toContain('Repository URL');
    expect(text).toContain('Chart Name');
    expect(text).toContain('Chart Version');
    expect(text).toContain('Values');
  });

  it('renders repo preset buttons', () => {
    const { container } = render(<CreateHelmReleasePage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Bitnami');
    expect(text).toContain('Ingress NGINX');
  });
});
