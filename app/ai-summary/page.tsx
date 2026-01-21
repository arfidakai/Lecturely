"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Sparkles, FileText } from "lucide-react";
import { Recording } from "../types";

const sampleRecording: Recording = {
  id: "1",
  subjectId: "1",
  subjectName: "Computer Science",
  date: "2026-01-11T10:00:00",
  duration: 3600,
  transcribed: true,
  summary: "This lecture covered binary trees and their fundamental properties. Key points: tree traversal methods (inorder, preorder, postorder), binary search tree operations, and time complexity analysis.",
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
  ],
};

export default function AISummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const recording = sampleRecording;

  const [showOriginal, setShowOriginal] = useState(false);

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

            <div className="flex items-start gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1">AI Summary</h1>
                <p className="text-sm text-gray-500">
                  Generated insights from your lecture
                </p>
              </div>
            </div>
          </div>

          {/* Toggle View */}
          <div className="px-6 mb-6">
            <div className="bg-white rounded-2xl p-1.5 flex shadow-sm">
              <button
                onClick={() => setShowOriginal(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                  !showOriginal
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setShowOriginal(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                  showOriginal
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Original Text
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {!showOriginal ? (
              <div className="space-y-4">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 shadow-md border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs text-purple-600 uppercase tracking-wide">
                      Key Insights
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-6">
                    {recording.summary ||
                      "This lecture covered fundamental concepts in the subject area. The main topics discussed included theoretical frameworks, practical applications, and real-world examples to illustrate key principles."}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-1.5 rounded-lg mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          Core definitions and terminology explained
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-1.5 rounded-lg mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          Practical examples and case studies discussed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-1.5 rounded-lg mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          Important concepts highlighted for exam preparation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Study Tips */}
                <div className="bg-purple-50 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <h3 className="text-sm text-purple-900 mb-2">Study Tip</h3>
                      <p className="text-xs text-purple-700 leading-relaxed">
                        Review the highlighted segments and create flashcards for
                        key definitions. Practice explaining concepts in your own
                        words.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Full Transcription
                  </span>
                </div>

                <div className="space-y-4">
                  {recording.transcription?.map((segment) => (
                    <div key={segment.id} className="pb-4 border-b border-gray-100 last:border-0">
                      <div className="text-xs text-purple-500 mb-2">
                        {Math.floor(segment.timestamp / 60)}:
                        {(segment.timestamp % 60).toString().padStart(2, "0")}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
