export type GenealogyProvider = 'familysearch' | 'ancestry' | 'twentythreeme' | 'myheritage';
export type ServiceStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface GenealogyService {
  id: string;
  provider: GenealogyProvider;
  display_name: string;
  description: string;
  status: ServiceStatus;
  features: string[];
  last_sync: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface EthnicityRegion {
  region: string;
  percentage: number;
  color: string;
}

export interface DnaProfile {
  member_id: string;
  member_name: string;
  provider: GenealogyProvider;
  ethnicity: EthnicityRegion[];
  haplogroup_maternal: string;
  haplogroup_paternal: string | null;
}

export interface DnaMatch {
  matched_member_id: string;
  matched_member_name: string;
  shared_centimorgans: number;
  shared_segments: number;
  longest_segment_cm: number;
  predicted_relationship: string;
  confidence: number;
  photo_path: string | null;
}

export interface GedcomExportResult {
  filename: string;
  content: string;
  individual_count: number;
  family_count: number;
}
