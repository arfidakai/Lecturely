"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Calendar, CheckCircle, Save, Loader2, Trash2, X } from "lucide-react";
import { Subject } from "../types";
import { supabase } from "../lib/supabase";

function PostRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get("duration") || "0");
  const subjectId = searchParams.get("subjectId");
  const recordingId = searchParams.get("recordingId");
  const [subject, setSubject] = useState<Subject | null>(null);
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchSubject();
    }
  }, [subjectId]);

  const fetchSubject = async () => {
    if (!subjectId) return;
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, color, icon")
      .eq("id", subjectId)
      .single();
    if (!error && data) {
      setSubject(data);
    }
  };

  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  const recordingDate = new Date();
  const formattedDate = recordingDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = recordingDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleTranscribe = async () => {
    if (!recordingId) {
      alert('Recording ID not found');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordingId }),
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const result = await transcribeResponse.json();
      console.log('Transcription result:', result);

      // Navigate to transcription page
      router.push(`/transcription/${recordingId}/${subjectId}`);
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError('Failed to transcribe audio. Please try again.');
      setIsTranscribing(false);
    }
  };

  const handleSaveLater = () => {
    localStorage.removeItem('recordingBlob');
    // Trigger refresh event before navigating
    window.dispatchEvent(new Event('refreshRecordings'));
    router.push("/");
  };

  const handleCancel = async () => {
    if (!recordingId) {
      window.dispatchEvent(new Event('refreshRecordings'));
      router.push("/");
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to delete this recording? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setTranscriptionError(null);

    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recording');
      }
      localStorage.removeItem('recordingBlob');
      window.dispatchEvent(new Event('refreshRecordings'));
      router.push("/");
    } catch (error) {
      console.error('Delete error:', error);
      setTranscriptionError('Failed to delete recording. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!subject) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-purple-100 to-white">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mr-3" />
        <span className="text-gray-500 text-lg">Loading subject...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Success Icon */}
          <div className="px-6 pt-20 pb-8 flex flex-col items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-full mb-6 shadow-lg shadow-purple-200">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl text-gray-900 mb-2">Recording Complete!</h1>
            <p className="text-sm text-gray-500 text-center">
              Your lecture has been saved
            </p>
          </div>

          {/* Recording Summary */}
          <div className="px-6 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-md">
              <div className="text-center mb-6">
                <div className="text-3xl text-gray-900 mb-2">
                  {subject.name}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm">
                  <Clock className="w-4 h-4" />
                  <span>
                    {durationMin}:{durationSec.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="text-gray-600">{formattedDate}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="text-gray-600">{formattedTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-12 mt-auto">
            {transcriptionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                {transcriptionError}
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing || isDeleting}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl py-4 px-6 shadow-lg shadow-purple-200 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-base">Transcribing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">Transcribe Now</span>
                    <span className="text-xl">✨</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveLater}
                disabled={isTranscribing || isDeleting}
                className="w-full bg-white text-gray-700 rounded-2xl py-4 px-6 border-2 border-gray-200 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span className="text-base">Save for Later</span>
              </button>

              <button
                onClick={handleCancel}
                disabled={isTranscribing || isDeleting}
                className="w-full bg-white text-red-600 rounded-2xl py-4 px-6 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-base">Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span className="text-base">Cancel & Delete</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              You can transcribe this recording anytime from your notes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostRecordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white"><Loader2 className="w-12 h-12 text-purple-500 animate-spin" /></div>}>
      <PostRecordContent />
    </Suspense>
  );
}
