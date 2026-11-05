// Saves a small, public-safe summary of the homelab cluster to
// src/data/cluster.json, read by the cluster map on /homelab/ and the home page.
//
// Source: the Skyhook Radar API at sky.danavira.com (RADAR_URL to override).
// Set RADAR_AUTH=user:password if Radar is behind basic auth.
//
//   node scripts/cluster-snapshot.mjs          refresh, fail if Radar is unreachable
//   node scripts/cluster-snapshot.mjs --soft   refresh if reachable, otherwise keep
//                                              the committed file (used by `pnpm build`)
//
// Only names, kinds, counts, versions and health are kept: no IPs, labels,
// config keys, logs or images.
import { writeFile } from 'node:fs/promises';

const soft = process.argv.includes('--soft');
const base = (process.env.RADAR_URL ?? 'https://sky.danavira.com').replace(/\/$/, '');
const out = new URL('../src/data/cluster.json', import.meta.url);

// Roles come from the node taints in data-platform-manifests
// (platform/cluster-config/nodes.yaml); Radar does not report labels.
const roles = {
  'danavira-control-plane': 'control plane',
  'danavira-worker-1': 'stateful',
  'danavira-worker-2': 'compute',
};

const headers = { accept: 'application/json' };
if (process.env.RADAR_AUTH) {
  headers.authorization = `Basic ${Buffer.from(process.env.RADAR_AUTH).toString('base64')}`;
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

try {
  const [info, topo] = await Promise.all([get('/api/cluster-info'), get('/api/topology')]);
  const byId = new Map(topo.nodes.map((n) => [n.id, n]));
  const ofKind = (kind) => topo.nodes.filter((n) => n.kind === kind);

  // workload id -> node name -> { pods, healthy }
  const placement = new Map();
  const managed = new Set();
  for (const e of topo.edges) {
    const target = byId.get(e.target);
    const source = byId.get(e.source);
    if (e.type !== 'manages' || target?.kind !== 'Pod' || !source) continue;
    managed.add(target.id);
    const node = target.data?.nodeName ?? 'unscheduled';
    const perNode = placement.get(source.id) ?? new Map();
    const slot = perNode.get(node) ?? { pods: 0, healthy: 0 };
    slot.pods += 1;
    if (target.status === 'healthy') slot.healthy += 1;
    perNode.set(node, slot);
    placement.set(source.id, perNode);
  }

  const nodes = new Map();
  const nodeEntry = (name) => {
    if (!nodes.has(name))
      nodes.set(name, { name, role: roles[name] ?? '', pods: 0, workloads: [] });
    return nodes.get(name);
  };
  for (const [id, perNode] of placement) {
    const w = byId.get(id);
    for (const [nodeName, slot] of perNode) {
      const n = nodeEntry(nodeName);
      n.pods += slot.pods;
      n.workloads.push({
        namespace: w.data?.namespace ?? '',
        name: w.name,
        kind: w.kind,
        pods: slot.pods,
        healthy: slot.healthy,
      });
    }
  }
  for (const pod of ofKind('Pod')) {
    if (managed.has(pod.id)) continue;
    const n = nodeEntry(pod.data?.nodeName ?? 'unscheduled');
    n.pods += 1;
    n.workloads.push({
      namespace: pod.data?.namespace ?? '',
      name: pod.name,
      kind: 'Pod',
      pods: 1,
      healthy: pod.status === 'healthy' ? 1 : 0,
    });
  }
  for (const n of nodes.values()) {
    n.workloads.sort(
      (a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name),
    );
  }

  const apps = ofKind('Application');
  const snapshot = {
    takenAt: new Date().toISOString(),
    source: base,
    kubernetesVersion: info.kubernetesVersion,
    nodeCount: info.nodeCount,
    podCount: info.podCount,
    namespaceCount: info.namespaceCount,
    applications: {
      total: apps.length,
      synced: apps.filter((a) => a.data?.syncStatus === 'Synced').length,
      healthy: apps.filter((a) => a.data?.healthStatus === 'Healthy').length,
    },
    networkPolicies: ofKind('NetworkPolicy').length,
    // Control plane first, then workers by name.
    nodes: [...nodes.values()].sort(
      (a, b) =>
        Number(b.role === 'control plane') - Number(a.role === 'control plane') ||
        a.name.localeCompare(b.name),
    ),
  };

  await writeFile(out, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `cluster-snapshot: ${snapshot.nodes.length} nodes, ${snapshot.podCount} pods, ` +
      `${snapshot.applications.total} apps from ${base}`,
  );
} catch (err) {
  if (!soft) throw err;
  console.warn(`cluster-snapshot: ${err.message}; keeping the committed src/data/cluster.json`);
}
