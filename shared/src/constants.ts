export const MEMORY_TYPES = ['text', 'photo', 'audio', 'video', 'document'] as const;
export const PROCESSING_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export const RELATIONSHIP_TYPES = ['parent', 'spouse', 'sibling', 'step_parent', 'adopted_parent', 'partner'] as const;
export const GENDERS = ['male', 'female', 'other'] as const;
export const ENTITY_TYPES = ['person', 'place', 'date', 'event', 'food', 'object'] as const;
export const CONNECTION_TYPES = ['same_event', 'same_person', 'similar_theme', 'chronological', 'causal'] as const;

export const INVERSE_RELATIONSHIPS: Record<string, string> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
  sibling: 'sibling',
  step_parent: 'step_child',
  step_child: 'step_parent',
  adopted_parent: 'adopted_child',
  adopted_child: 'adopted_parent',
  partner: 'partner',
};

export const SYMMETRIC_RELATIONSHIPS = ['spouse', 'sibling', 'partner'];

export const ACCEPTED_MIME_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  document: ['application/pdf', 'text/plain'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const THUMBNAIL_SIZE = 300;
export const EMBEDDING_DIMENSIONS = 768;
export const DEFAULT_PAGE_SIZE = 20;
