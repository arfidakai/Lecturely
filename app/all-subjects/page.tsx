"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Subject } from "../types";
import { ChevronLeft, Plus, X } from "lucide-react";
import { getSlugFromUUID } from "../lib/subjectMapping";
import Swal from "sweetalert2";

const dayOptions = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
];

export default function AllSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newLecturer, setNewLecturer] = useState("");
  const [newIcon, setNewIcon] = useState("📖");
  const [newColor, setNewColor] = useState("#9b87f5");
  const [newDays, setNewDays] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editLecturer, setEditLecturer] = useState("");
  const [editIcon, setEditIcon] = useState("📖");
  const [editColor, setEditColor] = useState("#9b87f5");
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const iconOptions = ["📖", "🔬", "🎨", "🎵", "💡", "🌍", "💻", "📐", "⚡", "📚", "🧪", "📝", "🧮", "🧬", "🧑‍🏫", "🗺️", "📊", "📈", "🖥️", "📷", "🎬", "🎤", "🎸", "🎻", "🏀", "⚽", "🏆"];
  const colorOptions = ["#9b87f5", "#f59e87", "#87d4f5", "#f5c987", "#87f5c9", "#f587b7", "#b7f587", "#f58787", "#87f5f5", "#f5e687"];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, color, icon, lecturer, schedule_days")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setSubjects(data);
    }
    setLoading(false);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !newLecturer.trim() || !newIcon || !newColor) return;
    setAdding(true);
    const { error } = await supabase.from("subjects").insert({
      name: newSubjectName.trim(),
      lecturer: newLecturer.trim(),
      icon: newIcon,
      color: newColor,
      schedule_days: newDays,
    });
    setAdding(false);
    if (!error) {
      setShowAddModal(false);
      setNewSubjectName("");
      setNewLecturer("");
      setNewIcon("📖");
      setNewColor("#9b87f5");
      setNewDays([]);
      fetchSubjects();
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Subject added successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add subject",
      });
    }
  };

  const handleSelectSubject = (subject: Subject) => {
    const subjectSlug = getSlugFromUUID(subject.id) || subject.id;
    router.push(`/notes/${subjectSlug}`);
  };

  const openEditModal = (subject: Subject) => {
    setEditSubject(subject);
    setEditSubjectName(subject.name);
    setEditLecturer(subject.lecturer || "");
    setEditIcon(subject.icon || "📖");
    setEditColor(subject.color || "#9b87f5");
    setEditDays(subject.schedule_days || []);
    setShowEditModal(true);
  };

  const handleEditSubject = async () => {
    if (!editSubject) return;
    setEditing(true);
    const { error } = await supabase.from("subjects").update({
      name: editSubjectName.trim(),
      lecturer: editLecturer.trim(),
      icon: editIcon,
      color: editColor,
      schedule_days: editDays,
    }).eq("id", editSubject.id);
    setEditing(false);
    if (!error) {
      setShowEditModal(false);
      setEditSubject(null);
      fetchSubjects();
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Subject updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to edit subject",
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    
    if (!result.isConfirmed) return;
    
    setDeletingId(subjectId);
    const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
    setDeletingId(null);
    if (!error) {
      fetchSubjects();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Subject has been deleted",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete subject",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 relative">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex-1">All Subjects</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="absolute right-0 bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-purple-600 transition-colors"
            aria-label="Add Subject"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        {/* Subject List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="w-full bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-sm hover:shadow-md transition-all border border-purple-100 flex items-center gap-4 relative overflow-hidden"
              >
                <button
                  onClick={() => handleSelectSubject(subject)}
                  className="flex-1 flex items-center gap-4 text-left p-5 pr-24"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    {subject.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base text-gray-900 mb-1 line-clamp-1">{subject.name}</div>
                    {subject.lecturer && (
                      <div className="text-xs text-gray-500 mb-1 line-clamp-1">{subject.lecturer}</div>
                    )}
                  </div>
                </button>
                <div className="flex gap-2 absolute top-1/2 -translate-y-1/2 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(subject);
                    }}
                    className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors"
                    title="Edit"
                  >
                    <span className="text-lg">✏️</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubject(subject.id);
                    }}
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                    title="Delete"
                    disabled={deletingId === subject.id}
                  >
                    <span className="text-lg">{deletingId === subject.id ? '⏳' : '🗑️'}</span>
                  </button>
                </div>
              </div>
            ))}
                  {/* Edit Subject Modal */}
                  {showEditModal && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center px-6 backdrop-blur-sm z-30">
                      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg text-gray-900">Edit Subject</h3>
                          <button
                            onClick={() => setShowEditModal(false)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editSubjectName}
                          onChange={(e) => setEditSubjectName(e.target.value)}
                          placeholder="Subject name"
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all mb-3"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editLecturer}
                          onChange={(e) => setEditLecturer(e.target.value)}
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
                                className={`text-2xl p-2 rounded-xl border ${editIcon === icon ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'} hover:bg-purple-100`}
                                onClick={() => setEditIcon(icon)}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="mb-1 text-sm text-gray-700">Choose Color</div>
                          <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full border-2 ${editColor === color ? 'border-purple-500' : 'border-gray-200'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setEditColor(color)}
                                aria-label={color}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="mb-1 text-sm text-gray-700">Schedule Days</div>
                          <div className="flex flex-wrap gap-2">
                            {dayOptions.map((day) => (
                              <label key={day.value} className={`px-2 py-1 rounded-lg border cursor-pointer text-xs ${editDays.includes(day.value) ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                                <input
                                  type="checkbox"
                                  className="mr-1 accent-purple-500"
                                  checked={editDays.includes(day.value)}
                                  onChange={() => setEditDays((prev) => prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value])}
                                />
                                {day.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                            disabled={editing}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleEditSubject}
                            disabled={!editSubjectName.trim() || !editLecturer.trim() || !editIcon || !editColor || editing}
                            className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editing ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
          </div>
        )}
        {/* Add Subject Modal */}
        {showAddModal && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center px-6 backdrop-blur-sm z-30">
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
              <div className="mb-3">
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
              <div className="mb-4">
                <div className="mb-1 text-sm text-gray-700">Schedule Days</div>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <label key={day.value} className={`px-2 py-1 rounded-lg border cursor-pointer text-xs ${newDays.includes(day.value) ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      <input
                        type="checkbox"
                        className="mr-1 accent-purple-500"
                        checked={newDays.includes(day.value)}
                        onChange={() => setNewDays((prev) => prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value])}
                      />
                      {day.label}
                    </label>
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
  );
}
