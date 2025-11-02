"use client";

import { Note } from "@/types/helper.types";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { deleteNote, updateNote } from "@/lib/supabase/actions";
import { EditNoteDialog } from "./edit-note-dialog";

const NotesList = ({ notes }: { notes: Note[] }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditClick = (note: Note) => {
    setEditingNote(note);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  };

  const handleUpdate = async (
    noteId: string,
    title: string,
    content: string
  ) => {
    setIsUpdating(true);
    try {
      const result = await updateNote(noteId, title, content);
      if (result.error) {
        alert(result.error);
      } else {
        setIsEditDialogOpen(false);
        setEditingNote(null);
      }
    } catch (error) {
      const err = error as Error;
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }
    setDeletingId(noteId);
    try {
      const result = await deleteNote(noteId);
      if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      const err = error as Error;
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          No notes yet. Create your first note above!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="font-semibold text-xl">Your Notes ({notes.length})</h2>
        <div className="grid gap-4 grid-cols-1">
          {notes.map((note) => (
            <Card key={note.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleEditClick(note)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {new Date(note.created_at as string).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {note.content && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}
                {note.image_path && (
                  <div className="mt-2 relative w-full h-64 overflow-hidden rounded-md">
                    <Image
                      src={note.image_path}
                      alt={note.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <EditNoteDialog
        note={editingNote}
        open={isEditDialogOpen}
        onOpenChange={handleDialogClose}
        onUpdate={handleUpdate}
        isUpdating={isUpdating}
      />
    </>
  );
};

export default NotesList;
