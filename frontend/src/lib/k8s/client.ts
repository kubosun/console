/**
 * Kubernetes API client — fetches resources through the Python backend proxy.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function k8sFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api/kubernetes/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`K8s API error (${response.status}): ${text}`);
  }

  return response.json();
}

export async function k8sList<T = unknown>(
  group: string,
  version: string,
  plural: string,
  namespace?: string,
): Promise<{ items: T[]; metadata: { resourceVersion: string } }> {
  const basePath = group ? `apis/${group}/${version}` : `api/${version}`;
  const nsPath = namespace ? `namespaces/${namespace}/` : '';
  return k8sFetch(`${basePath}/${nsPath}${plural}`);
}

export async function k8sGet<T = unknown>(
  group: string,
  version: string,
  plural: string,
  name: string,
  namespace?: string,
): Promise<T> {
  const basePath = group ? `apis/${group}/${version}` : `api/${version}`;
  const nsPath = namespace ? `namespaces/${namespace}/` : '';
  return k8sFetch(`${basePath}/${nsPath}${plural}/${name}`);
}

export interface ResourceModel {
  apiGroup: string;
  apiVersion: string;
  kind: string;
  plural: string;
  namespaced: boolean;
  verbs: string[];
}

export async function fetchResourceModels(): Promise<{
  count: number;
  models: Record<string, ResourceModel>;
}> {
  const response = await fetch(`${API_BASE}/api/resources`);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource models: ${response.status}`);
  }
  return response.json();
}
