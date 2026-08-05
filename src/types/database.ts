export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      condominiums: {
        Row: {
          id: string;
          name: string;
          slug: string;
          city: string | null;
          state: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          city?: string | null;
          state?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['condominiums']['Insert']>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          condominium_id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          apartment: string | null;
          block: string | null;
          avatar_url: string | null;
          role: 'resident' | 'admin' | 'moderator';
          status: 'pending' | 'approved' | 'rejected' | 'blocked';
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          apartment?: string | null;
          block?: string | null;
          avatar_url?: string | null;
          role?: 'resident' | 'admin' | 'moderator';
          status?: 'pending' | 'approved' | 'rejected' | 'blocked';
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      provider_categories: {
        Row: {
          id: string;
          condominium_id: string | null;
          name: string;
          icon: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          condominium_id?: string | null;
          name: string;
          icon?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['provider_categories']['Insert']>;
        Relationships: [];
      };
      provider_specialties: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          icon: string | null;
          aliases: string[];
          sort_order: number;
          active: boolean;
          is_popular: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          name: string;
          icon?: string | null;
          aliases?: string[];
          sort_order?: number;
          active?: boolean;
          is_popular?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['provider_specialties']['Insert']>;
        Relationships: [];
      };
      service_suggestions: {
        Row: {
          id: string;
          condominium_id: string;
          proposed_name: string;
          suggested_category_id: string | null;
          provider_id: string | null;
          created_by: string | null;
          status: 'pending' | 'approved' | 'linked' | 'rejected';
          resolved_specialty_id: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          proposed_name: string;
          suggested_category_id?: string | null;
          provider_id?: string | null;
          created_by?: string | null;
          status?: 'pending' | 'approved' | 'linked' | 'rejected';
          resolved_specialty_id?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_suggestions']['Insert']>;
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          condominium_id: string;
          category_id: string | null;
          name: string;
          phone: string | null;
          whatsapp: string | null;
          instagram: string | null;
          description: string | null;
          service_specialty_id: string | null;
          service_specialty_name: string | null;
          custom_service_description: string | null;
          business_description: string | null;
          additional_service_specialty_ids: string[];
          additional_service_specialty_names: string[];
          average_rating: number;
          total_reviews: number;
          would_hire_again_rate: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          moderation_reason: string | null;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          category_id?: string | null;
          name: string;
          phone?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          description?: string | null;
          service_specialty_id?: string | null;
          service_specialty_name?: string | null;
          custom_service_description?: string | null;
          business_description?: string | null;
          additional_service_specialty_ids?: string[];
          additional_service_specialty_names?: string[];
          average_rating?: number;
          total_reviews?: number;
          would_hire_again_rate?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          moderation_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['providers']['Insert']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          condominium_id: string;
          provider_id: string;
          user_id: string;
          rating: number;
          comment: string;
          service_performed: string | null;
          used_when: 'this_week' | 'last_month' | 'three_to_six_months' | 'more_than_six_months' | null;
          would_hire_again: boolean;
          real_use_confirmed: boolean;
          is_anonymous: boolean;
          created_at: string;
          updated_at: string;
          comment_deleted_at: string | null;
          comment_deleted_by: string | null;
          comment_moderation_reason: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          moderation_reason: string | null;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          provider_id: string;
          user_id: string;
          rating: number;
          comment: string;
          service_performed?: string | null;
          used_when?: 'this_week' | 'last_month' | 'three_to_six_months' | 'more_than_six_months' | null;
          would_hire_again: boolean;
          real_use_confirmed?: boolean;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
          comment_deleted_at?: string | null;
          comment_deleted_by?: string | null;
          comment_moderation_reason?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          moderation_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
        Relationships: [];
      };
      review_photos: {
        Row: {
          id: string;
          condominium_id: string;
          review_id: string;
          uploaded_by: string | null;
          storage_path: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          moderation_reason: string | null;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          review_id: string;
          uploaded_by?: string | null;
          storage_path: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          moderation_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['review_photos']['Insert']>;
        Relationships: [];
      };
      feedbacks: {
        Row: {
          id: string;
          condominium_id: string;
          user_id: string;
          subject: string;
          message: string;
          status: 'new' | 'read' | 'resolved' | 'archived';
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          user_id: string;
          subject: string;
          message: string;
          status?: 'new' | 'read' | 'resolved' | 'archived';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['feedbacks']['Insert']>;
        Relationships: [];
      };
      access_requests: {
        Row: {
          id: string;
          condominium_id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          apartment: string | null;
          block: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'blocked';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          auth_user_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          apartment?: string | null;
          block?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'blocked';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['access_requests']['Insert']>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          condominium_id: string;
          provider_id: string;
          review_id: string | null;
          reported_by: string | null;
          reason: string;
          status: 'open' | 'kept' | 'hidden' | 'removed';
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          provider_id: string;
          review_id?: string | null;
          reported_by?: string | null;
          reason: string;
          status?: 'open' | 'kept' | 'hidden' | 'removed';
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
        Relationships: [];
      };
      searches: {
        Row: {
          id: string;
          condominium_id: string;
          user_id: string | null;
          query: string;
          results_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          user_id?: string | null;
          query: string;
          results_count?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['searches']['Insert']>;
        Relationships: [];
      };
      app_events: {
        Row: {
          id: string;
          condominium_id: string;
          user_id: string | null;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          condominium_id: string;
          user_id?: string | null;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['app_events']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      review_service_suggestion: {
        Args: { target_suggestion_id: string; decision: string; target_specialty_id?: string | null };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
