'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as yaml from 'js-yaml';
import { Save, RotateCcw } from 'lucide-react';
import type { K8sResource } from '@/lib/k8s/types';
import { k8sUpdate } from '@/lib/k8s/client';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center bg-muted/30 rounded">
      <p className="text-muted-foreground text-sm">Loading editor...</p>
    </div>
  ),
});

interface YamlTabProps {
  resource: K8sResource;
  group: string;
  version: string;
  plural: string;
  onSaved?: () => void;
}

export function YamlTab({ resource, group, version, plural, onSaved }: YamlTabProps) {
  const originalYaml = yaml.dump(resource, { sortKeys: false, lineWidth: -1 });
  const [content, setContent] = useState(originalYaml);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setError(null);
    setIsSaving(true);
    try {
      const parsed = yaml.load(content) as K8sResource;
      await k8sUpdate(
        group,
        version,
        plural,
        resource.metadata.name,
        parsed,
        resource.metadata.namespace,
      );
      setIsEditing(false);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [content, group, version, plural, resource, onSaved]);

  const handleReset = () => {
    setContent(originalYaml);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isEditing}
            onChange={(e) => setIsEditing(e.target.checked)}
            className="rounded"
          />
          Edit mode
        </label>
        {isEditing && (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-md border px-3 py-1 text-xs hover:bg-accent"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Editor */}
      <div className="rounded-lg border overflow-hidden">
        <MonacoEditor
          height="500px"
          language="yaml"
          value={content}
          onChange={(val) => setContent(val ?? '')}
          options={{
            readOnly: !isEditing,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
