"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Pause, Square } from "lucide-react";
import { motion } from "framer-motion";
import { Subject } from "../types";

const subjects: Subject[] = [
  { id: "1", name: "Computer Science", color: "#9b87f5", icon: "💻" },
  { id: "2", name: "Mathematics", color: "#f59e87", icon: "📐" },
  { id: "3", name: "Physics", color: "#87d4f5", icon: "⚡" },
  { id: "4", name: "Literature", color: "#f5c987", icon: "📚" },
];

export default function RecordingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const subject = subjects.find((s) => s.id === subjectId) || subjects[0];

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartStop = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      router.push(`/post-record?duration=${duration}&subjectId=${subject.id}`);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95 mb-6"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Subject Info */}
          <div className="px-6 mb-12">
            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${subject?.color}20` }}
              >
                {subject?.icon}
              </div>
              <div>
                <div className="text-sm text-gray-900">{subject?.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recording Visual */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Timer */}
            <div className="text-5xl text-gray-900 mb-16 tabular-nums">
              {formatTime(duration)}
            </div>

            {/* Waveform Animation */}
            <div className="flex items-center justify-center gap-1.5 mb-16 h-20">
              {[...Array(25)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-purple-400 rounded-full"
                  animate={
                    isRecording && !isPaused
                      ? {
                          height: [
                            Math.random() * 30 + 20,
                            Math.random() * 60 + 20,
                            Math.random() * 30 + 20,
                          ],
                        }
                      : { height: 20 }
                  }
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>

            {/* Record Button */}
            <div className="relative mb-8">
              <button
                onClick={handleStartStop}
                className="relative"
              >
                <motion.div
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${
                    isRecording
                      ? "bg-purple-500"
                      : "bg-gradient-to-br from-purple-500 to-purple-600"
                  }`}
                  animate={
                    isRecording && !isPaused
                      ? {
                          scale: [1, 1.05, 1],
                        }
                      : { scale: 1 }
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  {isRecording ? (
                    <Square className="w-10 h-10 text-white fill-white" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500" />
                  )}
                </motion.div>

                {isRecording && !isPaused && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-purple-400 -z-10"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </button>
            </div>

            <div className="text-sm text-gray-500 mb-8">
              {isRecording ? (isPaused ? "Paused" : "Recording...") : "Tap to start"}
            </div>

            {/* Pause Button */}
            {isRecording && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Pause className="w-5 h-5" />
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
