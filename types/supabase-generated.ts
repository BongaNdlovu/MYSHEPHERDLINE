export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: 'shepherd' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          role?: 'shepherd' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          role?: 'shepherd' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          risk_level: 'high' | 'medium' | 'low';
          status: 'active' | 'inactive' | 'new';
          last_contact_at: string | null;
          notes: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          risk_level?: 'high' | 'medium' | 'low';
          status?: 'active' | 'inactive' | 'new';
          last_contact_at?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          risk_level?: 'high' | 'medium' | 'low';
          status?: 'active' | 'inactive' | 'new';
          last_contact_at?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          member_id: string;
          logged_by: string;
          visit_type: 'visit' | 'call' | 'bible_study' | 'other';
          notes: string | null;
          follow_up_required: boolean;
          visited_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          logged_by: string;
          visit_type?: 'visit' | 'call' | 'bible_study' | 'other';
          notes?: string | null;
          follow_up_required?: boolean;
          visited_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          logged_by?: string;
          visit_type?: 'visit' | 'call' | 'bible_study' | 'other';
          notes?: string | null;
          follow_up_required?: boolean;
          visited_at?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          member_id: string | null;
          due_date: string | null;
          status: 'open' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high';
          task_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          member_id?: string | null;
          due_date?: string | null;
          status?: 'open' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high';
          task_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          member_id?: string | null;
          due_date?: string | null;
          status?: 'open' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high';
          task_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          device_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          device_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          device_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
