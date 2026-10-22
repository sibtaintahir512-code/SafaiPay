'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecorded, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startRecording() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Audio recording is not supported in this browser environment.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(250); // collect chunks every 250ms
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        if (mounted) {
          setPermissionError(err.message || 'Microphone access denied. Please allow microphone permissions.');
        }
      }
    }

    startRecording();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    if (timerRef.current) clearInterval(timerRef.current);

    recorder.onstop = () => {
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      onRecorded(audioBlob, seconds);
    };

    recorder.stop();
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onCancel();
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (permissionError) {
    return (
      <div className="flex items-center justify-between w-full p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 text-xs">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="px-2 py-1 bg-red-100 dark:bg-red-900/60 rounded-lg font-semibold hover:bg-red-200"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <Mic className="w-4 h-4 text-red-500" />
        </div>
        <span className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-100">
          {formatTimer(seconds)}
        </span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
          Recording voice note...
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Cancel recording"
          aria-label="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          disabled={seconds === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-full shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          title="Send voice note"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
