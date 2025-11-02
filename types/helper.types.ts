import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export type SupabaseDBClient = SupabaseClient<Database>;

export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
export type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];