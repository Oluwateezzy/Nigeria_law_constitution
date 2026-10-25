let expanded = new Set<string>();
const listeners = new Set<() => void>();

export function getExpanded(): ReadonlySet<string> {
  return expanded;
}

export function subscribeExpanded(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function toggleExpanded(id: string): void {
  const next = new Set(expanded);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expanded = next;
  for (const listener of listeners) {
    listener();
  }
}
