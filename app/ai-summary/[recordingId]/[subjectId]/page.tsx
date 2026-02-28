"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Loader2, Save, Bell } from "lucide-react";
import { fetchWithAuth } from "../../../lib/fetch-with-auth";
import Swal from "sweetalert2";

export default function AiSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { recordingId, subjectId } = params as { recordingId: string; subjectId: string };

  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderNote, setReminderNote] = useState("");

  useEffect(() => {
    if (!recordingId) {
      setError("Recording ID not found");
      setIsLoading(false);
      return;
    }
    fetchSummary();
  }, [recordingId]);

  const fetchSummary = async () => {
    try {
      const response = await fetchWithAuth('/api/summary', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to fetch summary');
        setSummary("");
        return;
      }
      const data = await response.json();
      let summaryText = "No summary available";
      if (typeof data.summary === 'string') {
        summaryText = data.summary;
      } else if (data.summary && typeof data.summary === 'object') {
        // If summary is an object (e.g., {id, content, ...})
        if ('content' in data.summary && typeof data.summary.content === 'string') {
          summaryText = data.summary.content;
        } else {
          summaryText = JSON.stringify(data.summary);
        }
      } else if (Array.isArray(data.summary)) {
        summaryText = data.summary.join('\n');
      }
      setSummary(summaryText);
    } catch (error) {
      setError('Failed to load summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Summary is already saved in database when generated
      // This just provides user feedback
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      await Swal.fire({
        icon: 'success',
        title: 'Already Saved!',
        text: 'Your summary is safely stored in the database',
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to confirm save',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetReminder = () => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReminderDate(tomorrow.toISOString().split('T')[0]);
    setReminderNote(`Review: ${summary.substring(0, 50)}...`);
    setShowReminderModal(true);
  };

  const handleCreateReminder = async () => {
    if (!reminderDate || !reminderTime) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select date and time for the reminder',
      });
      return;
    }

    try {
      const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);
      
      const response = await fetchWithAuth('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          recordingId: recordingId,
          reminderTime: reminderDateTime.toISOString(),
        }),
      });

      if (response.ok) {
        setShowReminderModal(false);
        await Swal.fire({
          icon: 'success',
          title: 'Reminder Set!',
          text: `You'll be reminded on ${new Date(reminderDateTime).toLocaleString()}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error('Failed to create reminder');
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create reminder',
      });
    }
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
                <h1 className="text-xl text-gray-900">AI Summary</h1>
              </div>
              {!isLoading && !error && (
                <button
                  onClick={handleSetReminder}
                  className="p-2 hover:bg-purple-100 rounded-full transition-colors active:scale-95"
                >
                  <Bell className="w-6 h-6 text-purple-500" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading summary...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4 text-center">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 leading-normal">{children}</p>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-gray-900">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 text-gray-800">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-normal">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Save Button */}
          {!isLoading && !error && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Summary
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reminder Modal */}
        {showReminderModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Set Reminder</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Add a note for this reminder..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReminder}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors active:scale-95"
                >
                  Create Reminder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
