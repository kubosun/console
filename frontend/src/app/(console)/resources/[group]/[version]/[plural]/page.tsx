'use client';

import { use } from 'react';
import { ResourceListPage } from '@/components/resources/ResourceListPage';

export default function ResourceListRoute({
  params,
}: {
  params: Promise<{ group: string; version: string; plural: string }>;
}) {
  const { group, version, plural } = use(params);
  return <ResourceListPage groupSlug={group} version={version} plural={plural} />;
}
