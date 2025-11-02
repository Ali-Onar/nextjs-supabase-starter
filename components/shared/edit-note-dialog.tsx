"use client";

import { useState, useEffect } from "react";
import { Note } from "@/types/helper.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EditNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (noteId: string, title: string, content: string) => void;
  isUpdating: boolean;
}

export function EditNoteDialog({ 
  note, 
  open, 
  onOpenChange, 
  onUpdate, 
  isUpdating 
}: EditNoteDialogProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Update form values when note changes
  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content || "");
    }
  }, [note]);

  function handleSubmit() {
    if (!note) return;
    onUpdate(note.id, editTitle, editContent);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notu Düzenle</DialogTitle>
          <DialogDescription>
            Not başlığını ve içeriğini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Başlık</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Not başlığı..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content">İçerik</Label>
            <textarea
              id="edit-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Not içeriği..."
              className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

