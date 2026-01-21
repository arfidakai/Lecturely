export type Subject = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type Recording = {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  duration: number;
  transcribed: boolean;
  transcription?: TranscriptionSegment[];
  summary?: string;
};

export type TranscriptionSegment = {
  id: string;
  text: string;
  timestamp: number;
  important: boolean;
};
