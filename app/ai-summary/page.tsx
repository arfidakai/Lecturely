"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, Download, Share2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { fetchWithAuth } from "../lib/fetch-with-auth";
import { useLanguage } from "../contexts/LanguageContext";

function AISummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const subjectId = searchParams.get("subjectId");
  const { t } = useLanguage();

  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (!recordingId) {
        setError(t.common.failed);
        setIsLoading(false);
        return;
      }

    checkAndGenerateSummary();
  }, [recordingId]);

  const checkAndGenerateSummary = async () => {
    try {
        const checkResponse = await fetchWithAuth(`/api/summary?recordingId=${recordingId}`, {
        method: 'GET',
      });
      
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        setSummary(data.summary.content);
        setIsLoading(false);
      } else if (checkResponse.status === 404) {
        await generateSummary();
      } else {
          throw new Error(t.common.failed);
      }
    } catch (error) {
      console.error('Error checking summary:', error);
        setError(t.common.failed);
      setIsLoading(false);
    }
  };

  const generateSummary = async () => {
    setIsGenerating(true);
    setIsLoading(true);
    
    try {
      const response = await fetchWithAuth('/api/summary', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      });

      if (!response.ok) {
          throw new Error(t.common.failed);
      }

      const data = await response.json();
      setSummary(data.summary.content);
    } catch (error) {
      console.error('Error generating summary:', error);
        setError(t.common.failed);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
            title: t.aiSummary.title,
          text: summary,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(summary);
        alert(t.common.copied);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${recordingId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-purple overflow-hidden" style={{ minHeight: 700, boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.10)' }}>
        <div className="h-full flex flex-col bg-white">
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
                <p className="text-xs text-gray-500">
                    {isGenerating ? t.common.generating : t.common.poweredBy}
                </p>
              </div>
              {!isLoading && !error && (
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2.5 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors active:scale-95"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2.5 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500 text-center">
                   {isGenerating ? t.common.generating : t.aiSummary.checkingSummary}
                </p>
                <p className="text-xs text-gray-400 text-center mt-2">
                  {t.aiSummary.takeFewSeconds}
                </p>
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
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100">
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-purple-700 prose-li:text-gray-700">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Info Banner */}
          {!isLoading && !error && (
            <div className="px-6 pb-6">
              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-purple-700">
                    {t.common.aiBanner}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AISummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    }>
      <AISummaryContent />
    </Suspense>
  );
}
