"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, Plus, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
import NotificationToast from "../components/NotificationToast";

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
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; icon: string }>({ show: false, title: '', message: '', icon: '' });

  const showToast = (title: string, message: string, icon: string = '✨') => {
    setToast({ show: true, title, message, icon });
  };

  useEffect(() => {
    fetchNotes();
  }, [subjectId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      // Fetch subjects for display
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name, icon, color");
      
      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
      }
      
      if (subjectsData) {
        setSubjects(subjectsData);
      }

      // Fetch notes - RLS will automatically filter by user_id
      let query = supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error: notesError } = await query;
      
      if (notesError) {
        console.error("Error fetching notes:", notesError);
        throw notesError;
      }
      setNotes(data || []);
    } catch (err: any) {
      console.error("Error in fetchNotes:", err);
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedSubject || !noteTitle.trim() || !noteContent.trim()) {
      showToast("Please fill all fields", "Select a subject, add a title, and write your note", "⚠️");
      return;
    }

    setSavingNote(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("notes")
        .insert([
          {
            user_id: user.id,
            subject_id: selectedSubject,
            title: noteTitle,
            content: noteContent,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error saving note:", error);
        throw error;
      }

      showToast("Success", "Note created successfully", "✅");
      setNoteTitle("");
      setNoteContent("");
      setSelectedSubject("");
      setShowAddNote(false);
      
      // Refresh notes list
      await fetchNotes();
    } catch (err: any) {
      console.error("Error in handleSaveNote:", err);
      showToast("Error", err.message || "Failed to save note", "❌");
    } finally {
      setSavingNote(false);
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          </div>
          <button
            onClick={() => setShowAddNote(true)}
            className="p-2 hover:bg-purple-100 rounded-full transition-colors active:scale-95"
            title="Add new note"
          >
            <Plus className="w-6 h-6 text-purple-600" />
          </button>
        </div>

        {/* Subjects Section */}
        {!loading && !error && subjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
              <button
                onClick={() => router.push("/all-subjects")}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                Manage
                <span>→</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subjects.map((subject) => {
                const noteCount = notes.filter((n) => n.subject_id === subject.id).length;
                return (
                  <button
                    key={subject.id}
                    onClick={() => {
                      // Filter notes by subject
                      router.push(`/notes?subjectId=${subject.id}`);
                    }}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                  >
                    <div className="text-3xl mb-2">{subject.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {noteCount} {noteCount === 1 ? "note" : "notes"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-500">Loading your notes...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <p className="text-sm text-red-500">
              {error === "User not authenticated" 
                ? "Please log in to view your notes"
                : "Make sure the notes table is created in Supabase"}
            </p>
            <button
              onClick={() => fetchNotes()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
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

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Note</h2>
              <button
                onClick={() => setShowAddNote(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Subject Selection - Visual Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Select Subject *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`p-4 rounded-2xl text-left transition-all active:scale-[0.98] ${
                        selectedSubject === subject.id
                          ? "bg-purple-100 border-2 border-purple-500 shadow-md"
                          : "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-3xl mb-2">{subject.icon}</div>
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {subject.name}
                      </h3>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Note Content *
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your notes here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 font-medium"
              >
                {savingNote ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save Note"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <NotificationToast
        show={toast.show}
        title={toast.title}
        message={toast.message}
        icon={toast.icon}
        onClose={() => setToast({ ...toast, show: false })}
      />
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
