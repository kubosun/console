'use client';

import { AppShell } from '@/components/shell/AppShell';

export default function Home() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-2">Welcome to Kubosun Console</h1>
        <p className="text-muted-foreground">AI-native Kubernetes management console.</p>
      </div>
    </AppShell>
  );
}
