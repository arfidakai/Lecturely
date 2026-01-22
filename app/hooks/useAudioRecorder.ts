import { useState, useRef, useCallback } from 'react';
import RecordRTC from 'recordrtc';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      streamRef.current = stream;

      // Initialize RecordRTC
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000, // Good for speech recognition
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      setError(null);

      // Start duration counter
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      console.error('Recording error:', err);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.pauseRecording();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRecording]);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && isPaused) {
      recorderRef.current.resumeRecording();
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, [isPaused]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (recorderRef.current) {
        recorderRef.current.stopRecording(() => {
          const blob = recorderRef.current!.getBlob();
          const url = URL.createObjectURL(blob);
          
          setAudioBlob(blob);
          setAudioUrl(url);
          setIsRecording(false);
          setIsPaused(false);

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          // Clear interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          resolve(blob);
        });
      }
    });
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    error,
  };
};
