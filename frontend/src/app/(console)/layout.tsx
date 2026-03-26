import { AppShell } from '@/components/shell/AppShell';
import { ChatPanel } from '@/components/ai/ChatPanel';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <ChatPanel />
    </AppShell>
  );
}
