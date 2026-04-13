"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ChevronLeft, Loader2, Sparkles, Bell, Share2, Trash2, Home, Highlighter, X, FileText } from "lucide-react";
import { fetchWithAuth } from "../../../lib/fetch-with-auth";
import { supabase } from "../../../lib/supabase";
import { getSelectionRange, getHighlightColorStyle, type HighlightRange } from "../../../lib/highlightUtils";
import NotificationToast from "../../../components/NotificationToast";

export default function TranscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const { recordingId, subjectId } = params as { recordingId: string; subjectId: string };

  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; icon: string }>({ show: false, title: '', message: '', icon: '' });
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const colors = ["yellow", "orange", "red", "green", "blue", "purple", "pink"];

  const showToast = (title: string, message: string, icon: string = '✨') => {
    setToast({ show: true, title, message, icon });
  };

  useEffect(() => {
    if (!recordingId) {
      setError("Recording ID not found");
      setIsLoading(false);
      return;
    }
    fetchTranscription();
  }, [recordingId]);

  const fetchTranscription = async () => {
    try {
      const response = await fetchWithAuth(`/api/transcriptions/${recordingId}`, {
        method: 'GET',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setError(errorData.error || 'Transcription not found');
        } else {
          setError(errorData.error || 'Failed to fetch transcription');
        }
        setTranscription("");
        return;
      }
      const data = await response.json();
      setTranscription(data.text || "No transcription available");
      setTranscriptionId(data.id || null);

      // Fetch highlights for this transcription
      if (data.id) {
        const { data: highlightsData } = await supabase
          .from("highlights")
          .select("id, start_offset, end_offset, color")
          .eq("transcription_id", data.id);
        
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
    } catch (error) {
      console.error('Error fetching transcription:', error);
      setError('Failed to load transcription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    router.push(`/ai-summary/${recordingId}/${subjectId}`);
  };

  const handleShare = () => {
    if (navigator.share && transcription) {
      navigator.share({
        title: 'Transcription',
        text: transcription,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(transcription).then(() => {
        showToast('Success', 'Transcription copied to clipboard', '📋');
      }).catch(() => {
        showToast('Error', 'Failed to copy transcription', '❌');
      });
    }
  };

  const handleDownload = () => {
    if (!transcription) return;
    const content = `Transcription\n\nDate: ${new Date().toLocaleDateString()}\n\n${transcription}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${recordingId}.txt`;
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

  const handleDelete = async () => {
    if (!recordingId) return;
    const confirmed = confirm(
      'Are you sure you want to delete this recording? This action cannot be undone.'
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      const response = await fetchWithAuth(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }
      showToast('Success', 'Recording deleted', '✅');
      setTimeout(() => router.push('/'), 500);
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Error', 'Failed to delete recording. Please try again.', '❌');
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!transcription) {
      showToast('Error', 'No transcription to export', '❌');
      return;
    }

    setIsExportingPDF(true);
    try {
      const content = `TRANSCRIPTION\n\nDate: ${new Date().toLocaleDateString()}\n\n${transcription}`;
      
      // For now, we'll use a simple text-based approach
      // If html2pdf is available, we can use it for better formatting
      const element = document.createElement('div');
      element.innerHTML = `
        <h1>Transcription</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <hr/>
        <pre style="white-space: pre-wrap; word-wrap: break-word;">${transcription}</pre>
      `;

      try {
        const html2pdf = (window as any).html2pdf;
        if (html2pdf) {
          html2pdf.default()
            .set({ margin: 10, filename: 'transcription.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' } })
            .from(element)
            .save();
          showToast('Success', 'PDF exported successfully', '✅');
        } else {
          throw new Error('PDF library not available');
        }
      } catch (err) {
        // Fallback: download as text file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcription.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Success', 'Transcription exported as text', '✅');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Error', 'Failed to export transcription', '❌');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 border-b border-gray-100 bg-gradient-to-b from-purple-50 to-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                title="Go back"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Transcription</h1>
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                title="Go to home"
              >
                <Home className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleShare}
                className="flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
                title="Share transcription"
              >
                <Share2 className="w-4 h-4 text-gray-700" />
                <span className="text-xs text-gray-700">Share</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex-1 p-2 hover:bg-purple-50 rounded-lg transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                title="Export as PDF"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-600">Export</span>
              </button>
              <button
                onClick={() => router.push(`/reminder?recordingId=${recordingId}`)}
                className="flex-1 p-2 hover:bg-purple-50 rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
                title="Set reminder"
              >
                <Bell className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-600">Remind</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 p-2 hover:bg-red-50 rounded-lg transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                title="Delete recording"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-500">Delete</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading transcription...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4 text-center">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                  {error === 'No transcription found' && (
                    <p className="text-xs text-gray-500 mt-2">Belum ada transkripsi untuk rekaman ini.<br />Silakan generate atau tunggu proses transkripsi.</p>
                  )}
                </div>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div>
                {/* Highlight instruction */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <Highlighter className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">Select text to highlight</p>
                </div>

                {/* Content with highlights and text selection handler */}
                <div className="bg-gray-50 rounded-2xl p-6 relative" onMouseUp={handleTextSelect}>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {transcription.length > 0 ? (
                      (() => {
                        if (highlights.length === 0) {
                          return <>{transcription}</>;
                        }

                        const sorted = [...highlights].sort(
                          (a, b) => a.startOffset - b.startOffset
                        );

                        let elements: (string | React.ReactElement)[] = [];
                        let lastOffset = 0;

                        sorted.forEach((highlight, i) => {
                          // Add text before highlight
                          if (highlight.startOffset > lastOffset) {
                            const beforeText = transcription.substring(
                              lastOffset,
                              highlight.startOffset
                            );
                            elements.push(
                              <span key={`text-before-${i}`}>{beforeText}</span>
                            );
                          }

                          // Add highlighted text with delete button
                          const colorStyle = getHighlightColorStyle(highlight.color);
                          const highlightedText = transcription.substring(
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
                        if (lastOffset < transcription.length) {
                          const remainingText = transcription.substring(lastOffset);
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
            )}
          </div>

          {/* Generate Summary Button */}
          {!isLoading && !error && (
            <div className="px-6 pb-6">
              <button
                onClick={handleGenerateSummary}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-2xl hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Generate AI Summary</span>
              </button>
            </div>
          )}

          {/* Info Banner */}
          {!isLoading && !error && (
            <div className="px-6 pb-6">
              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-purple-700">
                  ✨ Click the sparkle icon to generate AI summary
                </p>
              </div>
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
