'use client';

import { AppShell } from '@/components/shell/AppShell';

export default function Home() {
  return (
    <AppShell>
      <div style={{ padding: '2rem' }}>
        <h1>Welcome to Kubosun Console</h1>
        <p>AI-native Kubernetes management console.</p>
      </div>
    </AppShell>
  );
}
