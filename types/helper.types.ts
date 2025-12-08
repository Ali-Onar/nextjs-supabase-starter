import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export type SupabaseDBClient = SupabaseClient<Database>;

export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
export type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];

// Generated Images Types
export type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];
export type GeneratedImageInsert = Database["public"]["Tables"]["generated_images"]["Insert"];
export type GeneratedImageUpdate = Database["public"]["Tables"]["generated_images"]["Update"];

// Enum Types
export type AspectRatio = Database["public"]["Enums"]["aspect_ratio_enum"];
export type OutputFormat = Database["public"]["Enums"]["output_format_enum"];
export type GenerationStatus = Database["public"]["Enums"]["generation_status_enum"];
