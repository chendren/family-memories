import { getDb } from '../db/sqlite.js';
import { familyGraph } from './family-graph.js';
import { newId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import type { FamilyMember, Relationship } from '@family-memories/shared';
import type {
  GenealogyService,
  ServiceStatus,
  EthnicityRegion,
  DnaProfile,
  DnaMatch,
  GedcomExportResult,
  GenealogyProvider,
} from '@family-memories/shared';

// --- Color palette for ethnicity regions ---
const REGION_COLORS: Record<string, string> = {
  'Irish': '#2D8B4E',
  'English & NW European': '#3B5BA9',
  'Scottish': '#7B3FA0',
  'Scandinavian': '#5BC0EB',
  'Germanic Europe': '#D4A017',
  'Southern Italian': '#C45A3C',
  'Northern Italian': '#E07A5F',
  'Sicilian': '#D94F2B',
  'Sardinian': '#A65D36',
  'Greek & Balkan': '#1B9E85',
  'French': '#9B59B6',
  'Iberian Peninsula': '#E67E22',
  'Indigenous Americas': '#7D6608',
  'Chinese': '#C0392B',
  'Southeast Asian': '#E74C3C',
  'Japanese & Korean': '#D35400',
  'Broadly East Asian': '#A93226',
  'North African': '#D4A574',
  'Middle Eastern': '#C49A3C',
  'Broadly European': '#95A5A6',
  'Welsh': '#6B3FA0',
};

// --- Surname → base ethnicity lookup ---
const SURNAME_ETHNICITIES: Record<string, Record<string, number>> = {
  'Sullivan': { 'Irish': 72, 'English & NW European': 18, 'Scottish': 6, 'Broadly European': 4 },
  "O'Brien": { 'Irish': 84, 'Scottish': 10, 'English & NW European': 4, 'Scandinavian': 2 },
  'Martinelli': { 'Southern Italian': 45, 'Sicilian': 30, 'Greek & Balkan': 12, 'North African': 8, 'Middle Eastern': 5 },
  'Ferraro': { 'Southern Italian': 52, 'Northern Italian': 20, 'Sardinian': 10, 'Greek & Balkan': 8, 'French': 6, 'Broadly European': 4 },
  'Miller': { 'Germanic Europe': 55, 'English & NW European': 30, 'Scandinavian': 10, 'Broadly European': 5 },
  'Callahan': { 'Irish': 78, 'English & NW European': 12, 'Scottish': 7, 'Broadly European': 3 },
  'Walsh': { 'Irish': 75, 'English & NW European': 15, 'Scottish': 7, 'Broadly European': 3 },
  'Greco': { 'Greek & Balkan': 65, 'Southern Italian': 20, 'Middle Eastern': 10, 'Broadly European': 5 },
  'Bianchi': { 'Northern Italian': 50, 'Southern Italian': 25, 'French': 12, 'Germanic Europe': 8, 'Broadly European': 5 },
  'Lopez': { 'Iberian Peninsula': 45, 'Indigenous Americas': 25, 'Southern Italian': 10, 'North African': 10, 'Broadly European': 10 },
  'Wei': { 'Chinese': 85, 'Southeast Asian': 8, 'Japanese & Korean': 5, 'Broadly East Asian': 2 },
  'Garcia': { 'Iberian Peninsula': 40, 'Indigenous Americas': 30, 'North African': 10, 'Southern Italian': 10, 'Broadly European': 10 },
  'Davis': { 'English & NW European': 45, 'Irish': 20, 'Germanic Europe': 15, 'Scottish': 10, 'Broadly European': 10 },
  'Johnson': { 'English & NW European': 40, 'Scandinavian': 20, 'Irish': 15, 'Germanic Europe': 15, 'Broadly European': 10 },
  'Chen': { 'Chinese': 88, 'Southeast Asian': 6, 'Japanese & Korean': 4, 'Broadly East Asian': 2 },
  'Russo': { 'Southern Italian': 55, 'Sicilian': 25, 'Greek & Balkan': 10, 'North African': 5, 'Broadly European': 5 },
  'Rizzo': { 'Sicilian': 50, 'Southern Italian': 30, 'North African': 10, 'Greek & Balkan': 5, 'Broadly European': 5 },
  'DeLuca': { 'Southern Italian': 55, 'Northern Italian': 20, 'Sicilian': 15, 'Broadly European': 10 },
  'Liu': { 'Chinese': 86, 'Southeast Asian': 7, 'Japanese & Korean': 5, 'Broadly East Asian': 2 },
  'Wilson': { 'English & NW European': 50, 'Irish': 15, 'Scottish': 15, 'Germanic Europe': 10, 'Broadly European': 10 },
  'Thompson': { 'English & NW European': 48, 'Scandinavian': 18, 'Scottish': 14, 'Irish': 10, 'Broadly European': 10 },
  'Williams': { 'English & NW European': 50, 'Welsh': 15, 'Irish': 15, 'Scottish': 10, 'Broadly European': 10 },
};

const DEFAULT_ETHNICITY: Record<string, number> = {
  'English & NW European': 40, 'Irish': 20, 'Germanic Europe': 15, 'Scottish': 10, 'Broadly European': 15,
};

// --- Service metadata ---
const SERVICE_META: Record<GenealogyProvider, { display_name: string; description: string; features: string[] }> = {
  familysearch: {
    display_name: 'FamilySearch',
    description: 'Free genealogy service with billions of historical records and collaborative family tree',
    features: ['Family Tree Sync', 'Historical Records', 'GEDCOM Export', 'Record Hints'],
  },
  ancestry: {
    display_name: 'AncestryDNA',
    description: 'DNA ethnicity estimates across 146 populations with matching and SideView technology',
    features: ['Ethnicity Estimate', 'DNA Matches', 'SideView\u2122', 'Ancestral Journeys'],
  },
  twentythreeme: {
    display_name: '23andMe',
    description: 'Ancestry composition with 78+ populations, DNA relatives, and optional health reports',
    features: ['Ancestry Composition', 'DNA Relatives', 'Haplogroups', 'Chromosome Browser'],
  },
  myheritage: {
    display_name: 'MyHeritage',
    description: 'DNA matching with ethnicity estimates, Genetic Groups, and Smart Matches',
    features: ['Ethnicity Estimate', 'DNA Matching', 'Genetic Groups', 'Smart Matches'],
  },
};

// --- Relationship distance → cM mapping (based on Shared cM Project v4) ---
const RELATIONSHIP_BY_DISTANCE: Record<number, { label: string; avgCm: number; minCm: number; maxCm: number }> = {
  1: { label: 'Parent / Child', avgCm: 3500, minCm: 3330, maxCm: 3720 },
  2: { label: 'Sibling / Grandparent', avgCm: 2200, minCm: 1613, maxCm: 2900 },
  3: { label: 'Uncle / Aunt', avgCm: 1400, minCm: 850, maxCm: 2311 },
  4: { label: '1st Cousin', avgCm: 850, minCm: 553, maxCm: 1330 },
  5: { label: '1st Cousin Once Removed', avgCm: 440, minCm: 230, maxCm: 658 },
  6: { label: '2nd Cousin', avgCm: 212, minCm: 46, maxCm: 515 },
  7: { label: '2nd Cousin Once Removed', avgCm: 106, minCm: 0, maxCm: 316 },
  8: { label: '3rd Cousin', avgCm: 74, minCm: 0, maxCm: 215 },
  9: { label: '3rd Cousin Once Removed', avgCm: 37, minCm: 0, maxCm: 108 },
  10: { label: 'Distant Cousin', avgCm: 18, minCm: 0, maxCm: 54 },
};

// --- Helpers ---
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function extractSurname(name: string): string {
  const parts = name.trim().split(' ');
  return parts[parts.length - 1];
}

// --- Ethnicity computation (memoized) ---
const ethnicityCache = new Map<string, Record<string, number>>();

function getBaseEthnicity(memberName: string): Record<string, number> {
  const surname = extractSurname(memberName);
  if (SURNAME_ETHNICITIES[surname]) return { ...SURNAME_ETHNICITIES[surname] };
  for (const [key, val] of Object.entries(SURNAME_ETHNICITIES)) {
    if (key.toLowerCase() === surname.toLowerCase()) return { ...val };
  }
  return { ...DEFAULT_ETHNICITY };
}

function computeEthnicity(
  memberId: string,
  memberMap: Map<string, FamilyMember>,
  parentMap: Map<string, string[]>,
): Record<string, number> {
  if (ethnicityCache.has(memberId)) return ethnicityCache.get(memberId)!;

  const member = memberMap.get(memberId);
  if (!member) return { ...DEFAULT_ETHNICITY };

  const parentIds = parentMap.get(memberId) ?? [];
  if (parentIds.length === 0) {
    const base = getBaseEthnicity(member.name);
    ethnicityCache.set(memberId, base);
    return base;
  }

  const parentEthnicities = parentIds.map((pid) =>
    computeEthnicity(pid, memberMap, parentMap),
  );

  const blended: Record<string, number> = {};
  const weight = 1 / parentEthnicities.length;
  for (const pe of parentEthnicities) {
    for (const [region, pct] of Object.entries(pe)) {
      blended[region] = (blended[region] ?? 0) + pct * weight;
    }
  }

  // Simulate genetic recombination with small deterministic variation
  const seed = hashCode(memberId);
  for (const region of Object.keys(blended)) {
    const variation = (seededRandom(seed + hashCode(region)) - 0.5) * 4;
    blended[region] = Math.max(0, blended[region] + variation);
  }

  // Normalize to 100
  const total = Object.values(blended).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const region of Object.keys(blended)) {
      blended[region] = Math.round((blended[region] / total) * 1000) / 10;
    }
  }

  // Remove regions below 1%
  for (const [region, pct] of Object.entries(blended)) {
    if (pct < 1) delete blended[region];
  }

  // Re-normalize
  const total2 = Object.values(blended).reduce((s, v) => s + v, 0);
  if (total2 > 0) {
    for (const region of Object.keys(blended)) {
      blended[region] = Math.round((blended[region] / total2) * 1000) / 10;
    }
  }

  ethnicityCache.set(memberId, blended);
  return blended;
}

