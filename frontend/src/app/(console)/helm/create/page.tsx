'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { useActiveNamespace } from '@/stores/namespace-store';

const REPO_PRESETS = [
  { label: 'Bitnami', url: 'oci://registry-1.docker.io/bitnamicharts' },
  { label: 'Ingress NGINX', url: 'https://kubernetes.github.io/ingress-nginx' },
  { label: 'Jetstack (cert-manager)', url: 'https://charts.jetstack.io' },
];

export default function CreateHelmReleasePage() {
  const router = useRouter();
  const [namespace] = useActiveNamespace();

  const [name, setName] = useState('');
  const [releaseNamespace, setReleaseNamespace] = useState(namespace || 'default');
  const [repoUrl, setRepoUrl] = useState('');
  const [chart, setChart] = useState('');
  const [version, setVersion] = useState('');
  const [valuesText, setValuesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreset = (url: string) => {
    setRepoUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let values: Record<string, unknown> | undefined;
    if (valuesText.trim()) {
      try {
        values = JSON.parse(valuesText);
      } catch {
        setError('Values must be valid JSON (e.g. {"replicaCount": 2})');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/helm/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          namespace: releaseNamespace,
          repo_url: repoUrl,
          chart,
          version: version || null,
          values: values || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || `Failed (${res.status})`);
      }

      router.push(`/helm/${releaseNamespace}/${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create release');
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary';

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      {/* Breadcrumb */}
      <Link href="/helm" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Helm Releases
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Create Helm Release</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Install a Helm chart using Flux. A HelmRepository and HelmRelease will be created.
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Release Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Release Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-release"
            required
            pattern="[a-z0-9][a-z0-9\-]*"
            title="Lowercase letters, numbers, and hyphens"
            className={inputClass}
          />
        </div>

        {/* Namespace */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Namespace</label>
          <input
            type="text"
            value={releaseNamespace}
            onChange={(e) => setReleaseNamespace(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Repository URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Repository URL</label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://charts.bitnami.com/bitnami"
            required
            className={inputClass}
          />
          <div className="flex gap-2 mt-1">
            {REPO_PRESETS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => handlePreset(preset.url)}
                className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Chart Name</label>
          <input
            type="text"
            value={chart}
            onChange={(e) => setChart(e.target.value)}
            placeholder="nginx"
            required
            className={inputClass}
          />
        </div>

        {/* Chart Version */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Chart Version <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="latest"
            className={inputClass}
          />
        </div>

        {/* Values */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Values <span className="text-muted-foreground font-normal">(optional, JSON)</span>
          </label>
          <textarea
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
            placeholder='{"replicaCount": 2}'
            rows={5}
            className={`${inputClass} font-mono text-xs resize-y`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Creating...' : 'Create Release'}
          </button>
          <Link
            href="/helm"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
