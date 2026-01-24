"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";

export default function TranscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const subjectId = searchParams.get("subjectId");

  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('Failed to fetch transcription');
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

  const handleSegmentClick = (segmentId: string) => {
    setPlayingSegment(playingSegment === segmentId ? null : segmentId);
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
              {!isLoading && !error && (
                <button
                  onClick={handleGenerateSummary}
                  className="p-2.5 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}
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
