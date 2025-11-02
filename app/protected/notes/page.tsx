import NoteForm from "@/components/shared/note-form";
import NotesList from "@/components/shared/notes-list";
import { getUserNotes } from "@/lib/supabase/actions";

export  default async function NotesPage() {
    const { notes, error } = await getUserNotes();

    if (error) {
        console.error('Error fetching notes:', error);
    }

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full">
                <h1 className="text-2xl font-bold">Notes</h1>
                <p className="text-muted-foreground">Create and manage your notes</p>
            </div>

            <div className="w-full">
                <NoteForm />
            </div>

            <div className="w-full">
                <NotesList notes={notes} />
            </div>

        </div>
    )
}