"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Clock, FileText } from "lucide-react";
import { Subject, Recording } from "../types";

const subjects: Subject[] = [
  { id: "1", name: "Computer Science", color: "#9b87f5", icon: "💻" },
  { id: "2", name: "Mathematics", color: "#f59e87", icon: "📐" },
  { id: "3", name: "Physics", color: "#87d4f5", icon: "⚡" },
  { id: "4", name: "Literature", color: "#f5c987", icon: "📚" },
];

const recordings: Recording[] = [
  {
    id: "1",
    subjectId: "1",
    subjectName: "Computer Science",
    date: "2026-01-11T10:00:00",
    duration: 3600,
    transcribed: true,
  },
  {
    id: "2",
    subjectId: "2",
    subjectName: "Mathematics",
    date: "2026-01-10T14:00:00",
    duration: 2700,
    transcribed: true,
  },
];

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const subject = subjects.find((s) => s.id === subjectId) || subjects[0];
  const subjectRecordings = recordings.filter((r) => r.subjectId === subject.id);

  const sortedRecordings = [...subjectRecordings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleSelectRecording = (recording: Recording) => {
    router.push(`/note-detail?recordingId=${recording.id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-purple overflow-hidden" style={{ minHeight: 700, boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.10)' }}>
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div
            className="px-6 pt-16 pb-8"
            style={{
              background: `linear-gradient(to bottom, ${subject.color}15, white)`,
            }}
          >
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95 mb-4"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
                style={{ backgroundColor: `${subject.color}20` }}
              >
                {subject.icon}
              </div>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1">{subject.name}</h1>
                <p className="text-sm text-gray-500">
                  {subjectRecordings.length} recording{subjectRecordings.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {sortedRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="bg-purple-100 p-6 rounded-full mb-4">
                  <FileText className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-lg text-gray-900 mb-2">No recordings yet</h3>
                <p className="text-sm text-gray-500">
                  Start recording your first lecture for this subject
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRecordings.map((recording) => {
                  const recordingDate = new Date(recording.date);
                  const formattedDate = recordingDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = recordingDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const durationMin = Math.floor(recording.duration / 60);

                  return (
                    <button
                      key={recording.id}
                      onClick={() => handleSelectRecording(recording)}
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-purple-200 hover:shadow-md transition-all active:scale-[0.98] text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${subject.color}20` }}
                        >
                          <FileText
                            className="w-6 h-6"
                            style={{ color: subject.color }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="text-sm text-gray-900">
                              {formattedDate}
                            </div>
                            {recording.transcribed && (
                              <div className="bg-purple-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                                ✓
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mb-3">
                            {formattedTime}
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {durationMin} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
