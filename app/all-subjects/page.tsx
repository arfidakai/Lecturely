"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Subject } from "../types";
import { ChevronLeft } from "lucide-react";
import { getSlugFromUUID } from "../lib/subjectMapping";

export default function AllSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, color, icon, lecturer")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setSubjects(data);
    }
    setLoading(false);
  };

  const handleSelectSubject = (subject: Subject) => {
    const subjectSlug = getSlugFromUUID(subject.id) || subject.id;
    router.push(`/notes/${subjectSlug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex-1">All Subjects</h1>
        </div>
        {/* Subject List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSelectSubject(subject)}
                className="w-full bg-gradient-to-br from-white to-purple-50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left border border-purple-100 flex items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  {subject.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base text-gray-900 mb-1 line-clamp-1">{subject.name}</div>
                  {subject.lecturer && (
                    <div className="text-xs text-gray-500 mb-1 line-clamp-1">{subject.lecturer}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
