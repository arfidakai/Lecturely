"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Pause, Square, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Subject } from "../types";
import { supabase } from "../lib/supabase";
import { fetchWithAuthFormData } from "../lib/fetch-with-auth";
import { useLanguage } from "../contexts/LanguageContext";


function RecordingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const [subject, setSubject] = useState<Subject | null>(null);
  const { t } = useLanguage();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Post-stop modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubject, setModalSubject] = useState<Subject | null>(null);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);
  const [savedDuration, setSavedDuration] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Subject loading on mount
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchAllSubjects();
  }, []);

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

  const fetchAllSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, color, icon")
        .order("name");
      if (!error && data) {
        setAllSubjects(data);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const handleStartStop = async () => {
    console.log('Button clicked!', { isRecording });
    if (!isRecording) {
      // Start recording immediately without validation
      try {
        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
        console.log('Microphone access granted');
        streamRef.current = stream;
        chunksRef.current = [];
        
        // Pilih MIME type yang didukung
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        
        console.log('Using MIME type:', mimeType);
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log('Data chunk received:', e.data.size, 'bytes');
            chunksRef.current.push(e.data);
          }
        };
        
        // Start dengan timeslice 100ms untuk capture data lebih konsisten
        mediaRecorder.start(100);
        setIsRecording(true);
        setError(null);
        console.log('Recording started');
      } catch (err) {
        console.error('Recording error:', err);
        setError(t.common.failed);
        alert(t.common.failed);
      }
    } else {
      console.log('Stopping recording...');
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          console.log('Recording stopped. Blob size:', blob.size, 'bytes');
          console.log('Recording duration:', duration, 'seconds');
          
          // Validasi: blob harus ada dan minimal 1KB
          if (blob.size < 1000) {
            setError(t.common.failed);
            setIsSaving(false);
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            return;
          }
          // Validasi: durasi minimal 1 detik
          if (duration < 1) {
            setError(t.common.failed);
            setIsSaving(false);
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            return;
          }
          
          console.log('Recording valid, showing save modal...');
          // Save blob and duration for modal submission
          setSavedBlob(blob);
          setSavedDuration(duration);
          setModalTitle('');
          setModalSubject(null); // Don't pre-select subject
          setShowSaveModal(true);
          setIsRecording(false);
        };
      }
    }
  };

  const handlePause = () => {
    console.log('Pause clicked!', { isPaused });
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleCancel = () => {
    if (!isRecording) {
      router.back();
      return;
    }

    const confirmed = confirm(t.recording.deleteConfirm);
    
    if (!confirmed) return;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    chunksRef.current = [];
    
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setError(null);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getPreviewFilename = (title: string) => {
    const safeTitle = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const finalTitle = safeTitle || "untitled-recording";
    const date = new Date().toISOString().split("T")[0];

    return `${finalTitle}-${date}.webm`;
  };

  const handleSaveRecording = async () => {
    if (!modalTitle.trim()) {
      alert(t.common.subject + " is required");
      return;
    }
    if (!modalSubject) {
      alert("Subject is required");
      return;
    }
    if (!savedBlob) {
      alert("Recording not found");
      return;
    }

    setIsSaving(true);
    try {
      // Use API endpoint to save recording (respects RLS)
      const formData = new FormData();
      formData.append("audio", savedBlob);
      formData.append("title", modalTitle.trim());
      formData.append("subjectId", modalSubject.id);
      formData.append("duration", savedDuration.toString());

      const response = await fetchWithAuthFormData("/api/recordings", formData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save recording");
      }

      const result = await response.json();
      const recordingId = result.recording.id;

      setShowSaveModal(false);
      setModalTitle("");
      setModalSubject(null);
      setSavedBlob(null);
      setSavedDuration(0);

      // Navigate to post-record page
      router.push(
        `/post-record?duration=${savedDuration}&subjectId=${modalSubject.id}&recordingId=${recordingId}`
      );
    } catch (err) {
      console.error("Error saving recording:", err);
      setError(err instanceof Error ? err.message : "Failed to save recording. Please try again.");
      setIsSaving(false);
    }
  };

  const handleCancelModal = () => {
    // Stop all tracks if still recording
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowSaveModal(false);
    setModalTitle("");
    setModalSubject(null);
    setSavedBlob(null);
    setSavedDuration(0);
    setDuration(0);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white">
      <div className="min-h-screen w-full max-w-md mx-auto bg-white overflow-hidden">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
          {/* Header */}
          <div className="px-6 pt-16 pb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-full transition-colors active:scale-95 mb-6"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Recording Visual */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Timer - Only show when recording */}
            {isRecording && (
              <div className="text-5xl text-gray-900 mb-16 tabular-nums">
                {formatTime(duration)}
              </div>
            )}

            {/* Waveform Animation - Only show when recording */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1.5 mb-16 h-20">
                {[...Array(25)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-purple-400 rounded-full"
                    animate={
                      isRecording && !isPaused
                        ? {
                            height: [
                              Math.random() * 30 + 20,
                              Math.random() * 60 + 20,
                              Math.random() * 30 + 20,
                            ],
                          }
                        : { height: 20 }
                    }
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Info Text - Only show when not recording */}
            {!isRecording && (
              <div className="text-center mb-16">
                <p className="text-lg text-gray-600 font-medium mb-2">Ready to record</p>
                <p className="text-sm text-gray-400">Tap the button below to start recording your lecture</p>
              </div>
            )}

            {/* Record Button */}
            <div className="relative mb-8 z-50">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartStop();
                }}
                disabled={isSaving}
                className="relative bg-transparent border-0 p-0 cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${
                    isRecording
                      ? "bg-purple-500"
                      : "bg-gradient-to-br from-purple-500 to-purple-600"
                  }`}
                  style={{
                    transform: isRecording && !isPaused ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 1.5s ease-in-out',
                  }}
                >
                  {isRecording ? (
                    <Square className="w-10 h-10 text-white fill-white" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500" />
                  )}
                </div>

                {isRecording && !isPaused && (
                  <div
                    className="absolute inset-0 rounded-full bg-purple-400 pointer-events-none"
                    style={{
                      zIndex: -1,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-500 mb-4 text-center px-4">
                {error}
              </div>
            )}

            {isSaving && (
              <div className="text-sm text-purple-600 mb-4 text-center px-4">
                {t.common.saving}
              </div>
            )}

            <div className="text-sm text-gray-500 mb-8">
            {isRecording 
  ? (isPaused ? t.recording.paused : t.recording.recording) 
  : t.recording.startRecording}
            </div>

            {/* Action Buttons */}
            {isRecording && (
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePause();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer z-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Pause className="w-5 h-5" />
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancel();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer z-50 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200"
                  type="button"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <X className="w-5 h-5" />
                  <span>{t.common.cancel}</span>
                </button>
              </div>
            )}
          </div>

          {/* Save Recording Modal */}
          {showSaveModal && (
            <div className="fixed inset-0 bg-black/50 flex items-end z-50">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 shadow-2xl"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Save Recording
                  </h2>

                  {/* Subject Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={modalSubject?.id || ""}
                      onChange={(e) => {
                        const selected = allSubjects.find(
                          (s) => s.id === e.target.value
                        );
                        setModalSubject(selected || null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Select a subject</option>
                      {allSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.icon} {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recording Title
                    </label>
                    <input
                      type="text"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      placeholder="e.g., Algorithms Lecture"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  {/* Recording Info */}
                  <div className="bg-purple-50 rounded-lg p-4 mb-4 space-y-2 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">{formatTime(savedDuration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">File Size:</span>
                      <span className="font-semibold text-gray-900">{savedBlob ? (savedBlob.size / 1024 / 1024).toFixed(2) : "0"} MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Format:</span>
                      <span className="font-semibold text-gray-900">Audio WebM</span>
                    </div>
                    <div className="pt-2 border-t border-purple-200">
                      <span className="text-xs text-gray-500">Suggested filename:</span>
                      <p className="text-xs text-gray-700 mt-1 font-mono break-all bg-white p-2 rounded">
                        {getPreviewFilename(modalTitle)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelModal}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecording}
                    disabled={isSaving || !modalTitle.trim() || !modalSubject}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      "Save & Transcribe"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecordingPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white"><div className="animate-pulse text-gray-500">Loading...</div></div>}>
      <RecordingContent />
    </Suspense>
  );
}
