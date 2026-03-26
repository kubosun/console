'use client';

import Link from 'next/link';
import { Container, Rocket, Globe, FileText, Lock } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Pods', href: '/resources/core/v1/pods', icon: Container },
  { label: 'Deployments', href: '/resources/apps/v1/deployments', icon: Rocket },
  { label: 'Services', href: '/resources/core/v1/services', icon: Globe },
  { label: 'ConfigMaps', href: '/resources/core/v1/configmaps', icon: FileText },
  { label: 'Secrets', href: '/resources/core/v1/secrets', icon: Lock },
];

export default function OverviewPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Kubosun Console</h1>
        <p className="text-muted-foreground">
          AI-native Kubernetes management. Use the sidebar to browse resources or click the bot icon to chat.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 text-sm hover:bg-accent transition-colors"
              >
                <Icon className="h-8 w-8 text-muted-foreground" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
