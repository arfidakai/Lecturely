"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./components/Homepage";
import { Subject, Recording } from "./types";
import { supabase } from "./lib/supabase";

const subjects: Subject[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Computer Science", color: "#9b87f5", icon: "💻" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Mathematics", color: "#f59e87", icon: "📐" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Physics", color: "#87d4f5", icon: "⚡" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Literature", color: "#f5c987", icon: "📚" },
];

export default function Home() {
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordings();

    // Refresh recordings when page becomes visible (user returns to homepage)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchRecordings();
      }
    };

    // Refresh recordings when custom event is triggered (after save/delete)
    const handleRefreshRecordings = () => {
      fetchRecordings();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("refreshRecordings", handleRefreshRecordings);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("refreshRecordings", handleRefreshRecordings);
    };
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recordings")
        .select("id, subject_id, title, date, duration, transcribed")
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Map database records to Recording type with subject names
      const mappedRecordings: Recording[] = (data || []).map((rec) => {
        const subject = subjects.find((s) => s.id === rec.subject_id);
        return {
          id: rec.id,
          subjectId: rec.subject_id,
          subjectName: subject?.name || "Unknown",
          date: rec.date,
          duration: rec.duration,
          transcribed: rec.transcribed,
        };
      });

      setRecordings(mappedRecordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = (subject: Subject) => {
    router.push(`/recording?subjectId=${subject.id}`);
  };

  const handleNavigateToSubjects = () => {
    router.push("/subject-selection");
  };

  const handleNavigateToNotesList = (subjectSlug: string) => {
    router.push(`/notes/${subjectSlug}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <Dashboard
          subjects={subjects}
          recordings={recordings}
          onStartRecording={handleStartRecording}
          onNavigateToSubjects={handleNavigateToSubjects}
          onNavigateToNotesList={handleNavigateToNotesList}
        />
      </div>
    </div>
  );
}
