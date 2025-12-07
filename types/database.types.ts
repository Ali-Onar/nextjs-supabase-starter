export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      generated_images: {
        Row: {
          aspect_ratio: Database["public"]["Enums"]["aspect_ratio_enum"]
          content_type: string | null
          created_at: string
          description: string | null
          error_message: string | null
          fal_image_url: string | null
          fal_request_id: string | null
          file_size: number | null
          height: number | null
          id: string
          num_images: number
          output_format: Database["public"]["Enums"]["output_format_enum"]
          prompt: string
          status: Database["public"]["Enums"]["generation_status_enum"]
          storage_path: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          aspect_ratio?: Database["public"]["Enums"]["aspect_ratio_enum"]
          content_type?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          fal_image_url?: string | null
          fal_request_id?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          num_images?: number
          output_format?: Database["public"]["Enums"]["output_format_enum"]
          prompt: string
          status?: Database["public"]["Enums"]["generation_status_enum"]
          storage_path?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          aspect_ratio?: Database["public"]["Enums"]["aspect_ratio_enum"]
          content_type?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          fal_image_url?: string | null
          fal_request_id?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          num_images?: number
          output_format?: Database["public"]["Enums"]["output_format_enum"]
          prompt?: string
          status?: Database["public"]["Enums"]["generation_status_enum"]
          storage_path?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      generated_images_test: {
        Row: {
          aspect_ratio: Database["public"]["Enums"]["aspect_ratio_enum_test"]
          content_type: string | null
          created_at: string
          description: string | null
          error_message: string | null
          fal_image_url: string | null
          fal_request_id: string | null
          file_size: number | null
          height: number | null
          id: string
          num_images: number
          output_format: Database["public"]["Enums"]["output_format_enum_test"]
          prompt: string
          status: Database["public"]["Enums"]["generation_status_enum_test"]
          storage_path: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          aspect_ratio?: Database["public"]["Enums"]["aspect_ratio_enum_test"]
          content_type?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          fal_image_url?: string | null
          fal_request_id?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          num_images?: number
          output_format?: Database["public"]["Enums"]["output_format_enum_test"]
          prompt: string
          status?: Database["public"]["Enums"]["generation_status_enum_test"]
          storage_path?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          aspect_ratio?: Database["public"]["Enums"]["aspect_ratio_enum_test"]
          content_type?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          fal_image_url?: string | null
          fal_request_id?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          num_images?: number
          output_format?: Database["public"]["Enums"]["output_format_enum_test"]
          prompt?: string
          status?: Database["public"]["Enums"]["generation_status_enum_test"]
          storage_path?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_path: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_path?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_path?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      aspect_ratio_enum:
        | "21:9"
        | "16:9"
        | "3:2"
        | "4:3"
        | "5:4"
        | "1:1"
        | "4:5"
        | "3:4"
        | "2:3"
        | "9:16"
      aspect_ratio_enum_test:
        | "21:9"
        | "16:9"
        | "3:2"
        | "4:3"
        | "5:4"
        | "1:1"
        | "4:5"
        | "3:4"
        | "2:3"
        | "9:16"
      generation_status_enum: "pending" | "processing" | "completed" | "failed"
      generation_status_enum_test:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      output_format_enum: "jpeg" | "png" | "webp"
      output_format_enum_test: "jpeg" | "png" | "webp"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      aspect_ratio_enum: [
        "21:9",
        "16:9",
        "3:2",
        "4:3",
        "5:4",
        "1:1",
        "4:5",
        "3:4",
        "2:3",
        "9:16",
      ],
      aspect_ratio_enum_test: [
        "21:9",
        "16:9",
        "3:2",
        "4:3",
        "5:4",
        "1:1",
        "4:5",
        "3:4",
        "2:3",
        "9:16",
      ],
      generation_status_enum: ["pending", "processing", "completed", "failed"],
      generation_status_enum_test: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      output_format_enum: ["jpeg", "png", "webp"],
      output_format_enum_test: ["jpeg", "png", "webp"],
    },
  },
} as const
