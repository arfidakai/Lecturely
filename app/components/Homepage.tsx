"use client";
import { Mic, BookOpen, Clock } from "lucide-react";
import { Subject, Recording } from "../types";
import { getSlugFromUUID } from "../lib/subjectMapping";

type DashboardProps = {
  subjects: Subject[];
  recordings: Recording[];
  onStartRecording: (subject: Subject) => void;
  onNavigateToSubjects: () => void;
  onNavigateToNotesList: (subjectId: string) => void;
};

export default function Homepage({
  subjects,
  recordings,
  onStartRecording,
  onNavigateToSubjects,
  onNavigateToNotesList,
}: DashboardProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const recentRecordings = recordings.slice(-3).reverse();

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="px-6 pt-16 pb-8">
        <div className="text-sm text-purple-400 mb-2">{today}</div>
        <h1 className="text-3xl text-gray-900 mb-1">Good Morning</h1>
        <p className="text-gray-500">Ready to capture knowledge?</p>
        
      </div>
    

      {/* Quick Record Button */}
      <div className="px-6 mb-8">
        <button
          onClick={onNavigateToSubjects}
          className="w-full bg-gradient-to-r from-pur ple-500 to-purple-600 text-white rounded-3xl py-5 px-6 shadow-lg shadow-purple-200 flex items-center justify-center gap-3 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Mic className="w-6 h-6" />
          </div>
          <span className="text-lg">Start Recording</span>
        </button>
      </div>

      {/* Today's Subjects */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-gray-900">Today's Subjects</h2>
          <button
            onClick={onNavigateToSubjects}
            className="text-sm text-purple-500"
          >
            See All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {subjects.slice(0, 4).map((subject) => (
            <button
              key={subject.id}
              onClick={() => onStartRecording(subject)}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-2xl"
                style={{ backgroundColor: `${subject.color}20` }}
              >
                {subject.icon}
              </div>
              <div className="text-sm text-gray-900 mb-1 line-clamp-1">
                {subject.name}
              </div>
              <div className="text-xs text-gray-400">
                {recordings.filter((r) => r.subjectId === subject.id).length}{" "}
                notes
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Recordings */}
      <div className="px-6 pb-8 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-purple-500" />
          <h2 className="text-lg text-gray-900">Recent</h2>
        </div>

        <div className="space-y-3">
          {recentRecordings.map((recording) => {
            const recordingDate = new Date(recording.date);
            const formattedDate = recordingDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const formattedTime = recordingDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });
            const durationMin = Math.floor(recording.duration / 60);
            const subjectSlug = getSlugFromUUID(recording.subjectId) || recording.subjectId;

            return (
              <button
                key={recording.id}
                onClick={() => onNavigateToNotesList(subjectSlug)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2.5 rounded-xl">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 mb-1">
                      {recording.subjectName}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{formattedTime}</span>
                      <span>•</span>
                      <span>{durationMin} min</span>
                    </div>
                  </div>
                  {recording.transcribed && (
                    <div className="bg-purple-500 text-white text-xs px-2.5 py-1 rounded-full">
                      ✓
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
