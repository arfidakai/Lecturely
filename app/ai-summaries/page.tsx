"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";

interface Summary {
  id: string;
  recording_id: string;
  created_at: string;
  content: string;
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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError(t.common.failed);
        setLoading(false);
        return;
      }
      // Fetch summaries for this user by joining recordings table
      const { data, error } = await supabase
        .from("summaries")
        .select("id,recording_id,created_at,content,recordings(user_id)")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Filter only summaries where recordings.user_id === user.id
      const filtered = (data || []).filter((s: any) => s.recordings && s.recordings.user_id === user.id);
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
            {summaries.map((summary) => (
              <li
                key={summary.id}
                className="bg-white rounded-xl shadow p-3 flex flex-col gap-1 cursor-pointer hover:bg-purple-50 transition"
                onClick={() => router.push(`/ai-summary/${summary.recording_id}`)}
              >
                <span className="font-semibold text-base text-gray-900 mb-1 line-clamp-1">
                  {summary.content.slice(0, 60)}...
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(summary.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
