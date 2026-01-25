"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function AiSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { recordingId, subjectId } = params as { recordingId: string; subjectId: string };

  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordingId) {
      setError("Recording ID not found");
      setIsLoading(false);
      return;
    }
    fetchSummary();
  }, [recordingId]);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to fetch summary');
        setSummary("");
        return;
      }
      const data = await response.json();
      let summaryText = "No summary available";
      if (typeof data.summary === 'string') {
        summaryText = data.summary;
      } else if (data.summary && typeof data.summary === 'object') {
        // If summary is an object (e.g., {id, content, ...})
        if ('content' in data.summary && typeof data.summary.content === 'string') {
          summaryText = data.summary.content;
        } else {
          summaryText = JSON.stringify(data.summary);
        }
      } else if (Array.isArray(data.summary)) {
        summaryText = data.summary.join('\n');
      }
      setSummary(summaryText);
    } catch (error) {
      setError('Failed to load summary');
    } finally {
      setIsLoading(false);
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
                <h1 className="text-xl text-gray-900">AI Summary</h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading summary...</p>
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
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  <ReactMarkdown>
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
