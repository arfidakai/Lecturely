"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Pause, Square, X } from "lucide-react";
import { motion } from "framer-motion";
import { Subject } from "../types";
import { supabase } from "../lib/supabase";

function RecordingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const [subject, setSubject] = useState<Subject | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
      setTitleTouched(true);
      if (!title.trim()) {
        setError('Judul/materi harus diisi sebelum mulai rekaman');
        return;
      }
      if (!subject) {
        setError('Subject belum dimuat. Silakan coba lagi.');
        return;
      }
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
        setError('Failed to access microphone');
        alert('Cannot access microphone. Please check permissions.');
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
            setError('Audio recording failed or too short. Please try again.');
            setIsSaving(false);
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            return;
          }
          
          // Validasi: durasi minimal 1 detik
          if (duration < 1) {
            setError('Recording too short. Please record at least 1 second.');
            setIsSaving(false);
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            return;
          }
          
          console.log('Recording valid, saving to Supabase...');
          setIsSaving(true);
          
          try {
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');
            if (!subject) {
              setError('Subject belum dimuat. Silakan coba lagi.');
              setIsSaving(false);
              setIsRecording(false);
              return;
            }
            formData.append('subjectId', subject.id);
            formData.append('duration', duration.toString());
            formData.append('title', title.trim());

            const response = await fetch('/api/recordings', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to save recording');
            }

            const { recording } = await response.json();
            console.log('Recording saved successfully:', recording);
            
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            console.log('Navigating to post-record...');
            router.push(`/post-record?duration=${duration}&subjectId=${subject.id}&recordingId=${recording.id}`);
          } catch (error) {
            console.error('Error saving recording:', error);
            setError('Failed to save recording. Please try again.');
            setIsSaving(false);
            setIsRecording(false);
          }
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

    const confirmed = confirm('Are you sure you want to cancel this recording? It will not be saved.');
    
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
    setTitle('');
    setTitleTouched(false);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
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

          {/* Subject Info */}
          <div className="px-6 mb-12">
            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${subject?.color}20` }}
              >
                {subject?.icon}
              </div>
              <div>
                <div className="text-sm text-gray-900">{subject?.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recording Visual */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Input Judul/Materi */}
            {!isRecording && (
              <div className="w-full max-w-md mb-8">
                <label htmlFor="judul" className="block text-sm font-medium text-gray-700 mb-2">Judul/Materi Perkuliahan</label>
                <input
                  id="judul"
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setError(null); }}
                  onBlur={() => setTitleTouched(true)}
                  className={`w-full px-4 py-3 rounded-xl border ${titleTouched && !title.trim() ? 'border-red-400' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 text-base bg-white shadow-sm`}
                  placeholder="Contoh: Algoritma Sorting, Limit Tak Hingga, dll"
                  disabled={isRecording || isSaving}
                  autoFocus
                />
                {titleTouched && !title.trim() && (
                  <div className="text-xs text-red-500 mt-2">Judul/materi wajib diisi</div>
                )}
              </div>
            )}

            {/* Timer */}
            <div className="text-5xl text-gray-900 mb-16 tabular-nums">
              {formatTime(duration)}
            </div>

            {/* Waveform Animation */}
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

            {/* Record Button */}
            <div className="relative mb-8 z-50">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartStop();
                }}
                disabled={isSaving || (!isRecording && !title.trim())}
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
                Saving recording...
              </div>
            )}

            <div className="text-sm text-gray-500 mb-8">
              {isRecording ? (isPaused ? "Paused" : "Recording...") : "Isi judul materi lalu tap untuk mulai"}
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
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecordingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-white"><div className="animate-pulse text-gray-500">Loading...</div></div>}>
      <RecordingContent />
    </Suspense>
  );
}
