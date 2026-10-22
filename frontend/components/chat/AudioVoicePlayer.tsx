'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioVoicePlayerProps {
  src: string;
  durationSeconds?: number;
  isSender?: boolean;
}

export const AudioVoicePlayer: React.FC<AudioVoicePlayerProps> = ({
  src,
  durationSeconds = 0,
  isSender = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Render decorative audio wave bars
  const bars = [40, 65, 85, 30, 95, 50, 70, 90, 45, 60, 80, 55, 75, 35, 90, 65];

  return (
    <div
      className={`flex items-center gap-3 py-1 px-2 rounded-2xl select-none max-w-[280px] sm:max-w-[320px] ${
        isSender ? 'text-emerald-950 dark:text-emerald-50' : 'text-slate-800 dark:text-slate-200'
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${
          isSender
            ? 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1 h-6 cursor-pointer" onClick={togglePlay}>
          {bars.map((height, i) => {
            const barPct = (i / bars.length) * 100;
            const isFilled = progressPct >= barPct;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? isSender
                      ? 'bg-emerald-700 dark:bg-emerald-400'
                      : 'bg-emerald-600 dark:bg-emerald-400'
                    : isSender
                    ? 'bg-emerald-300/60 dark:bg-emerald-800/60'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {/* Time counter */}
        <div className="flex justify-between items-center text-[11px] font-mono opacity-80 leading-none">
          <span>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
          <Volume2 className="w-3 h-3 opacity-60" />
        </div>
      </div>
    </div>
  );
};