function buildAncestryData() {
  const db = getDb();
  const members = db.prepare('SELECT * FROM family_members').all() as FamilyMember[];
  const relationships = db
    .prepare("SELECT * FROM relationships WHERE relationship_type = 'parent'")
    .all() as Relationship[];

  const memberMap = new Map<string, FamilyMember>();
  for (const m of members) memberMap.set(m.id, m);

  const parentMap = new Map<string, string[]>();
  for (const r of relationships) {
    const parents = parentMap.get(r.to_member_id) ?? [];
    parents.push(r.from_member_id);
    parentMap.set(r.to_member_id, parents);
  }

  return { memberMap, parentMap };
}

// --- GEDCOM date formatting ---
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function toGedcomDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ========== Public API ==========

export function getGenealogyServices(): GenealogyService[] {
  const db = getDb();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO genealogy_services (id, provider, status, created_at, updated_at)
     VALUES (?, ?, 'disconnected', datetime('now'), datetime('now'))`,
  );
  for (const provider of Object.keys(SERVICE_META)) {
    insert.run(newId(), provider);
  }

  const rows = db.prepare('SELECT * FROM genealogy_services').all() as Array<{
    id: string; provider: GenealogyProvider; status: string;
    last_sync: string | null; created_at: string; updated_at: string;
  }>;

  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM family_members').get() as { c: number }).c;

  return rows.map((row) => {
    const meta = SERVICE_META[row.provider];
    return {
      id: row.id,
      provider: row.provider,
      display_name: meta.display_name,
      description: meta.description,
      status: row.status as ServiceStatus,
      features: meta.features,
      last_sync: row.last_sync,
      member_count: row.status === 'connected' ? memberCount : 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

export function connectService(provider: GenealogyProvider): GenealogyService {
  const db = getDb();
  // Ensure service row exists
  db.prepare(
    `INSERT OR IGNORE INTO genealogy_services (id, provider, status, created_at, updated_at)
     VALUES (?, ?, 'disconnected', datetime('now'), datetime('now'))`,
  ).run(newId(), provider);

  db.prepare(
    `UPDATE genealogy_services SET status = 'connected', last_sync = datetime('now'), updated_at = datetime('now')
     WHERE provider = ?`,
  ).run(provider);

  ethnicityCache.clear();
  logger.info({ provider }, 'Genealogy service connected');
  return getGenealogyServices().find((s) => s.provider === provider)!;
}

export function disconnectService(provider: GenealogyProvider): void {
  const db = getDb();
  db.prepare(
    `UPDATE genealogy_services SET status = 'disconnected', last_sync = NULL, updated_at = datetime('now')
     WHERE provider = ?`,
  ).run(provider);
  logger.info({ provider }, 'Genealogy service disconnected');
}

export function getDnaProfile(
  memberId: string,
  provider: GenealogyProvider = 'ancestry',
): DnaProfile | null {
  const db = getDb();
  const member = db
    .prepare('SELECT * FROM family_members WHERE id = ?')
    .get(memberId) as FamilyMember | undefined;
  if (!member) return null;

  const { memberMap, parentMap } = buildAncestryData();
  const rawEthnicity = computeEthnicity(memberId, memberMap, parentMap);

  const ethnicity: EthnicityRegion[] = Object.entries(rawEthnicity)
    .map(([region, percentage]) => ({
      region,
      percentage,
      color: REGION_COLORS[region] ?? '#95A5A6',
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const seed = hashCode(memberId);
  const maternalHaplogroups = ['H1', 'H3', 'J1c', 'K1a', 'T2b', 'U5a', 'V', 'I1', 'W', 'X2'];
  const paternalHaplogroups = ['R1b', 'I1', 'I2a', 'R1a', 'J2', 'E1b1b', 'G2a', 'N1c', 'Q1a', 'T1a'];

  return {
    member_id: memberId,
    member_name: member.name,
    provider,
    ethnicity,
    haplogroup_maternal: maternalHaplogroups[seed % maternalHaplogroups.length],
    haplogroup_paternal:
      member.gender === 'male'
        ? paternalHaplogroups[(seed + 7) % paternalHaplogroups.length]
        : null,
  };
}

export function getDnaMatches(memberId: string): DnaMatch[] {
  const db = getDb();
  const members = db.prepare('SELECT * FROM family_members').all() as FamilyMember[];
  const targetMember = members.find((m) => m.id === memberId);
  if (!targetMember) return [];

  // Precompute ancestor sets using graph traversal (only follows parent edges)
  const targetAncestors = new Set(familyGraph.getAncestors(memberId));

  // Use graph-computed generations (not DB values which may be stale)
  const generationMap = new Map<string, number>();
  for (const m of members) generationMap.set(m.id, familyGraph.getGeneration(m.id));

  const matches: DnaMatch[] = [];

  for (const other of members) {
    if (other.id === memberId) continue;

    const otherAncestors = new Set(familyGraph.getAncestors(other.id));
    let geneticDistance: number | null = null;

    if (targetAncestors.has(other.id)) {
      // other is a direct ancestor of target
      const tGen = generationMap.get(memberId) ?? 0;
      const oGen = generationMap.get(other.id) ?? 0;
      geneticDistance = Math.abs(tGen - oGen);
    } else if (otherAncestors.has(memberId)) {
      // target is a direct ancestor of other
      const tGen = generationMap.get(memberId) ?? 0;
      const oGen = generationMap.get(other.id) ?? 0;
      geneticDistance = Math.abs(tGen - oGen);
    } else {
      // Find most recent common ancestor via generation distance
      const common: string[] = [];
      for (const a of targetAncestors) {
        if (otherAncestors.has(a)) common.push(a);
      }

      if (common.length > 0) {
        let minDist = Infinity;
        const tGen = generationMap.get(memberId) ?? 0;
        const oGen = generationMap.get(other.id) ?? 0;

        for (const ancestorId of common) {
          const aGen = generationMap.get(ancestorId) ?? 0;
          const dist = Math.abs(tGen - aGen) + Math.abs(oGen - aGen);
          if (dist < minDist) minDist = dist;
        }

        if (minDist < Infinity) geneticDistance = minDist;
      }
    }

    if (geneticDistance === null || geneticDistance === 0) continue;

    const relInfo =
      RELATIONSHIP_BY_DISTANCE[Math.min(geneticDistance, 10)] ??
      RELATIONSHIP_BY_DISTANCE[10];

    // Deterministic cM value using sorted pair hash for consistency
    const pairSeed = hashCode([memberId, other.id].sort().join(':'));
    const rand = seededRandom(pairSeed);
    const cm = relInfo.minCm + rand * (relInfo.maxCm - relInfo.minCm);

    if (cm < 8) continue;

    const segments = Math.max(1, Math.round(cm / 30 + seededRandom(pairSeed + 1) * 5));
    const longestSeg = Math.min(cm, (cm / segments) * (1.5 + seededRandom(pairSeed + 2)));

    matches.push({
      matched_member_id: other.id,
      matched_member_name: other.name,
      shared_centimorgans: Math.round(cm * 10) / 10,
      shared_segments: segments,
      longest_segment_cm: Math.round(longestSeg * 10) / 10,
      predicted_relationship: relInfo.label,
      confidence: Math.min(
        0.99,
        0.5 + (1 / geneticDistance) * 0.4 + seededRandom(pairSeed + 3) * 0.1,
      ),
      photo_path: other.photo_path,
    });
  }

  matches.sort((a, b) => b.shared_centimorgans - a.shared_centimorgans);
  return matches;
}

export function generateGedcom(): GedcomExportResult {
  const db = getDb();
  const members = db.prepare('SELECT * FROM family_members').all() as FamilyMember[];
  const relationships = db.prepare('SELECT * FROM relationships').all() as Relationship[];

  const memberMap = new Map<string, FamilyMember>();
  for (const m of members) memberMap.set(m.id, m);

  // Build families from spouse pairs + shared children
  const spouseRels = relationships.filter((r) => r.relationship_type === 'spouse');
  const parentRels = relationships.filter((r) => r.relationship_type === 'parent');

  const families: Array<{
    husband?: string; wife?: string; children: string[]; marriageDate?: string;
  }> = [];

  const processedPairs = new Set<string>();
  for (const rel of spouseRels) {
    const pairKey = [rel.from_member_id, rel.to_member_id].sort().join(':');
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const m1 = memberMap.get(rel.from_member_id);
    const m2 = memberMap.get(rel.to_member_id);
    if (!m1 || !m2) continue;

    const husband = m1.gender === 'male' ? m1.id : m2.gender === 'male' ? m2.id : m1.id;
    const wife = husband === m1.id ? m2.id : m1.id;

    const childrenOf1 = new Set(
      parentRels.filter((r) => r.from_member_id === m1.id).map((r) => r.to_member_id),
    );
    const sharedChildren = parentRels
      .filter((r) => r.from_member_id === m2.id)
      .map((r) => r.to_member_id)
      .filter((c) => childrenOf1.has(c));

    families.push({ husband, wife, children: sharedChildren, marriageDate: rel.start_date ?? undefined });
  }

  // Assign GEDCOM XREFs
  const memberXref = new Map<string, string>();
  members.forEach((m, i) => memberXref.set(m.id, `@I${i + 1}@`));

  const famAsSpouse = new Map<string, string[]>();
  const famAsChild = new Map<string, string[]>();

  families.forEach((fam, i) => {
    const famXref = `@F${i + 1}@`;
    if (fam.husband) {
      const arr = famAsSpouse.get(fam.husband) ?? [];
      arr.push(famXref);
      famAsSpouse.set(fam.husband, arr);
    }
    if (fam.wife) {
      const arr = famAsSpouse.get(fam.wife) ?? [];
      arr.push(famXref);
      famAsSpouse.set(fam.wife, arr);
    }
    for (const child of fam.children) {
      const arr = famAsChild.get(child) ?? [];
      arr.push(famXref);
      famAsChild.set(child, arr);
    }
  });

  const lines: string[] = [];
  const now = new Date();

  // GEDCOM 5.5.1 Header
  lines.push('0 HEAD');
  lines.push('1 SOUR FamilyMemories');
  lines.push('2 VERS 1.0');
  lines.push('2 NAME Family Memories');
  lines.push('1 DEST ANSTFILE');
  lines.push(`1 DATE ${toGedcomDate(now.toISOString())}`);
  lines.push('1 SUBM @U1@');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');

  lines.push('0 @U1@ SUBM');
  lines.push('1 NAME Family Memories User');

  // Individual records
  for (const member of members) {
    const xref = memberXref.get(member.id)!;
    lines.push(`0 ${xref} INDI`);

    const nameParts = member.name.trim().split(' ');
    const surname = nameParts.pop() ?? '';
    const given = nameParts.join(' ');
    lines.push(`1 NAME ${given} /${surname}/`);
    if (given) lines.push(`2 GIVN ${given}`);
    lines.push(`2 SURN ${surname}`);

    if (member.gender === 'male') lines.push('1 SEX M');
    else if (member.gender === 'female') lines.push('1 SEX F');

    if (member.birth_date) {
      lines.push('1 BIRT');
      const gd = toGedcomDate(member.birth_date);
      if (gd) lines.push(`2 DATE ${gd}`);
    }

    if (member.death_date) {
      lines.push('1 DEAT');
      const gd = toGedcomDate(member.death_date);
      if (gd) lines.push(`2 DATE ${gd}`);
    }

    for (const f of famAsSpouse.get(member.id) ?? []) lines.push(`1 FAMS ${f}`);
    for (const f of famAsChild.get(member.id) ?? []) lines.push(`1 FAMC ${f}`);

    if (member.bio) {
      lines.push(`1 NOTE ${member.bio.split('\n')[0].slice(0, 200)}`);
    }
  }

  // Family records
  families.forEach((fam, i) => {
    const famXref = `@F${i + 1}@`;
    lines.push(`0 ${famXref} FAM`);
    if (fam.husband) lines.push(`1 HUSB ${memberXref.get(fam.husband)}`);
    if (fam.wife) lines.push(`1 WIFE ${memberXref.get(fam.wife)}`);

    if (fam.marriageDate) {
      lines.push('1 MARR');
      const gd = toGedcomDate(fam.marriageDate);
      if (gd) lines.push(`2 DATE ${gd}`);
    }

    for (const child of fam.children) {
      lines.push(`1 CHIL ${memberXref.get(child)}`);
    }
  });

  lines.push('0 TRLR');

  return {
    filename: `family-memories-${now.toISOString().slice(0, 10)}.ged`,
    content: lines.join('\n'),
    individual_count: members.length,
    family_count: families.length,
  };
}
