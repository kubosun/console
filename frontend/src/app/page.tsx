'use client';

import { AppShell } from '@/components/shell/AppShell';
import { ChatPanel } from '@/components/ai/ChatPanel';
import { useK8sResourceList } from '@/hooks/useK8sResourceList';

function PodList() {
  const { data: pods, isLoading, error } = useK8sResourceList({
    group: '',
    version: 'v1',
    plural: 'pods',
    namespace: 'default',
  });

  if (isLoading) return <p className="text-muted-foreground">Loading pods...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;
  if (!pods?.length) return <p className="text-muted-foreground">No pods found in default namespace.</p>;

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Age</th>
          </tr>
        </thead>
        <tbody>
          {pods.map((pod) => (
            <tr key={pod.metadata.uid} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs">{pod.metadata.name}</td>
              <td className="px-4 py-2">
                <span
                  className={
                    pod.status?.phase === 'Running'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }
                >
                  {String(pod.status?.phase ?? 'Unknown')}
                </span>
              </td>
              <td className="px-4 py-2 text-muted-foreground text-xs">
                {pod.metadata.creationTimestamp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Kubosun Console</h1>
          <p className="text-muted-foreground">
            AI-native Kubernetes management. Click the bot icon to chat.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Pods (default namespace)</h2>
          <PodList />
        </div>
      </div>

      <ChatPanel />
    </AppShell>
  );
}
