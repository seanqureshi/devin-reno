export interface DepTask {
  id: string;
  title: string;
  status: string;
}
export interface Dep {
  taskId: string;
  dependsOnId: string;
}

/** Map of taskId -> prerequisite tasks that are not DONE yet. Tasks with no blockers are omitted. */
export function computeBlockers<T extends DepTask>(tasks: T[], deps: Dep[]): Map<string, T[]> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const out = new Map<string, T[]>();
  for (const d of deps) {
    const pre = byId.get(d.dependsOnId);
    if (!pre || pre.status === "DONE") continue;
    const list = out.get(d.taskId) ?? [];
    list.push(pre);
    out.set(d.taskId, list);
  }
  return out;
}

/** True if adding edge taskId -> dependsOnId would create a cycle (or self-dependency). */
export function wouldCreateCycle(deps: Dep[], taskId: string, dependsOnId: string): boolean {
  if (taskId === dependsOnId) return true;
  const adj = new Map<string, string[]>();
  for (const d of deps) adj.set(d.taskId, [...(adj.get(d.taskId) ?? []), d.dependsOnId]);
  // cycle if taskId is reachable from dependsOnId
  const stack = [dependsOnId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === taskId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...(adj.get(cur) ?? []));
  }
  return false;
}
