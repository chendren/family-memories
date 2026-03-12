export type MemoryType = 'text' | 'photo' | 'audio' | 'video' | 'document';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Memory {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  memory_type: MemoryType;
  memory_date: string | null;
  location: string | null;
  sentiment: number | null;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryCreate {
  title: string;
  content?: string;
  memory_type: MemoryType;
  memory_date?: string;
  location?: string;
  person_ids?: string[];
  tag_names?: string[];
}

export interface MemoryUpdate {
  title?: string;
  content?: string;
  memory_date?: string;
  location?: string;
}

export interface MemoryWithRelations extends Memory {
  assets: MediaAsset[];
  tags: Tag[];
  people: FamilyMemberRef[];
  entities: Entity[];
}

export interface MediaAsset {
  id: string;
  memory_id: string;
  file_path: string;
  thumbnail_path: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  original_name: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  category: string | null;
  source?: 'user' | 'ai';
  confidence?: number;
}

export interface FamilyMemberRef {
  family_member_id: string;
  name: string;
  photo_path: string | null;
  role: string | null;
  source: 'user' | 'ai';
  confidence: number;
}

export interface Entity {
  id: string;
  memory_id: string;
  entity_type: 'person' | 'place' | 'date' | 'event' | 'food' | 'object';
  value: string;
  context: string | null;
  confidence: number;
  created_at: string;
}

export interface MemoryConnection {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  connection_type: 'same_event' | 'same_person' | 'similar_theme' | 'chronological' | 'causal';
  strength: number;
  explanation: string | null;
  created_at: string;
}
