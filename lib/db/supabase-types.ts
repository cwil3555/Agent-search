export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string;
          key: string;
          email: string;
          created_at: string;
          updated_at: string;
          requests_used: number;
          requests_limit: number;
          is_active: boolean;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          requests_used?: number;
          requests_limit?: number;
          is_active?: boolean;
          last_used_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: [];
      };
      usage_logs: {
        Row: {
          id: number;
          api_key_id: string;
          endpoint: string;
          query: string | null;
          created_at: string;
          status_code: number;
          cached: boolean;
        };
        Insert: {
          id?: number;
          api_key_id: string;
          endpoint: string;
          query?: string | null;
          created_at?: string;
          status_code?: number;
          cached?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "usage_logs_api_key_id_fkey";
            columns: ["api_key_id"];
            isOneToOne: false;
            referencedRelation: "api_keys";
            referencedColumns: ["id"];
          },
        ];
      };
      search_cache: {
        Row: {
          id: string;
          query_hash: string;
          endpoint: string;
          response_data: Json;
          created_at: string;
          expires_at: string;
          hit_count: number;
        };
        Insert: {
          id?: string;
          query_hash: string;
          endpoint: string;
          response_data: Json;
          created_at?: string;
          expires_at: string;
          hit_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["search_cache"]["Insert"]>;
        Relationships: [];
      };
      api_key_signups: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          source: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          source?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_key_signups"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_api_key_request: {
        Args: { raw_key: string };
        Returns: {
          api_key_id: string | null;
          is_valid: boolean;
          is_over_limit: boolean;
          requests_used: number;
          requests_limit: number;
          requests_remaining: number;
        }[];
      };
      increment_cache_hit: {
        Args: { cache_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
