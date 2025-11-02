"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Note } from "@/types/helper.types";

export async function getUserNotes(): Promise<{ notes: Note[]; error?: string }>{
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return { notes: [], error: "Failed to fetch notes. Please try again." };
  }

  // For private bucket images, generate signed URLs so the client can render them directly
  const notesWithSignedUrls = await Promise.all(
    (data as Note[]).map(async (note) => {
      if (note.image_path) {
        const { data: signed, error: signedErr } = await supabase.storage
          .from("note-images")
          .createSignedUrl(note.image_path as string, 60 * 60); // 1 hour
        if (!signedErr && signed?.signedUrl) {
          return { ...note, image_path: signed.signedUrl } as Note;
        }
      }
      return note;
    })
  );

  return { notes: notesWithSignedUrls || [] };
}

export async function createNote(formData: FormData) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to create a note" };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || title.trim() === "") {
    return { error: "Title is required" };
  }

  const { data: inserted, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content?.trim() || null,
      image_path: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating note:", error);
    return { error: "Failed to create note. Please try again." };
  }

  revalidatePath("/protected/notes");
  return { success: true, noteId: inserted?.id as string, userId: user.id as string };
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to delete a note" };
  }

  // Delete the note (only if it belongs to the user)
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting note:", error);
    return { error: "Failed to delete note. Please try again." };
  }

  revalidatePath("/protected/notes");
  return { success: true };
}

export async function updateNote(noteId: string, title: string, content: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to update a note" };
  }

  if (!title || title.trim() === "") {
    return { error: "Title is required" };
  }

  const { error } = await supabase
    .from("notes")
    .update({ 
      title: title.trim(), 
      content: content?.trim() || null 
    })
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating note:", error);
    return { error: "Failed to update note. Please try again." };
  }

  revalidatePath("/protected/notes");
  return { success: true };
}

export async function updateNoteImage(noteId: string, imagePath: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to update a note" };
  }

  const { error } = await supabase
    .from("notes")
    .update({ image_path: imagePath })
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating note image:", error);
    return { error: "Failed to update note image. Please try again." };
  }

  revalidatePath("/protected/notes");
  return { success: true };
}


