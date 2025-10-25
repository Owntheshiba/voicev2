"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

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

    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      // You could show a toast or error message here
    };

    const handleLoadError = (e: any) => {
      console.error('Audio load error:', e);
      setIsPlaying(false);
      // You could show a toast or error message here
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loaderror', handleLoadError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loaderror', handleLoadError);
    };
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div 
      className={`
        w-full max-w-md mx-auto mb-4
        ${isAnimating ? 'animate-scale-in' : ''}
      `}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <article className="chat-voice-card" aria-label="Voice note message">
        <div className="avatar" aria-hidden="true">
          <Mic className="w-6 h-6 text-white" />
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
                <Pause className="w-5 h-5 text-blue-800" />
              ) : (
                <Play className="w-5 h-5 text-blue-800" />
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
        onError={(e) => {
          console.error('Audio file not found:', voice.audioUrl);
          setIsPlaying(false);
        }}
      />
    </div>
  );
}
