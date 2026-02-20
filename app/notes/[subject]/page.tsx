"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getUUIDFromSlug } from "../../lib/subjectMapping";
function isUUID(str: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}
import { ChevronLeft, Mic, Search, X } from "lucide-react";

interface Recording {
  id: string;
  subject_id: string;
  title: string;
  duration: number;
  date: string;
  transcribed: boolean;
}

export default function SubjectNotesPage({ params }: { params: Promise<{ subject: string }> }) {
  const router = useRouter();
  const [subjectSlug, setSubjectSlug] = useState<string>("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setSubjectSlug(p.subject));
  }, [params]);

  useEffect(() => {
    if (!subjectSlug) return;

    const fetchRecordings = async () => {
      setLoading(true);
      setError(null);


      let subjectId = "";
      if (isUUID(subjectSlug)) {
        subjectId = subjectSlug;
      } else {
        const uuid = getUUIDFromSlug(subjectSlug);
        if (uuid) {
          subjectId = uuid;
        } else {
          setError("Subject not found");
          setLoading(false);
          return;
        }
      }

      if (!subjectId) {
        setError("Subject not found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("recordings")
        .select("id,subject_id,title,duration,date,transcribed")
        .eq("subject_id", subjectId)
        .order("date", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setRecordings(data || []);
      }
      setLoading(false);
    };

    fetchRecordings();
  }, [subjectSlug]);

  const getSubjectName = (slug: string) => {
    // TODO: Optionally fetch subject name from DB if UUID
    const names: Record<string, string> = {
      'computer-science': 'Computer Science',
      'mathematics': 'Mathematics',
      'physics': 'Physics',
      'literature': 'Literature',
    };
    if (isUUID(slug)) return '';
    return names[slug] || slug;
  };

  // Filter recordings based on search query
  const filteredRecordings = recordings.filter(recording => 
    recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {getSubjectName(subjectSlug)}
            </h1>
          </div>
          {/* Add Record Button */}
          <button
            onClick={() => {
              // If subjectSlug is already a UUID, use it directly
              // Otherwise, convert slug to UUID
              const subjectId = isUUID(subjectSlug) 
                ? subjectSlug 
                : getUUIDFromSlug(subjectSlug);
              
              if (subjectId) {
                router.push(`/recording?subjectId=${subjectId}`);
              }
            }}
            className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors active:scale-95"
            title="Start New Recording"
          >
            <Mic className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}
        {error && <div className="text-center text-red-500 py-8 bg-red-50 rounded-2xl">{error}</div>}
        {!loading && !error && recordings.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl shadow-sm">
            No recordings yet for this subject.
          </div>
        )}
        {!loading && !error && recordings.length > 0 && filteredRecordings.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl shadow-sm">
            No recordings found matching your search.
          </div>
        )}

        <ul className="space-y-3">
          {filteredRecordings.map((rec) => (
            <li
              key={rec.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md p-4 flex flex-col gap-2 cursor-pointer transition-all active:scale-[0.98]"
              onClick={() => router.push(`/transcription/${rec.id}/${rec.subject_id}`)}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-base text-gray-900 flex-1">
                  {rec.title && rec.title.trim() ? rec.title : getSubjectName(subjectSlug)}
                </span>
                {rec.transcribed && (
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full ml-2">
                    ✓ Transcribed
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(rec.date).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric",
                  year: "numeric"
                })}</span>
                <span>
                  {Math.floor(rec.duration / 60)}:{(rec.duration % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
