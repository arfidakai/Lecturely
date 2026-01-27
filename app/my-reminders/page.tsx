"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell, Trash2, Clock, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

interface Reminder {
  id: string;
  recording_id: string;
  reminder_time: string;
  sent: boolean;
  recordings: {
    id: string;
    title: string;
    subjects: {
      name: string;
      color: string;
      icon: string;
    };
  };
}

export default function MyRemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reminders');
      const data = await response.json();
      if (data.success) {
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
    setLoading(false);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const result = await Swal.fire({
      title: "Delete Reminder?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setDeletingId(reminderId);
    const { error } = await supabase.from("reminders").delete().eq("id", reminderId);
    setDeletingId(null);

    if (!error) {
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Reminder has been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete reminder.",
      });
    }
  };

  const formatReminderTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return "Past due";
    if (diffHours < 1) return "Less than 1 hour";
    if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">My Reminders</h1>
            <p className="text-sm text-gray-500">Review schedule for your notes</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Reminder List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No reminders set</p>
            <p className="text-xs text-gray-400">
              Set reminders from your recordings to review later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white rounded-2xl shadow-sm p-4 border border-purple-100 relative hover:shadow-md transition-all"
              >
                {/* Subject info */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${reminder.recordings.subjects.color}20` }}
                  >
                    {reminder.recordings.subjects.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {reminder.recordings.subjects.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {reminder.recordings.title || "Recording"}
                    </p>
                  </div>
                </div>

                {/* Reminder time */}
                <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatReminderTime(reminder.reminder_time)}</span>
                </div>

                {/* Exact date */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(reminder.reminder_time).toLocaleString()}</span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  disabled={deletingId === reminder.id}
                  className="absolute top-3 right-3 p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                  title="Delete reminder"
                >
                  {deletingId === reminder.id ? '⏳' : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
