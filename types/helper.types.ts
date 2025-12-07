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

// Constants for UI
export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1 (Kare)" },
  { value: "16:9", label: "16:9 (Geniş)" },
  { value: "9:16", label: "9:16 (Dikey)" },
  { value: "4:3", label: "4:3 (Standart)" },
  { value: "3:4", label: "3:4 (Portre)" },
  { value: "3:2", label: "3:2 (Fotoğraf)" },
  { value: "2:3", label: "2:3 (Dikey Fotoğraf)" },
  { value: "21:9", label: "21:9 (Ultra Geniş)" },
  { value: "5:4", label: "5:4" },
  { value: "4:5", label: "4:5" },
];

export const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];