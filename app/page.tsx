"use client";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleStartRecording = (subject: Subject) => {
    router.push(`/recording?subjectId=${subject.id}`);
  };

  const handleNavigateToSubjects = () => {
    router.push("/subject-selection");
  };

  const handleNavigateToNotesList = (subjectId: string) => {
    router.push(`/notes?subjectId=${subjectId}`);
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
