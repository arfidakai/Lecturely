"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Trash2, Download, Share2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Recording {
  id: string;
  subject_id: string;
  title: string;
  duration: number;
  date: string;
  transcribed: boolean;
  audio_url: string;
}

interface Transcription {
  id: string;
  text: string;
  timestamp: number;
  important: boolean;
}

interface Summary {
  id: string;
  content: string;
}

export default function NoteDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");

  const [recording, setRecording] = useState<Recording | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (!recordingId) {
      setError("Recording ID not found");
      setLoading(false);
      return;
    }

    fetchRecordingDetails();
  }, [recordingId]);

  const fetchRecordingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recording
      const { data: recordingData, error: recordingError } = await supabase
        .from("recordings")
        .select("*")
        .eq("id", recordingId)
        .single();

      if (recordingError) throw recordingError;
      setRecording(recordingData);

      // Fetch transcriptions if transcribed
      if (recordingData.transcribed) {
        // console.log("Recording is transcribed, fetching transcription data..."); // Debug log
        
        const { data: transcriptionData, error: transcriptionError } = await supabase
          .from("transcriptions")
          .select("*")
          .eq("recording_id", recordingId)
          .order("timestamp", { ascending: true });

        // console.log("Transcription data:", transcriptionData, "Error:", transcriptionError); // Debug log

        if (!transcriptionError && transcriptionData) {
          setTranscriptions(transcriptionData);
        }

        // Fetch summary if exists (use maybeSingle to avoid error if not found)
        const { data: summaryData, error: summaryError } = await supabase
          .from("summaries")
          .select("*")
          .eq("recording_id", recordingId)
          .maybeSingle();

        // console.log("Summary data:", summaryData, "Error:", summaryError); // Debug log

        if (!summaryError && summaryData) {
          setSummary(summaryData);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching recording details:", err);
      setError(err.message || "Failed to load recording details");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordingId) return;

    const confirmed = confirm(
      "Are you sure you want to delete this recording? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recording");
      }

      router.push("/");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete recording. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleTranscribe = async () => {
    if (!recordingId) return;

    router.push(`/post-record?recordingId=${recordingId}&fromDetail=true`);
  };

  const handleGenerateSummary = async () => {
    if (!recordingId) return;

    setIsGeneratingSummary(true);

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Summary generation error:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleShare = async () => {
    const fullText = transcriptions.map((t) => t.text).join("\n\n");
    const shareText = `${recording?.title}\n\n${fullText}${
      summary ? `\n\nSummary:\n${summary.content}` : ""
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recording?.title || "Recording",
          text: shareText,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Content copied to clipboard!");
    }
  };

  const handleDownload = () => {
    const fullText = transcriptions.map((t) => t.text).join("\n\n");
    const content = `${recording?.title}\n\nDate: ${new Date(
      recording?.date || ""
    ).toLocaleDateString()}\n\n${fullText}${
      summary ? `\n\nSummary:\n${summary.content}` : ""
    }`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recording?.title || "recording"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white px-4">
        <div className="text-red-500 text-center mb-4">{error || "Recording not found"}</div>
        <button
          onClick={() => router.back()}
          className="text-purple-500 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const fullTranscriptionText = transcriptions.map((t) => t.text).join(" ");
  
  // console.log("Component state:", { 
  //   recordingTranscribed: recording?.transcribed,
  //   transcriptionsLength: transcriptions.length,
  //   hasSummary: !!summary,
  //   fullText: fullTranscriptionText.slice(0, 100) + "..."
  // }); // Debug log

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
        <div className="px-4 pt-6 space-y-6">
          {/* Recording Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {recording.title || "Untitled Recording"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                {new Date(recording.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span>
                {Math.floor(recording.duration / 60)}:
                {(recording.duration % 60).toString().padStart(2, "0")}
              </span>
              <span>•</span>
              <span className={recording.transcribed ? "text-green-600" : "text-orange-600"}>
                {recording.transcribed ? "Transcribed" : "Not transcribed"}
              </span>
            </div>
          </div>

          {/* Not Transcribed State */}
          {!recording.transcribed && (
            <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
              <div className="text-4xl mb-4">🎤</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Not Transcribed Yet
              </h2>
              <p className="text-gray-500 mb-6">
                Transcribe this recording to view the text and generate AI summary.
              </p>
              <button
                onClick={handleTranscribe}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg transition-all active:scale-95"
              >
                Transcribe Now
              </button>
            </div>
          )}

          {/* Transcription */}
          {recording.transcribed && (
            <div className="space-y-4">
              {transcriptions.length > 0 ? (
                <>
                  {/* Transcription Card - Clickable */}
                  <button
                    onClick={() => router.push(`/transcription?recordingId=${recordingId}&subjectId=${recording.subject_id}`)}
                    className="w-full bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Transcription</h2>
                      <div className="text-purple-600 text-sm">View →</div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed line-clamp-3">
                        {fullTranscriptionText}
                      </p>
                    </div>
                  </button>

                  {/* Summary Card - Clickable or Generate */}
                  {summary ? (
                    <button
                      onClick={() => router.push(`/ai-summary?recordingId=${recordingId}&subjectId=${recording.subject_id}`)}
                      className="w-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left border border-purple-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
                        </div>
                        <div className="text-purple-600 text-sm">View →</div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed line-clamp-3">
                          {summary.content}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-6 shadow-sm border border-purple-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm mb-4">Generate an AI summary of this transcription</p>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating Summary...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Summary</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Transcription Available</h2>
                    <p className="text-gray-500 mb-4">Click to view the transcription content</p>
                    <button
                      onClick={() => router.push(`/transcription?recordingId=${recordingId}&subjectId=${recording.subject_id}`)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-colors"
                    >
                      View Transcription
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
