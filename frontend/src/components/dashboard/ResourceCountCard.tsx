'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ResourceCountCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  href: string;
}

export function ResourceCountCard({ label, count, icon: Icon, href }: ResourceCountCardProps) {
  return (
    <Link
      href={href}
      className="rounded-lg border p-5 hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
