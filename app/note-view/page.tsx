"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Trash2, Download, Share2, Loader2, Copy } from "lucide-react";
import { supabase } from "../lib/supabase";
import { fetchWithAuth } from "../lib/fetch-with-auth";
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

function NoteViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");

  const [note, setNote] = useState<Note | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; icon: string }>({ show: false, title: '', message: '', icon: '' });

  const showToast = (title: string, message: string, icon: string = '✨') => {
    setToast({ show: true, title, message, icon });
  };

  useEffect(() => {
    if (!noteId) {
      setError("Note ID not found");
      setLoading(false);
      return;
    }
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch note
      const { data: noteData, error: noteError } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (noteError) throw noteError;
      setNote(noteData);

      // Fetch subject
      if (noteData.subject_id) {
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("*")
          .eq("id", noteData.subject_id)
          .single();

        if (!subjectError && subjectData) {
          setSubject(subjectData);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching note:", err);
      setError(err.message || "Failed to load note");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;

    const confirmed = confirm(
      "Are you sure you want to delete this note? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);

      if (error) throw error;

      showToast("Success", "Note deleted", "✅");
      setTimeout(() => router.push("/notes"), 500);
    } catch (err: any) {
      console.error("Delete error:", err);
      showToast("Error", "Failed to delete note. Please try again.", "❌");
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!note) return;

    const shareText = `${note.title}\n\n${note.content}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: shareText,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("Success", "Note copied to clipboard", "📋");
    }
  };

  const handleDownload = () => {
    if (!note) return;

    const content = `${note.title}\n\nDate: ${new Date(note.created_at).toLocaleDateString()}\n\n${note.content}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Success", "Note downloaded", "✅");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white px-4">
        <div className="text-red-500 text-center mb-4">{error || "Note not found"}</div>
        <button
          onClick={() => router.back()}
          className="text-purple-500 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                title="Share"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                title="Download"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-red-50 rounded-full transition-colors active:scale-95 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-6">
          {/* Note Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-4xl">{subject?.icon || "📝"}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {note.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{subject?.name || "Note"}</span>
                  <span>•</span>
                  <span>
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Note Content */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-xs text-gray-500">
            Last updated{" "}
            {new Date(note.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

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

export default function NoteViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      }
    >
      <NoteViewContent />
    </Suspense>
  );
}
