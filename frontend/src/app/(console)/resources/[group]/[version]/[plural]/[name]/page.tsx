'use client';

import { use } from 'react';
import { ResourceDetailPage } from '@/components/resources/ResourceDetailPage';
import { CrdDetailPage } from '@/components/resources/CrdDetailPage';

export default function ResourceDetailRoute({
  params,
}: {
  params: Promise<{ group: string; version: string; plural: string; name: string }>;
}) {
  const { group, version, plural, name } = use(params);

  if (group === 'apiextensions.k8s.io' && plural === 'customresourcedefinitions') {
    return <CrdDetailPage name={decodeURIComponent(name)} />;
  }

  return (
    <ResourceDetailPage
      groupSlug={group}
      version={version}
      plural={plural}
      name={decodeURIComponent(name)}
    />
  );
}
