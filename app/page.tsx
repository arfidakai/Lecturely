"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./components/Homepage";
import { Subject, Recording } from "./types";
import { supabase } from "./lib/supabase";

export default function Home() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, color, icon")
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
