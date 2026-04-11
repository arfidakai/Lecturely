"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Trash2, Download, Share2, Sparkles, Loader2, Highlighter, X, Save } from "lucide-react";
import { supabase } from "../lib/supabase";
import { fetchWithAuth } from "../lib/fetch-with-auth";
import { getSelectionRange, getHighlightColorStyle, type HighlightRange } from "../lib/highlightUtils";
import NotificationToast from "../components/NotificationToast";

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

function NoteDetailContent() {
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
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; icon: string }>({ show: false, title: '', message: '', icon: '' });

  const colors = ["yellow", "orange", "red", "green", "blue", "purple", "pink"];

  const showToast = (title: string, message: string, icon: string = '✨') => {
    setToast({ show: true, title, message, icon });
  };

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
          // Set transcriptionId from first transcription for highlights
          if (transcriptionData.length > 0) {
            setTranscriptionId(transcriptionData[0].id);
            // Fetch highlights for this transcription
            const { data: highlightsData } = await supabase
              .from("highlights")
              .select("id, start_offset, end_offset, color")
              .eq("transcription_id", transcriptionData[0].id);
            
            if (highlightsData) {
              setHighlights(
                highlightsData.map((h: any) => ({
                  id: h.id,
                  startOffset: h.start_offset,
                  endOffset: h.end_offset,
                  color: h.color,
                }))
              );
            }
          }
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
      const response = await fetchWithAuth(`/api/recordings/${recordingId}`, {
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
      const response = await fetchWithAuth("/api/summary", {
        method: "POST",
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

  const handleTextSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const selection = getSelectionRange(container);
    if (selection && selection.text.length > 0) {
      setSelectedText({ start: selection.start, end: selection.end });
      setShowHighlightPicker(true);
    }
  };

  const handleAddHighlight = async (color: string) => {
    if (!selectedText || !transcriptionId) return;
    
    setIsHighlighting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Error', 'User not authenticated', '❌');
        return;
      }

      const { error } = await supabase.from("highlights").insert([
        {
          transcription_id: transcriptionId,
          user_id: user.id,
          start_offset: selectedText.start,
          end_offset: selectedText.end,
          color: color,
        },
      ]);

      if (error && error.message?.includes('transcription_id')) {
        showToast('Setup Required', 'Please run the database migration first. Check documentation.', '⚠️');
        setIsHighlighting(false);
        return;
      }

      if (error) {
        console.error('Highlight error:', error);
        showToast('Error', 'Failed to add highlight: ' + (error.message || 'Unknown error'), '❌');
      } else {
        // Refresh highlights
        const { data: highlightsData } = await supabase
          .from("highlights")
          .select("id, start_offset, end_offset, color")
          .eq("transcription_id", transcriptionId);
        
        if (highlightsData) {
          setHighlights(
            highlightsData.map((h: any) => ({
              id: h.id,
              startOffset: h.start_offset,
              endOffset: h.end_offset,
              color: h.color,
            }))
          );
        }
        
        showToast('Success', 'Text highlighted successfully', '🎨');
        setSelectedText(null);
        setShowHighlightPicker(false);
      }
    } catch (err) {
      console.error('Highlight error:', err);
      showToast('Error', 'Failed to add highlight', '❌');
    } finally {
      setIsHighlighting(false);
    }
  };

  const handleDeleteHighlight = async (highlightId: string | undefined) => {
    if (!highlightId) return;
    try {
      const { error } = await supabase
        .from("highlights")
        .delete()
        .eq("id", highlightId);

      if (error) {
        showToast('Error', 'Failed to delete highlight', '❌');
      } else {
        setHighlights(highlights.filter(h => h.id !== highlightId));
        showToast('Success', 'Highlight removed', '✨');
      }
    } catch (err) {
      showToast('Error', 'Failed to delete highlight', '❌');
    }
  };

  const handleSaveAsNote = async () => {
    if (!recording || !transcriptionId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Error', 'User not authenticated', '❌');
        return;
      }

      // Collect all highlighted text
      const fullText = transcriptions.map((t) => t.text).join(" ");
      let highlightedContent = "";
      
      if (highlights.length > 0) {
        const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
        highlightedContent = sorted
          .map((h) => fullText.substring(h.startOffset, h.endOffset))
          .join("\n");
      }

      const noteTitle = `${recording.title} - Highlights`;
      const noteContent = highlightedContent || fullText;

      const { error } = await supabase.from("notes").insert([
        {
          user_id: user.id,
          subject_id: recording.subject_id,
          title: noteTitle,
          content: noteContent,
        },
      ]);

      if (error) {
        console.error('Save note error:', error);
        showToast('Error', 'Failed to save note', '❌');
      } else {
        showToast('Success', 'Saved to notes', '📝');
      }
    } catch (err) {
      console.error('Save note error:', err);
      showToast('Error', 'Failed to save note', '❌');
    }
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
                onClick={handleSaveAsNote}
                className="p-2 hover:bg-purple-50 rounded-full transition-colors active:scale-95"
                title="Save as note"
              >
                <Save className="w-5 h-5 text-purple-600" />
              </button>
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
                  {/* Transcription Card - With Highlights */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcription</h2>
                    
                    {/* Highlight instruction */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                      <Highlighter className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">Select text to highlight</p>
                    </div>

                    {/* Content with highlights and text selection handler */}
                    <div className="bg-gray-50 rounded-2xl p-6 relative" onMouseUp={handleTextSelect}>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {transcriptions.length > 0 ? (
                          (() => {
                            const fullText = transcriptions.map((t) => t.text).join(" ");
                            
                            if (highlights.length === 0) {
                              return <>{fullText}</>;
                            }

                            const sorted = [...highlights].sort(
                              (a, b) => a.startOffset - b.startOffset
                            );

                            let elements: (string | React.ReactElement)[] = [];
                            let lastOffset = 0;

                            sorted.forEach((highlight, i) => {
                              // Add text before highlight
                              if (highlight.startOffset > lastOffset) {
                                const beforeText = fullText.substring(
                                  lastOffset,
                                  highlight.startOffset
                                );
                                elements.push(
                                  <span key={`text-before-${i}`}>{beforeText}</span>
                                );
                              }

                              // Add highlighted text with delete button
                              const colorStyle = getHighlightColorStyle(highlight.color);
                              const highlightedText = fullText.substring(
                                highlight.startOffset,
                                highlight.endOffset
                              );
                              elements.push(
                                <span key={`highlight-${highlight.id}`} className="relative group inline">
                                  <mark
                                    style={{
                                      ...colorStyle,
                                      borderRadius: "2px",
                                      padding: "2px 4px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {highlightedText}
                                  </mark>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteHighlight(highlight.id);
                                    }}
                                    className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                                  >
                                    <X className="w-3 h-3 inline mr-1" />
                                    Delete
                                  </button>
                                </span>
                              );

                              lastOffset = highlight.endOffset;
                            });

                            // Add remaining text
                            if (lastOffset < fullText.length) {
                              const remainingText = fullText.substring(lastOffset);
                              elements.push(
                                <span key="text-remaining">{remainingText}</span>
                              );
                            }

                            return <>{elements}</>;
                          })()
                        ) : (
                          "No transcription available"
                        )}
                      </div>

                      {/* Highlight picker */}
                      {showHighlightPicker && selectedText && (
                        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl p-3 z-50 grid grid-cols-4 gap-2 w-48">
                          {colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleAddHighlight(color)}
                              disabled={isHighlighting}
                              className="relative group"
                              title={`Highlight in ${color}`}
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
                                    : "bg-pink-300 border-pink-400"
                                } ${isHighlighting ? "opacity-50" : ""}`}
                              />
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setSelectedText(null);
                              setShowHighlightPicker(false);
                            }}
                            className="col-span-4 text-xs text-gray-500 hover:text-gray-700 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

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
                      onClick={() => router.push(`/transcription/${recordingId}/${recording.subject_id}`)}
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

export default function NoteDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    }>
      <NoteDetailContent />
    </Suspense>
  );
}
