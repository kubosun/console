/**
 * Common Kubernetes resource types.
 */

export interface K8sMetadata {
  name: string;
  namespace?: string;
  uid: string;
  resourceVersion: string;
  creationTimestamp: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: K8sMetadata;
  spec?: Record<string, unknown>;
  status?: Record<string, unknown>;
}

export interface K8sResourceList {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion: string;
  };
  items: K8sResource[];
}

export interface WatchEvent {
  type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'ERROR';
  object: K8sResource;
}
