"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Calendar, CheckCircle, Save } from "lucide-react";
import { Subject } from "../types";

const subjects: Subject[] = [
  { id: "1", name: "Computer Science", color: "#9b87f5", icon: "💻" },
  { id: "2", name: "Mathematics", color: "#f59e87", icon: "📐" },
  { id: "3", name: "Physics", color: "#87d4f5", icon: "⚡" },
  { id: "4", name: "Literature", color: "#f5c987", icon: "📚" },
];

export default function PostRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get("duration") || "0");
  const subjectId = searchParams.get("subjectId");
  const subject = subjects.find((s) => s.id === subjectId) || subjects[0];

  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  const recordingDate = new Date();
  const formattedDate = recordingDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = recordingDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleTranscribe = () => {
    router.push(`/transcription?subjectId=${subjectId}&duration=${duration}`);
  };

  const handleSaveLater = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-purple overflow-hidden" style={{ minHeight: 700, boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.10)' }}>
        <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Success Icon */}
          <div className="px-6 pt-20 pb-8 flex flex-col items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-full mb-6 shadow-lg shadow-purple-200">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl text-gray-900 mb-2">Recording Complete!</h1>
            <p className="text-sm text-gray-500 text-center">
              Your lecture has been saved
            </p>
          </div>

          {/* Recording Summary */}
          <div className="px-6 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-md">
              <div className="text-center mb-6">
                <div className="text-3xl text-gray-900 mb-2">
                  {subject.name}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm">
                  <Clock className="w-4 h-4" />
                  <span>
                    {durationMin}:{durationSec.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="text-gray-600">{formattedDate}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="text-gray-600">{formattedTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-12 mt-auto">
            <div className="space-y-3">
              <button
                onClick={handleTranscribe}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl py-4 px-6 shadow-lg shadow-purple-200 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="text-base">Transcribe Now</span>
                <span className="text-xl">✨</span>
              </button>

              <button
                onClick={handleSaveLater}
                className="w-full bg-white text-gray-700 rounded-2xl py-4 px-6 border-2 border-gray-200 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span className="text-base">Save for Later</span>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              You can transcribe this recording anytime from your notes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
