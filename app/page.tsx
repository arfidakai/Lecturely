"use client";
import Dashboard from "./components/Homepage";
import { Subject, Recording } from "./types";

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
    summary: "This lecture covered binary trees and their fundamental properties. Key points: tree traversal methods (inorder, preorder, postorder), binary search tree operations, and time complexity analysis.",
  },
  {
    id: "2",
    subjectId: "2",
    subjectName: "Mathematics",
    date: "2026-01-10T14:00:00",
    duration: 2700,
    transcribed: true,
    summary: "Linear algebra concepts including vector spaces, matrix operations, and eigenvalues.",
  },
];

export default function Home() {
  // Dummy handlers for now (no navigation)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-purple p-0 overflow-hidden" style={{ minHeight: 700, boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.10)' }}>
        <Dashboard
          subjects={subjects}
          recordings={recordings}
          onStartRecording={() => {}}
          onNavigateToSubjects={() => {}}
          onNavigateToNotesList={() => {}}
        />
      </div>
    </div>
  );
}
