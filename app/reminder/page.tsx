"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Bell, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

interface Recording {
  id: string;
  title: string;
  subject_id: string;
  subjects?: {
    name: string;
    color: string;
    icon: string;
  };
}

function ReminderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);

  const reminderOptions = [
    { id: "1hour", label: "In 1 hour", hours: 1 },
    { id: "3hours", label: "In 3 hours", hours: 3 },
    { id: "tomorrow", label: "Tomorrow morning", hours: 24 },
    { id: "3days", label: "In 3 days", hours: 72 },
    { id: "1week", label: "In 1 week", hours: 168 },
  ];

  useEffect(() => {
    if (recordingId) {
      fetchRecording();
    }
  }, [recordingId]);

  const fetchRecording = async () => {
    if (!recordingId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("recordings")
      .select(`
        id,
        title,
        subject_id,
        subjects (
          name,
          color,
          icon
        )
      `)
      .eq("id", recordingId)
      .single();
    
    if (!error && data) {
      setRecording(data as any);
    }
    setLoading(false);
  };

  const handleSetReminder = async () => {
    if (!selectedTime || !recordingId) return;
    
    const option = reminderOptions.find((o) => o.id === selectedTime);
    if (!option) return;

    setSaving(true);
    
    // Calculate reminder time
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + option.hours);

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId,
          reminderTime: reminderTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create reminder');

      setShowConfirmation(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error('Error creating reminder:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to set reminder. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95 mb-6"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl text-gray-900 mb-1">Set Reminder</h1>
                  <p className="text-sm text-gray-500">
                    Review: {recording?.subjects?.name || recording?.title || "Recording"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Reminder Options */}
          {!showConfirmation ? (
            <>
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-3 mb-8">
                  {reminderOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedTime(option.id)}
                      disabled={loading}
                      className={`w-full text-left p-5 rounded-2xl transition-all active:scale-[0.98] ${
                        selectedTime === option.id
                          ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200"
                          : "bg-white text-gray-900 shadow-sm hover:shadow-md border-2 border-gray-100"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{option.label}</span>
                        {selectedTime === option.id && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Info Card */}
                <div className="bg-purple-50 rounded-2xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📚</div>
                    <div>
                      <h3 className="text-sm text-purple-900 mb-2">
                        Spaced Repetition
                      </h3>
                      <p className="text-xs text-purple-700 leading-relaxed">
                        Regular review helps consolidate learning. Set reminders to
                        revisit your notes for better retention.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="px-6 pb-8">
                <button
                  onClick={handleSetReminder}
                  disabled={!selectedTime || loading || saving}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl py-4 shadow-lg shadow-purple-200 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Setting Reminder...</span>
                    </div>
                  ) : (
                    "Set Reminder"
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Confirmation State */
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-full mb-6 shadow-lg shadow-purple-300">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl text-gray-900 mb-3">Reminder Set!</h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                We'll notify you{" "}
                {reminderOptions.find((o) => o.id === selectedTime)?.label.toLowerCase()} to
                review your notes
              </p>
              <div className="bg-purple-50 rounded-2xl p-4 w-full">
                <p className="text-xs text-purple-700 text-center">
                  ✨ Check your notifications when it's time to study
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReminderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    }>
      <ReminderContent />
    </Suspense>
  );
}
  );
}
