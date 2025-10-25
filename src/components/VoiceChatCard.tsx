"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceChatCardProps {
  voice: {
    id: string;
    user: {
      fid: string;
      username: string;
      displayName?: string;
    };
    audioUrl: string;
    duration: number;
    createdAt: string;
  };
  isAnimating?: boolean;
  animationDelay?: number;
}

export function VoiceChatCard({ 
  voice, 
  isAnimating = false, 
  animationDelay = 0 
}: VoiceChatCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div 
      className={`
        w-full max-w-md mx-auto mb-4
        ${isAnimating ? 'animate-slide-up' : ''}
      `}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <article className="chat-voice-card" aria-label="Voice note message">
        <div className="avatar" aria-hidden="true">
          {getInitials(voice.user.displayName || voice.user.username)}
        </div>

        <div className="flex-1">
          <div className="voice-bubble" role="group" aria-label="Voice message">
            <button 
              className="play-btn" 
              onClick={handlePlayPause}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-purple-600" />
              ) : (
                <Play className="w-5 h-5 text-purple-600" />
              )}
            </button>

            <div 
              className={`waveform ${!isPlaying ? 'paused' : ''}`} 
              ref={waveformRef}
              aria-hidden="true"
            >
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>

          <div className="meta">
            {formatTime(currentTime || voice.duration)} • Voice note
          </div>
        </div>
      </article>

      <audio
        ref={audioRef}
        src={voice.audioUrl}
        preload="metadata"
      />
    </div>
  );
}
