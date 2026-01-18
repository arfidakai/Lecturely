"use client";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Play, Pause, Sparkles, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { Recording } from "../types";

const sampleRecording: Recording = {
  id: "1",
  subjectId: "1",
  subjectName: "Computer Science",
  date: "2026-01-11T10:00:00",
  duration: 3600,
  transcribed: true,
  transcription: [
    {
      id: "t1",
      text: "Today we'll be discussing data structures, specifically focusing on binary trees and their applications.",
      timestamp: 0,
      important: false,
    },
  ],
};

// Generate stable waveform heights (deterministic, not random)
const generateWaveformHeights = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    // Use a deterministic pattern based on index
    const seed = Math.sin(i * 0.5) * 10000;
    const height = ((seed - Math.floor(seed)) * 60) + 20;
    return height;
  });
};

export default function NoteDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const recording = sampleRecording;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Generate stable waveform heights once
  const waveformHeights = useMemo(() => generateWaveformHeights(40), []);

  const durationMin = Math.floor(recording.duration / 60);
  const progress = (currentTime / recording.duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleViewSummary = () => {
    router.push(`/ai-summary?recordingId=${recording.id}`);
  };

  const handleSetReminder = () => {
    router.push(`/reminder?recordingId=${recording.id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-purple overflow-hidden" style={{ minHeight: 700, boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.10)' }}>
        <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95 mb-6"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <div>
              <h1 className="text-2xl text-gray-900 mb-2">
                {recording.subjectName}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date(recording.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Audio Player Card */}
          <div className="px-6 mb-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-1 mb-6 h-24">
                {waveformHeights.map((baseHeight, i) => {
                  // Generate deterministic animation heights based on base height
                  const height1 = baseHeight;
                  const height2 = Math.min(baseHeight * 1.5, 80);
                  const height3 = baseHeight * 0.9;
                  
                  return (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${
                        (i / 40) * 100 <= progress ? "bg-purple-500" : "bg-gray-200"
                      }`}
                      style={{
                        height: `${height1}%`,
                      }}
                      animate={
                        isPlaying
                          ? {
                              height: [
                                `${height1}%`,
                                `${height2}%`,
                                `${height3}%`,
                              ],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.02,
                      }}
                    />
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(recording.duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <button className="p-3 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-4 bg-purple-500 text-white rounded-full shadow-lg shadow-purple-200 hover:bg-purple-600 transition-all active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </button>

                <button className="p-3 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleViewSummary}
                className="bg-white border-2 border-purple-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-900">AI Summary</span>
                </div>
              </button>

              <button
                onClick={handleSetReminder}
                className="bg-white border-2 border-purple-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Bell className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-900">Set Reminder</span>
                </div>
              </button>
            </div>
          </div>

          {/* Transcription Preview */}
          {recording.transcription && recording.transcription.length > 0 && (
            <div className="px-6 pb-6 flex-1 overflow-y-auto">
              <h3 className="text-sm text-gray-700 mb-3">Transcription</h3>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {recording.transcription[0].text}
                </p>
                <button 
                  onClick={() => router.push(`/transcription?recordingId=${recording.id}`)}
                  className="text-xs text-purple-500 mt-3"
                >
                  View full transcription →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
