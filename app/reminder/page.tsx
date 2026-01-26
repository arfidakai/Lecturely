"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Bell, CheckCircle } from "lucide-react";
import { Recording } from "../types";

const sampleRecording: Recording = {
  id: "1",
  subjectId: "1",
  subjectName: "Computer Science",
  date: "2026-01-11T10:00:00",
  duration: 3600,
  transcribed: true,
};

function ReminderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");
  const recording = sampleRecording;

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const reminderOptions = [
    { id: "1hour", label: "In 1 hour", value: "1 hour" },
    { id: "3hours", label: "In 3 hours", value: "3 hours" },
    { id: "tomorrow", label: "Tomorrow morning", value: "tomorrow at 9:00 AM" },
    { id: "3days", label: "In 3 days", value: "3 days" },
    { id: "1week", label: "In 1 week", value: "1 week" },
  ];

  const handleSetReminder = () => {
    setShowConfirmation(true);
    setTimeout(() => {
      router.push("/");
    }, 2000);
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

            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1">Set Reminder</h1>
                <p className="text-sm text-gray-500">
                  Review: {recording.subjectName}
                </p>
              </div>
            </div>
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
                      className={`w-full text-left p-5 rounded-2xl transition-all active:scale-[0.98] ${
                        selectedTime === option.id
                          ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200"
                          : "bg-white text-gray-900 shadow-sm hover:shadow-md border-2 border-gray-100"
                      }`}
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
                  disabled={!selectedTime}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl py-4 shadow-lg shadow-purple-200 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Set Reminder
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
                {reminderOptions.find((o) => o.id === selectedTime)?.value} to
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white"><Bell className="w-12 h-12 text-purple-500 animate-pulse" /></div>}>
      <ReminderContent />
    </Suspense>
  );
}
