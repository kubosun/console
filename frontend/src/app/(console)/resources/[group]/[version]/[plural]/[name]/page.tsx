'use client';

import { use } from 'react';
import { ResourceDetailPage } from '@/components/resources/ResourceDetailPage';

export default function ResourceDetailRoute({
  params,
}: {
  params: Promise<{ group: string; version: string; plural: string; name: string }>;
}) {
  const { group, version, plural, name } = use(params);
  return (
    <ResourceDetailPage
      groupSlug={group}
      version={version}
      plural={plural}
      name={decodeURIComponent(name)}
    />
  );
}
