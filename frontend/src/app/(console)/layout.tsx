import { AppShell } from '@/components/shell/AppShell';
import { ChatPanel } from '@/components/ai/ChatPanel';
import { AuthGuard } from '@/components/providers/AuthGuard';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>
        {children}
        <ChatPanel />
      </AppShell>
    </AuthGuard>
  );
}
