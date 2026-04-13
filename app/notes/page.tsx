"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";

interface Note {
  id: string;
  subject_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

function NotesContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [subjectId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subjects for display
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, icon, color");
      
      if (subjectsData) {
        setSubjects(subjectsData);
      }

      // Fetch notes
      let query = supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error: notesError } = await query;
      
      if (notesError) throw notesError;
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const getSubjectInfo = (subId: string) => {
    return subjects.find((s) => s.id === subId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
            title="Back to home"
          >
            <Plus className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-500">Loading your notes...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && notes.length === 0 && (
          <div className="bg-white rounded-3xl p-12 shadow-sm text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Notes Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Save highlights from your transcriptions to create notes
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg transition-all active:scale-95"
            >
              Start Recording
            </button>
          </div>
        )}

        {/* Notes List */}
        {!loading && !error && notes.length > 0 && (
          <div className="space-y-4">
            {notes.map((note) => {
              const subject = getSubjectInfo(note.subject_id);
              const preview = note.content.substring(0, 120) + (note.content.length > 120 ? "..." : "");
              
              return (
                <button
                  key={note.id}
                  onClick={() => router.push(`/note-view?noteId=${note.id}`)}
                  className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Subject Icon */}
                    <div className="flex-shrink-0 text-3xl">
                      {subject?.icon || "📝"}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {preview}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{subject?.name || "Unknown"}</span>
                        <span>•</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 text-purple-400">
                      →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      }
    >
      <NotesContent />
    </Suspense>
  );
}
