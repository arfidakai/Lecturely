"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function AiSummaryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { recordingId } = params as { recordingId: string };
  const { t } = useLanguage();

  const [summaries, setSummaries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[AI Summary Detail] recordingId:", recordingId);
    if (!recordingId) {
      setError(t.common.failed);
      setIsLoading(false);
      return;
    }
    fetchSummary();
  }, [recordingId]);

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("summaries")
        .select("content")
        .eq("recording_id", recordingId);
      console.log("[AI Summary Detail] Supabase data:", data, "error:", error);
      if (error || !data || data.length === 0) {
        setError(t.aiSummary.noSummary);
        setSummaries([]);
        return;
      }
      // Filter out empty content
      const validSummaries = data
        .map((row: any) => row.content)
        .filter((c: string) => c && c.trim() !== "");
      if (validSummaries.length === 0) {
        setError(t.aiSummary.noSummary);
        setSummaries([]);
        return;
      }
      setSummaries(validSummaries);
    } catch (error) {
      setError(t.common.failed);
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
                <h1 className="text-xl text-gray-900">{t.aiSummary.title}</h1>
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
