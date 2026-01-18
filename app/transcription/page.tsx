"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Play, Pause, Star, Sparkles } from "lucide-react";
import { Recording, TranscriptionSegment } from "../types";

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
    {
      id: "t2",
      text: "A binary tree is a hierarchical data structure where each node has at most two children.",
      timestamp: 45,
      important: true,
    },
    {
      id: "t3",
      text: "Binary search trees are particularly efficient for searching operations with O(log n) time complexity.",
      timestamp: 120,
      important: true,
    },
  ],
};

export default function TranscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const recording = sampleRecording;

  const [playingSegment, setPlayingSegment] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSegmentClick = (segmentId: string) => {
    setPlayingSegment(playingSegment === segmentId ? null : segmentId);
  };

  const handleMarkImportant = (segmentId: string) => {
    const newSelected = new Set(selectedSegments);
    if (newSelected.has(segmentId)) {
      newSelected.delete(segmentId);
    } else {
      newSelected.add(segmentId);
    }
    setSelectedSegments(newSelected);
  };

  const handleViewSummary = () => {
    router.push(`/ai-summary?recordingId=${recording.id}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 border-b border-gray-100 bg-gradient-to-b from-purple-50 to-white">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl text-gray-900">{recording.subjectName}</h1>
                <p className="text-xs text-gray-500">
                  {new Date(recording.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={handleViewSummary}
                className="p-2.5 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Transcription Segments */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              {recording.transcription?.map((segment) => (
                <div
                  key={segment.id}
                  className={`rounded-2xl p-4 transition-all ${
                    segment.important || selectedSegments.has(segment.id)
                      ? "bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200"
                      : "bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() => handleSegmentClick(segment.id)}
                      className={`p-2 rounded-full transition-all active:scale-95 ${
                        playingSegment === segment.id
                          ? "bg-purple-500 text-white"
                          : "bg-white text-purple-500 shadow-sm"
                      }`}
                    >
                      {playingSegment === segment.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-white rounded-full text-purple-600">
                          {formatTimestamp(segment.timestamp)}
                        </span>
                        <button
                          onClick={() => handleMarkImportant(segment.id)}
                          className="ml-auto"
                        >
                          <Star
                            className={`w-4 h-4 transition-colors ${
                              segment.important || selectedSegments.has(segment.id)
                                ? "fill-purple-500 text-purple-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed">
                        {segment.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="px-6 pb-6">
            <div className="bg-purple-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-purple-700">
                💡 Tap any segment to replay audio
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
