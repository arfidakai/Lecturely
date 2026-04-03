"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
import { Star } from "lucide-react";

interface Summary {
  id: string;
  recording_id: string;
  created_at: string;
  content: string;
  is_important: boolean;
  highlight_color: string;
}

export default function AiSummariesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError(t.common.failed);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("summaries")
        .select("id,recording_id,created_at,content,is_important,highlight_color,recordings(user_id)")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Filter only summaries where recordings.user_id === user.id
      const filtered = (data || []).filter((s: any) => s.recordings && s.recordings.user_id === user.id).map((s: any) => ({
        id: s.id,
        recording_id: s.recording_id,
        created_at: s.created_at,
        content: s.content,
        is_important: s.is_important || false,
        highlight_color: s.highlight_color || "none",
      }));
      setSummaries(filtered);
      setLoading(false);
    };
    fetchSummaries();
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
          >
            {/* Back icon */}
            <span className="text-lg">←</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center">
            {t.aiSummary.title} {t.common.seeAll}
          </h1>
        </div>
        {loading ? (
          <div className="text-center py-8">{t.notes.loadingRecordings}</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : summaries.length === 0 ? (
          <div className="text-center text-gray-400 py-8">{t.aiSummary.noSummary}</div>
        ) : (
          <ul className="space-y-3">
            {summaries.map((summary) => {
              const getHighlightStyle = (color: string) => {
                switch (color) {
                  case "yellow":
                    return "bg-yellow-300";
                  case "orange":
                    return "bg-orange-300";
                  case "red":
                    return "bg-red-300";
                  case "green":
                    return "bg-green-300";
                  case "blue":
                    return "bg-blue-300";
                  case "purple":
                    return "bg-purple-300";
                  case "pink":
                    return "bg-pink-300";
                  default:
                    return "";
                }
              };
              return (
                <li
                  key={summary.id}
                  className={`rounded-xl shadow overflow-hidden cursor-pointer transition hover:shadow-lg ${
                    summary.is_important
                      ? "border-2 border-yellow-300"
                      : "border border-gray-100"
                  }`}
                  onClick={() => router.push(`/ai-summary/${summary.recording_id}`)}
                >
                  {summary.highlight_color !== "none" && (
                    <div className={`h-1 ${getHighlightStyle(summary.highlight_color)}`} />
                  )}
                  <div className={`p-3 flex flex-col gap-1 ${
                    summary.is_important
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50"
                      : "bg-white"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-semibold text-base mb-1 line-clamp-1 flex-1 ${
                        summary.is_important ? "text-orange-900" : "text-gray-900"
                      }`}>
                        {summary.content.slice(0, 60)}...
                      </span>
                      {summary.is_important && (
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      summary.is_important ? "text-orange-600" : "text-gray-400"
                    }`}>
                      {new Date(summary.created_at).toLocaleString()}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
