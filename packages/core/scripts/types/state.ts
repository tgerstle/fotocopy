export type PipelinePhase =
  | "DISCOVERED"
  | "CRAWLED"
  | "HASHED"
  | "CLASSIFIED"
  | "HYDRATED"
  | "COMPLETED"
  | "FAILED";

export interface UrlRecord {
  id: number;
  url: string;
  pathname: string;
  status: PipelinePhase;
  structural_hash: string | null;
  cluster_id: string | null;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
