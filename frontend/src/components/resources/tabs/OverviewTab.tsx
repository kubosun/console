'use client';

import type { K8sResource } from '@/lib/k8s/types';
import { formatAge, getResourceStatus } from '@/lib/k8s/resource-utils';

interface OverviewTabProps {
  resource: K8sResource;
}

export function OverviewTab({ resource }: OverviewTabProps) {
  const status = getResourceStatus(resource);
  const labels = resource.metadata.labels ?? {};
  const annotations = resource.metadata.annotations ?? {};

  return (
    <div className="space-y-6">
      {/* Details */}
      <Section title="Details">
        <Field label="Name" value={resource.metadata.name} mono />
        {resource.metadata.namespace && (
          <Field label="Namespace" value={resource.metadata.namespace} mono />
        )}
        <Field label="Kind" value={resource.kind} />
        <Field label="API Version" value={resource.apiVersion} />
        <Field label="UID" value={resource.metadata.uid} mono />
        <Field label="Created" value={`${resource.metadata.creationTimestamp} (${formatAge(resource.metadata.creationTimestamp)} ago)`} />
        <Field label="Status" value={status.label} />
        <Field label="Resource Version" value={resource.metadata.resourceVersion} />
      </Section>

      {/* Labels */}
      {Object.keys(labels).length > 0 && (
        <Section title="Labels">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(labels).map(([k, v]) => (
              <span
                key={k}
                className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                <span className="font-medium">{k}</span>
                <span className="mx-1 text-muted-foreground">=</span>
                <span>{v}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Annotations */}
      {Object.keys(annotations).length > 0 && (
        <Section title={`Annotations (${Object.keys(annotations).length})`}>
          <div className="space-y-1 text-xs">
            {Object.entries(annotations).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="font-mono text-muted-foreground shrink-0">{k}</span>
                <span className="truncate">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">{title}</h3>
      <div className="rounded-lg border p-4">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-4 py-1 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
