"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X } from "lucide-react";
import { Subject } from "../types";
import { supabase } from "../lib/supabase";


export default function SubjectSelectionPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
    useEffect(() => {
      fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, color, icon, lecturer")
        .order("created_at", { ascending: true });
      if (!error && data) {
        setSubjects(data);
      }
      setLoading(false);
    };
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newLecturer, setNewLecturer] = useState("");
  const [newIcon, setNewIcon] = useState("📖");
  const [newColor, setNewColor] = useState("#9b87f5");
  const [adding, setAdding] = useState(false);

  const handleSelectSubject = (subject: Subject) => {
    router.push(`/recording?subjectId=${subject.id}`);
  };

  const iconOptions = ["📖", "🔬", "🎨", "🎵", "💡", "🌍", "💻", "📐", "⚡", "📚", "🧪", "📝", "🧮", "🧬", "🧑‍🏫", "🗺️", "📊", "📈", "🖥️", "📷", "🎬", "🎤", "🎸", "🎻", "🏀", "⚽", "🏆"];
  const colorOptions = ["#9b87f5", "#f59e87", "#87d4f5", "#f5c987", "#87f5c9", "#f587b7", "#b7f587", "#f58787", "#87f5f5", "#f5e687"];

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !newLecturer.trim() || !newIcon || !newColor) return;
    setAdding(true);
    const { error } = await supabase.from("subjects").insert({
      name: newSubjectName.trim(),
      lecturer: newLecturer.trim(),
      icon: newIcon,
      color: newColor,
    });
    setAdding(false);
    if (!error) {
      setShowAddModal(false);
      setNewSubjectName("");
      setNewLecturer("");
      setNewIcon("📖");
      setNewColor("#9b87f5");
      fetchSubjects();
    } else {
      alert("Failed to add subject");
    }
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
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading subjects...</div>
              ) : subjects.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No subjects found.</div>
              ) : subjects.map((subject) => (
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
                      {subject.lecturer && (
                        <div className="text-xs text-gray-500 mb-1">
                          {subject.lecturer}
                        </div>
                      )}
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
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all mb-3"
                  autoFocus
                />
                <input
                  type="text"
                  value={newLecturer}
                  onChange={(e) => setNewLecturer(e.target.value)}
                  placeholder="Lecturer name"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all mb-3"
                />
                <div className="mb-3">
                  <div className="mb-1 text-sm text-gray-700">Choose Icon</div>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`text-2xl p-2 rounded-xl border ${newIcon === icon ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'} hover:bg-purple-100`}
                        onClick={() => setNewIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="mb-1 text-sm text-gray-700">Choose Color</div>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${newColor === color ? 'border-purple-500' : 'border-gray-200'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewColor(color)}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    disabled={adding}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubject}
                    disabled={!newSubjectName.trim() || !newLecturer.trim() || !newIcon || !newColor || adding}
                    className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? 'Adding...' : 'Add'}
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
