import GraphConstructor from 'graphology';
import type Database from 'better-sqlite3';
import type {
  FamilyMember,
  FamilyMemberCreate,
  Relationship,
  RelationshipCreate,
  RelationshipType,
  GraphNode,
  GraphEdge,
  TreeData,
} from '@family-memories/shared';
import { SYMMETRIC_RELATIONSHIPS } from '@family-memories/shared';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import dagre from '@dagrejs/dagre';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Graph = GraphConstructor as any;

interface RelEdgeAttributes {
  relationship: Relationship;
}

type PathStep = {
  from: string;
  to: string;
  type: string;
};

function edgeAttrs(attrs: unknown): RelEdgeAttributes {
  return attrs as RelEdgeAttributes;
}

class FamilyGraphService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graph: any;

  constructor() {
    this.graph = new Graph({
      multi: true,
      type: 'directed',
    });
  }

  hydrateFromDb(db: Database.Database): void {
    this.graph.clear();

    const members = db
      .prepare('SELECT * FROM family_members')
      .all() as FamilyMember[];

    for (const member of members) {
      this.graph.addNode(member.id, {
        member,
        generation: member.generation ?? 0,
      });
    }

    const relationships = db
      .prepare('SELECT * FROM relationships')
      .all() as Relationship[];

    for (const rel of relationships) {
      if (!this.graph.hasNode(rel.from_member_id) || !this.graph.hasNode(rel.to_member_id)) {
        continue;
      }

      const edgeKey = `${rel.id}_fwd`;
      this.graph.addEdgeWithKey(edgeKey, rel.from_member_id, rel.to_member_id, {
        relationship: rel,
      });

      if (SYMMETRIC_RELATIONSHIPS.includes(rel.relationship_type)) {
        const reverseKey = `${rel.id}_rev`;
        const reverseRel: Relationship = {
          ...rel,
          from_member_id: rel.to_member_id,
          to_member_id: rel.from_member_id,
        };
        this.graph.addEdgeWithKey(reverseKey, rel.to_member_id, rel.from_member_id, {
          relationship: reverseRel,
        });
      }
    }

    this.computeGenerations();
    logger.info({ nodes: this.graph.order, edges: this.graph.size }, 'Family graph hydrated');
  }

  addMember(db: Database.Database, input: FamilyMemberCreate): FamilyMember {
    const id = newId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO family_members (id, name, nickname, birth_date, death_date, bio, gender, generation, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).run(
      id,
      input.name,
      input.nickname ?? null,
      input.birth_date ?? null,
      input.death_date ?? null,
      input.bio ?? null,
      input.gender ?? null,
      now,
      now
    );

    const member = db
      .prepare('SELECT * FROM family_members WHERE id = ?')
      .get(id) as FamilyMember;

    this.graph.addNode(member.id, {
      member,
      generation: 0,
    });

    this.computeGenerations();

    logger.info({ memberId: id, name: input.name }, 'Family member added');
    return member;
  }

  updateMember(db: Database.Database, id: string, updates: Partial<FamilyMemberCreate>): FamilyMember {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.nickname !== undefined) { fields.push('nickname = ?'); values.push(updates.nickname); }
    if (updates.birth_date !== undefined) { fields.push('birth_date = ?'); values.push(updates.birth_date); }
    if (updates.death_date !== undefined) { fields.push('death_date = ?'); values.push(updates.death_date); }
    if (updates.bio !== undefined) { fields.push('bio = ?'); values.push(updates.bio); }
    if (updates.gender !== undefined) { fields.push('gender = ?'); values.push(updates.gender); }

    if (fields.length === 0) {
      return db.prepare('SELECT * FROM family_members WHERE id = ?').get(id) as FamilyMember;
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE family_members SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const member = db.prepare('SELECT * FROM family_members WHERE id = ?').get(id) as FamilyMember;

    if (this.graph.hasNode(id)) {
      this.graph.setNodeAttribute(id, 'member', member);
    }

    return member;
  }

  removeMember(db: Database.Database, id: string): void {
    db.prepare('DELETE FROM family_members WHERE id = ?').run(id);

    if (this.graph.hasNode(id)) {
      this.graph.dropNode(id);
    }

    logger.info({ memberId: id }, 'Family member removed');
  }

  addRelationship(db: Database.Database, input: RelationshipCreate): Relationship {
    if (!this.graph.hasNode(input.from_member_id)) {
      throw Object.assign(new Error(`Member ${input.from_member_id} not found`), { statusCode: 404 });
    }
    if (!this.graph.hasNode(input.to_member_id)) {
      throw Object.assign(new Error(`Member ${input.to_member_id} not found`), { statusCode: 404 });
    }
    if (input.from_member_id === input.to_member_id) {
      throw Object.assign(new Error('Cannot create a relationship between a member and themselves'), { statusCode: 400 });
    }

    const id = newId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO relationships (id, from_member_id, to_member_id, relationship_type, start_date, end_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.from_member_id,
      input.to_member_id,
      input.relationship_type,
      input.start_date ?? null,
      input.end_date ?? null,
      input.notes ?? null,
      now,
      now
    );

    const rel = db
      .prepare('SELECT * FROM relationships WHERE id = ?')
      .get(id) as Relationship;

    const fwdKey = `${rel.id}_fwd`;
    this.graph.addEdgeWithKey(fwdKey, rel.from_member_id, rel.to_member_id, {
      relationship: rel,
    });

    if (SYMMETRIC_RELATIONSHIPS.includes(rel.relationship_type)) {
      const revKey = `${rel.id}_rev`;
      const reverseRel: Relationship = {
        ...rel,
        from_member_id: rel.to_member_id,
        to_member_id: rel.from_member_id,
      };
      this.graph.addEdgeWithKey(revKey, rel.to_member_id, rel.from_member_id, {
        relationship: reverseRel,
      });
    }

    this.computeGenerations();

    logger.info({ relId: id, type: input.relationship_type }, 'Relationship added');
    return rel;
  }

  removeRelationship(db: Database.Database, id: string): void {
    db.prepare('DELETE FROM relationships WHERE id = ?').run(id);

    const fwdKey = `${id}_fwd`;
    const revKey = `${id}_rev`;

    if (this.graph.hasEdge(fwdKey)) {
      this.graph.dropEdge(fwdKey);
    }
    if (this.graph.hasEdge(revKey)) {
      this.graph.dropEdge(revKey);
    }

    this.computeGenerations();

    logger.info({ relId: id }, 'Relationship removed');
  }

  getTreeData(db: Database.Database): TreeData {
    const members = db
      .prepare('SELECT * FROM family_members')
      .all() as FamilyMember[];

    const relationships = db
      .prepare('SELECT * FROM relationships')
      .all() as Relationship[];

    const memoryCounts = db
      .prepare(
        `SELECT family_member_id, COUNT(*) as count
         FROM memory_people
         GROUP BY family_member_id`
      )
      .all() as Array<{ family_member_id: string; count: number }>;

    const memoryCountMap: Record<string, number> = {};
    for (const row of memoryCounts) {
      memoryCountMap[row.family_member_id] = row.count;
    }

    const positions = computeLayout(members, relationships);

    const nodes: GraphNode[] = members.map((member) => ({
      id: member.id,
      data: {
        member,
        memoryCount: memoryCountMap[member.id] ?? 0,
      },
      position: positions[member.id] ?? { x: 0, y: 0 },
      type: 'person' as const,
    }));

    const edges: GraphEdge[] = relationships.map((rel) => ({
      id: rel.id,
      source: rel.from_member_id,
      target: rel.to_member_id,
      data: {
        relationship_type: rel.relationship_type as RelationshipType,
        start_date: rel.start_date,
        end_date: rel.end_date,
      },
      type: 'relationship' as const,
    }));

    return { nodes, edges };
  }

  getMember(db: Database.Database, id: string): FamilyMember | null {
    const member = db
      .prepare('SELECT * FROM family_members WHERE id = ?')
      .get(id) as FamilyMember | undefined;
    return member ?? null;
  }

  getMemberWithMemories(db: Database.Database, id: string) {
    const member = db
      .prepare('SELECT * FROM family_members WHERE id = ?')
      .get(id) as FamilyMember | undefined;

    if (!member) return null;

    const memoryCount = db
      .prepare('SELECT COUNT(*) as count FROM memory_people WHERE family_member_id = ?')
      .get(id) as { count: number };

    const recentMemories = db
      .prepare(
        `SELECT m.id, m.title, m.memory_type, m.memory_date,
                (SELECT ma.thumbnail_path FROM media_assets ma WHERE ma.memory_id = m.id LIMIT 1) as thumbnail_path
         FROM memories m
         JOIN memory_people mp ON mp.memory_id = m.id
         WHERE mp.family_member_id = ?
         ORDER BY m.memory_date DESC, m.created_at DESC
         LIMIT 5`
      )
      .all(id) as Array<{
        id: string;
        title: string;
        memory_type: string;
        memory_date: string | null;
        thumbnail_path: string | null;
      }>;

    return {
      ...member,
      memory_count: memoryCount.count,
      recent_memories: recentMemories,
    };
  }

  getAllMembers(db: Database.Database): FamilyMember[] {
    return db.prepare('SELECT * FROM family_members ORDER BY name').all() as FamilyMember[];
  }

  getAllRelationships(db: Database.Database): Relationship[] {
    return db.prepare('SELECT * FROM relationships').all() as Relationship[];
  }

  getAncestors(id: string): string[] {
    if (!this.graph.hasNode(id)) return [];

    const ancestors: string[] = [];
    const visited = new Set<string>();
    const queue = [id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      this.graph.forEachInEdge(current, (_edge: string, rawAttrs: unknown, source: string) => {
        const attrs = edgeAttrs(rawAttrs);
        const relType = attrs.relationship.relationship_type;
        if (relType === 'parent' || relType === 'step_parent' || relType === 'adopted_parent') {
          if (!visited.has(source)) {
            ancestors.push(source);
            queue.push(source);
          }
        }
      });
    }

    return ancestors;
  }

  getDescendants(id: string): string[] {
    if (!this.graph.hasNode(id)) return [];

    const descendants: string[] = [];
    const visited = new Set<string>();
    const queue = [id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      this.graph.forEachOutEdge(current, (_edge: string, rawAttrs: unknown, _source: string, target: string) => {
        const attrs = edgeAttrs(rawAttrs);
        const relType = attrs.relationship.relationship_type;
        if (relType === 'parent' || relType === 'step_parent' || relType === 'adopted_parent') {
          if (!visited.has(target)) {
            descendants.push(target);
            queue.push(target);
          }
        }
      });
    }

    return descendants;
  }

  computeGenerations(): void {
    if (this.graph.order === 0) return;

    const rootNodes: string[] = [];

    this.graph.forEachNode((nodeId: string) => {
      let hasParent = false;
      this.graph.forEachInEdge(nodeId, (_edge: string, rawAttrs: unknown) => {
        const attrs = edgeAttrs(rawAttrs);
        const relType = attrs.relationship.relationship_type;
        if (relType === 'parent' || relType === 'step_parent' || relType === 'adopted_parent') {
          hasParent = true;
        }
      });
      if (!hasParent) {
        rootNodes.push(nodeId);
      }
    });

    if (rootNodes.length === 0) {
      this.graph.forEachNode((nodeId: string) => {
        this.graph.setNodeAttribute(nodeId, 'generation', 0);
      });
      return;
    }

    const generations: Record<string, number> = {};
    const visited = new Set<string>();
    const queue: Array<{ id: string; gen: number }> = [];

    for (const root of rootNodes) {
      queue.push({ id: root, gen: 0 });
      generations[root] = 0;
    }

    while (queue.length > 0) {
      const { id: current, gen } = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      generations[current] = gen;
      this.graph.setNodeAttribute(current, 'generation', gen);

      this.graph.forEachOutEdge(current, (_edge: string, rawAttrs: unknown, _source: string, target: string) => {
        const attrs = edgeAttrs(rawAttrs);
        const relType = attrs.relationship.relationship_type;
        if (relType === 'parent' || relType === 'step_parent' || relType === 'adopted_parent') {
          if (!visited.has(target)) {
            const existingGen = generations[target];
            const newGen = gen + 1;
            if (existingGen === undefined || newGen > existingGen) {
              generations[target] = newGen;
            }
            queue.push({ id: target, gen: newGen });
          }
        }
      });

      this.graph.forEachOutEdge(current, (_edge: string, rawAttrs: unknown, _source: string, target: string) => {
        const attrs = edgeAttrs(rawAttrs);
        const relType = attrs.relationship.relationship_type;
        if (SYMMETRIC_RELATIONSHIPS.includes(relType)) {
          if (!visited.has(target) && generations[target] === undefined) {
            generations[target] = gen;
            queue.push({ id: target, gen });
          }
        }
      });
    }

    this.graph.forEachNode((nodeId: string) => {
      if (!visited.has(nodeId)) {
        this.graph.setNodeAttribute(nodeId, 'generation', 0);
      }
    });
  }

  getGeneration(id: string): number {
    if (!this.graph.hasNode(id)) return 0;
    return this.graph.getNodeAttribute(id, 'generation') ?? 0;
  }

  getShortestPath(fromId: string, toId: string): { path: string[]; steps: PathStep[] } | null {
    if (!this.graph.hasNode(fromId) || !this.graph.hasNode(toId)) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const undirectedGraph = new Graph({ multi: true, type: 'undirected' }) as any;

    this.graph.forEachNode((nodeId: string, attrs: unknown) => {
      undirectedGraph.addNode(nodeId, attrs);
    });

    const addedEdges = new Set<string>();
    this.graph.forEachEdge((_edge: string, rawAttrs: unknown, source: string, target: string) => {
      const attrs = edgeAttrs(rawAttrs);
      const pairKey = [source, target].sort().join('::') + '::' + attrs.relationship.relationship_type;
      if (!addedEdges.has(pairKey)) {
        addedEdges.add(pairKey);
        undirectedGraph.addEdge(source, target, rawAttrs);
      }
    });

    const nodePath = bfsShortestPath(undirectedGraph, fromId, toId);
    if (!nodePath) return null;

    const steps: PathStep[] = [];
    for (let i = 0; i < nodePath.length - 1; i++) {
      const from = nodePath[i];
      const to = nodePath[i + 1];

      let relType = 'unknown';
      this.graph.forEachEdge((_edge: string, rawAttrs: unknown, source: string, target: string) => {
        if ((source === from && target === to) || (source === to && target === from)) {
          relType = edgeAttrs(rawAttrs).relationship.relationship_type;
        }
      });

      steps.push({ from, to, type: relType });
    }

    return { path: nodePath, steps };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bfsShortestPath(graph: any, source: string, target: string): string[] | null {
  if (source === target) return [source];

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue = [source];
  visited.add(source);

  while (queue.length > 0) {
    const current = queue.shift()!;

    const neighbors: string[] = [];
    graph.forEachNeighbor(current, (neighbor: string) => {
      neighbors.push(neighbor);
    });

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, current);

      if (neighbor === target) {
        const resultPath: string[] = [target];
        let node = target;
        while (parent.has(node)) {
          node = parent.get(node)!;
          resultPath.unshift(node);
        }
        return resultPath;
      }

      queue.push(neighbor);
    }
  }

  return null;
}

function computeLayout(
  members: FamilyMember[],
  relationships: Relationship[]
): Record<string, { x: number; y: number }> {
  if (members.length === 0) return {};

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const member of members) {
    g.setNode(member.id, { width: 180, height: 100 });
  }

  let hasHierarchyEdges = false;
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent' || rel.relationship_type === 'step_parent' || rel.relationship_type === 'adopted_parent') {
      g.setEdge(rel.from_member_id, rel.to_member_id);
      hasHierarchyEdges = true;
    }
  }

  const positions: Record<string, { x: number; y: number }> = {};

  if (hasHierarchyEdges) {
    dagre.layout(g);

    for (const id of g.nodes()) {
      const node = g.node(id);
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        positions[id] = { x: node.x, y: node.y };
      }
    }
  }

  let orphanX = 0;
  const allYValues = Object.values(positions).map((p) => p.y);
  const maxY = allYValues.length > 0 ? Math.max(...allYValues) : 0;

  for (const member of members) {
    if (!positions[member.id]) {
      positions[member.id] = { x: orphanX, y: maxY + 200 };
      orphanX += 200;
    }
  }

  return positions;
}

export const familyGraph = new FamilyGraphService();
