"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X } from "lucide-react";
import { Subject } from "../types";

const subjects: Subject[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Computer Science", color: "#9b87f5", icon: "💻" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Mathematics", color: "#f59e87", icon: "📐" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Physics", color: "#87d4f5", icon: "⚡" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Literature", color: "#f5c987", icon: "📚" },
];

export default function SubjectSelectionPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const handleSelectSubject = (subject: Subject) => {
    router.push(`/recording?subjectId=${subject.id}&subjectName=${encodeURIComponent(subject.name)}`);
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const colors = ["#9b87f5", "#f59e87", "#87d4f5", "#f5c987", "#87f5c9"];
    const icons = ["📖", "🔬", "🎨", "🎵", "💡", "🌍"];
    setSubjects([
      ...subjects,
      {
        id: Date.now().toString(),
        name: newSubjectName.trim(),
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
      },
    ]);
    setNewSubjectName("");
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-2xl text-gray-900">Select Subject</h1>
            </div>
            <p className="text-sm text-gray-500 ml-14">
              Choose a subject to start recording
            </p>
          </div>

          {/* Subjects List */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleSelectSubject(subject)}
                  className="w-full bg-gradient-to-br from-white to-purple-50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left border border-purple-100"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      {subject.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-base text-gray-900 mb-1">
                        {subject.name}
                      </div>
                      <div className="text-xs text-purple-500">Tap to record</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Floating Add Button */}
          <div className="absolute bottom-8 right-8">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-500 text-white p-4 rounded-full shadow-lg shadow-purple-300 hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          {/* Add Subject Modal */}
          {showAddModal && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center px-6 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg text-gray-900">Add New Subject</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all mb-4"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubject();
                  }}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubject}
                    disabled={!newSubjectName.trim()}
                    className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
