export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export interface HealthStatus {
  ollama: boolean;
  sqlite: boolean;
  lancedb: boolean;
  redis: boolean;
  disk_free: string;
}

export interface AppStats {
  memories: number;
  family_members: number;
  relationships: number;
  media_assets: number;
  media_size: string;
  tags: number;
}
