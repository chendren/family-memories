export type RelationshipType = 'parent' | 'spouse' | 'sibling' | 'step_parent' | 'adopted_parent' | 'partner';
export type Gender = 'male' | 'female' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  nickname: string | null;
  birth_date: string | null;
  death_date: string | null;
  bio: string | null;
  photo_path: string | null;
  gender: Gender | null;
  generation: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberCreate {
  name: string;
  nickname?: string;
  birth_date?: string;
  death_date?: string;
  bio?: string;
  gender?: Gender;
}

export interface FamilyMemberUpdate {
  name?: string;
  nickname?: string;
  birth_date?: string;
  death_date?: string;
  bio?: string;
  gender?: Gender;
}

export interface Relationship {
  id: string;
  from_member_id: string;
  to_member_id: string;
  relationship_type: RelationshipType;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipCreate {
  from_member_id: string;
  to_member_id: string;
  relationship_type: RelationshipType;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface FamilyMemberWithMemories extends FamilyMember {
  memory_count: number;
  recent_memories: Array<{
    id: string;
    title: string;
    memory_type: string;
    memory_date: string | null;
    thumbnail_path: string | null;
  }>;
}
