"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, Loader2, Plus, Copy, Check, Star } from "lucide-react";

export default function AiSummaryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { recordingId } = params as { recordingId: string };
  const { t } = useLanguage();

  const [summaries, setSummaries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordingData, setRecordingData] = useState<any>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [isMarkingImportant, setIsMarkingImportant] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>("none");
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = ["none", "yellow", "orange", "red", "green", "blue", "purple", "pink"];

  useEffect(() => {
    console.log("[AI Summary Detail] recordingId:", recordingId);
    if (!recordingId) {
      setError(t.common.failed);
      setIsLoading(false);
      return;
    }
    fetchSummaryAndRecording();
  }, [recordingId]);

  const fetchSummaryAndRecording = async () => {
    try {
      // Fetch recording data for subject_id
      const { data: recData, error: recError } = await supabase
        .from("recordings")
        .select("id, subject_id, title")
        .eq("id", recordingId)
        .single();

      if (recError || !recData) {
        setError(t.common.failed);
        setIsLoading(false);
        return;
      }
      setRecordingData(recData);

      // Fetch summaries
      const { data, error } = await supabase
        .from("summaries")
        .select("id, content, is_important, highlight_color")
        .eq("recording_id", recordingId);
      console.log("[AI Summary Detail] Supabase data:", data, "error:", error);
      if (error || !data || data.length === 0) {
        setError(t.aiSummary.noSummary);
        setSummaries([]);
        return;
      }
      // Filter out empty content and get first summary's id and importance status
      const validSummaries = data
        .map((row: any) => row.content)
        .filter((c: string) => c && c.trim() !== "");
      if (validSummaries.length === 0) {
        setError(t.aiSummary.noSummary);
        setSummaries([]);
        return;
      }
      setSummaries(validSummaries);
      setSummaryId(data[0].id);
      setIsImportant(data[0].is_important || false);
      setHighlightColor(data[0].highlight_color || "none");
    } catch (error) {
      setError(t.common.failed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summaries.length) return;
    try {
      const textToCopy = summaries.join("\n\n---\n\n");
      await navigator.clipboard.writeText(textToCopy);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      alert("Failed to copy");
    }
  };

  const handleMarkImportant = async () => {
    if (!summaryId) return;
    setIsMarkingImportant(true);
    try {
      const newImportantStatus = !isImportant;
      const { error } = await supabase
        .from("summaries")
        .update({ is_important: newImportantStatus })
        .eq("id", summaryId);

      if (error) {
        alert("Failed to update");
      } else {
        setIsImportant(newImportantStatus);
        // Show toast message
        const message = newImportantStatus
          ? t.aiSummary.markedImportant
          : t.aiSummary.removedFromImportant;
        alert(message);
      }
    } catch (err) {
      alert("Failed to update");
    } finally {
      setIsMarkingImportant(false);
    }
  };

  const handleHighlightColorChange = async (color: string) => {
    if (!summaryId) return;
    setIsUpdatingColor(true);
    try {
      const { error } = await supabase
        .from("summaries")
        .update({ highlight_color: color })
        .eq("id", summaryId);

      if (error) {
        alert("Failed to update color");
      } else {
        setHighlightColor(color);
        setShowColorPicker(false);
      }
    } catch (err) {
      alert("Failed to update color");
    } finally {
      setIsUpdatingColor(false);
    }
  };

  const handleSaveAsNote = async () => {
    if (!recordingData || !summaries.length) {
      alert(t.aiSummary.addToNotesError);
      return;
    }

    setIsSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("User not authenticated");
        return;
      }

      // Combine all summaries into one note
      const combinedContent = summaries.join("\n\n---\n\n");
      const noteTitle = `Summary: ${recordingData.title || "Recording"}`;

      const { data, error } = await supabase
        .from("notes")
        .insert([
          {
            user_id: user.id,
            subject_id: recordingData.subject_id,
            title: noteTitle,
            content: combinedContent,
            created_at: new Date().toISOString(),
          }
        ])
        .select();

      if (error) {
        alert(t.aiSummary.addToNotesError + ": " + error.message);
      } else {
        // Show success and redirect to note detail
        if (data && data[0]) {
          router.push(`/note-detail?noteId=${data[0].id}`);
        }
      }
    } catch (err) {
      alert(t.aiSummary.addToNotesError);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 border-b border-gray-100 bg-gradient-to-b from-purple-50 to-white">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl text-gray-900">{t.aiSummary.title}</h1>
              </div>
              <button
                onClick={handleSaveAsNote}
                disabled={isSavingNote || !summaries.length}
                className="p-2 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                title={t.aiSummary.addToNotes}
              >
                <Plus className="w-5 h-5 text-purple-600" />
              </button>
              <button
                onClick={handleMarkImportant}
                disabled={isMarkingImportant || !summaries.length}
                className="p-2 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                title={isImportant ? t.aiSummary.removeFromImportant : t.aiSummary.markImportant}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isImportant ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={handleCopySummary}
                disabled={!summaries.length}
                className="p-2 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                title="Copy to clipboard"
              >
                {copiedToClipboard ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-purple-600" />
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  disabled={!summaries.length}
                  className="p-2 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                  title={t.aiSummary.highlightColor}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 border-gray-300 ${
                      highlightColor === "yellow"
                        ? "bg-yellow-300"
                        : highlightColor === "orange"
                        ? "bg-orange-300"
                        : highlightColor === "red"
                        ? "bg-red-300"
                        : highlightColor === "green"
                        ? "bg-green-300"
                        : highlightColor === "blue"
                        ? "bg-blue-300"
                        : highlightColor === "purple"
                        ? "bg-purple-300"
                        : highlightColor === "pink"
                        ? "bg-pink-300"
                        : "bg-gray-200"
                    }`}
                  />
                </button>
                {showColorPicker && (
                  <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg p-3 z-50 grid grid-cols-4 gap-2 w-40">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleHighlightColorChange(color)}
                        disabled={isUpdatingColor}
                        className="relative group"
                        title={t.aiSummary.colors[color as keyof typeof t.aiSummary.colors]}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                            color === "yellow"
                              ? "bg-yellow-300 border-yellow-400"
                              : color === "orange"
                              ? "bg-orange-300 border-orange-400"
                              : color === "red"
                              ? "bg-red-300 border-red-400"
                              : color === "green"
                              ? "bg-green-300 border-green-400"
                              : color === "blue"
                              ? "bg-blue-300 border-blue-400"
                              : color === "purple"
                              ? "bg-purple-300 border-purple-400"
                              : color === "pink"
                              ? "bg-pink-300 border-pink-400"
                              : "bg-gray-200 border-gray-300"
                          } ${highlightColor === color ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500">{t.aiSummary.loading}</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4 text-center">
                  <p className="font-medium">{t.common.error}</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl"
                >
                  {t.common.goBack}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6">
                {summaries.length > 0 ? (
                  summaries.map((summary, idx) => (
                    <div key={idx} className="prose prose-sm max-w-none text-gray-700 mb-8">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 italic text-center">{t.aiSummary.noSummary}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
