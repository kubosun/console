import type { Metadata } from 'next';
import '@patternfly/react-core/dist/styles/base.css';

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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
