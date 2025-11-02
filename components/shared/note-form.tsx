'use client';

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "../dropzone";
import { Button } from "../ui/button";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { createNote, updateNoteImage } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";

const NoteForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useSupabaseUpload({
    bucketName: "note-images",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 1024 * 1024 * 10, // 10MB
    upsert: false
  });


  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
        const result = await createNote(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);

            return;
        }

        const file = upload.files[0];

        if (file && file.errors.length === 0 && result.noteId) {
            const supabase = createClient();
            const storagePath = `${result.userId}/${result.noteId}/${file.name}`;

            const { error: uploadError } = await supabase.storage.from("note-images").upload(storagePath, file);

            if (uploadError) {
                setError(uploadError.message);

                return;
            }

            const updateResponse = await updateNoteImage(result.noteId, storagePath);

            if (updateResponse.error) {
                setError(updateResponse.error);

                return;
            }
        }

        const form = document.getElementById("note-form") as HTMLFormElement;
        form.reset();
        upload.setFiles([]);

    } catch (error) {
        const err = error as Error;
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a new note</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="note-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter a title"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              name="content"
              placeholder="Enter note content"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <Dropzone {...upload} className="mt-1">
              <DropzoneEmptyState />
              <DropzoneContent showUploadButton={false} />
            </Dropzone>
            <p className="text-xs text-muted-foreground">
              Only 1 image is allowed. It will be uploaded when you create the
              note.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating" : "Create note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NoteForm;
