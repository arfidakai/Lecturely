"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, Sparkles, Download, Share2, Trash2 } from "lucide-react";

export default function TranscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const subjectId = searchParams.get("subjectId");

  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!recordingId) {
      setError("Recording ID not found");
      setIsLoading(false);
      return;
    }

    // Fetch transcription from database
    fetchTranscription();
  }, [recordingId]);

  const fetchTranscription = async () => {
    try {
      const response = await fetch(`/api/transcriptions/${recordingId}`);
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
    } catch (error) {
      console.error('Error fetching transcription:', error);
      setError('Failed to load transcription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    router.push(`/ai-summary?recordingId=${recordingId}&subjectId=${subjectId}`);
  };

  const handleShare = () => {
    if (navigator.share && transcription) {
      navigator.share({
        title: 'Transcription',
        text: transcription,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(transcription).then(() => {
        alert('Transcription copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy transcription');
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

  const handleDelete = async () => {
    if (!recordingId) return;

    const confirmed = confirm(
      'Are you sure you want to delete this recording? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }

      router.push('/');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete recording. Please try again.');
      setIsDeleting(false);
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
                <h1 className="text-xl text-gray-900">Transcription</h1>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              {/* Action buttons */}
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
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {transcription}
                </p>
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
    </div>
  );
}
