import type { Metadata } from 'next';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kubosun Console',
  description: 'AI-native Kubernetes console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
