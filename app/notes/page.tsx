"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

interface Recording {
  id: string;
  subject_id: string;
  title: string;
  duration: number;
  date: string;
  transcribed: boolean;
}

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isValidUUID = (id: string) => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };
    const fetchRecordings = async () => {
      setLoading(true);
      setError(null);
      if (subjectId && !isValidUUID(subjectId)) {
        setError("Invalid subject ID");
        setRecordings([]);
        setLoading(false);
        return;
      }
      let query = supabase.from("recordings").select("id,subject_id,title,duration,date,transcribed").order("date", { ascending: false });
      if (subjectId) query = query.eq("subject_id", subjectId);
      const { data, error } = await query;
      if (error) setError(error.message);
      else setRecordings(data || []);
      setLoading(false);
    };
    fetchRecordings();
  }, [subjectId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">My Recordings</h1>
        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-center text-red-500 py-8">{error}</div>}
        {!loading && recordings.length === 0 && (
          <div className="text-center text-gray-400 py-8">No recordings found.</div>
        )}
        <ul className="space-y-3">
          {recordings.map((rec) => (
            <li
              key={rec.id}
              className="bg-white rounded-xl shadow p-3 flex flex-col gap-1 cursor-pointer hover:bg-purple-50 transition relative"
              onClick={() => router.push(`/note-detail?recordingId=${rec.id}`)}
            >
              {/* Badge transcribed */}
              {rec.transcribed && (
                <span className="absolute top-2 right-3 bg-purple-100 text-purple-600 text-[11px] px-2 py-0.5 rounded-full font-medium">✓ Transcribed</span>
              )}
              {/* Subject name only */}
              <span className="font-semibold text-base text-gray-900 mb-1 capitalize">
                {rec.title || "Recording"}
              </span>
              {/* Date & duration row */}
              <div className="flex justify-between items-end w-full mt-1">
                <span className="text-xs text-gray-400">{new Date(rec.date).toLocaleDateString()}</span>
                <span className="text-xs text-gray-700 font-semibold">{Math.floor(rec.duration/60)}:{(rec.duration%60).toString().padStart(2,"0")}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white"><div className="text-center py-8">Loading...</div></div>}>
      <NotesContent />
    </Suspense>
  );
}
