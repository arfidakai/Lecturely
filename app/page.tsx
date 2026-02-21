"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./components/Homepage";
import { Subject, Recording } from "./types";
import { supabase } from "./lib/supabase";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    fetchSubjects();
    fetchRecordings();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSubjects();
        fetchRecordings();
      }
    };

    const handleRefreshRecordings = () => {
      fetchRecordings();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("refreshRecordings", handleRefreshRecordings);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("refreshRecordings", handleRefreshRecordings);
    };
  }, [user]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, color, icon, schedule_days")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setSubjects(data);
    }
  };

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recordings")
        .select("id, subject_id, title, date, duration, transcribed")
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;

      // console.log("Fetched recordings:", data); // Debug log

      // Map database records to Recording type with subject names
      const mappedRecordings: Recording[] = (data || []).map((rec) => {
        const subject = subjects.find((s) => s.id === rec.subject_id);
        return {
          id: rec.id,
          subjectId: rec.subject_id,
          subjectName: subject?.name || "Unknown Subject",
          date: rec.date,
          duration: rec.duration,
          transcribed: rec.transcribed,
          title: rec.title || "",
        };
      });

      // console.log("Mapped recordings:", mappedRecordings); // Debug log
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

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200 animate-pulse">
            <span className="text-3xl">🎓</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

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
