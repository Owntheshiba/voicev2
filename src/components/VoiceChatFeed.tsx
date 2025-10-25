"use client";

import { useState, useEffect } from "react";
import { VoiceChatCard } from "./VoiceChatCard";

interface Voice {
  id: string;
  user: {
    fid: string;
    username: string;
    displayName?: string;
  };
  audioUrl: string;
  duration: number;
  createdAt: string;
}

interface VoiceChatFeedProps {
  voices: Voice[];
  className?: string;
}

export function VoiceChatFeed({ voices, className }: VoiceChatFeedProps) {
  const [visibleVoices, setVisibleVoices] = useState<Voice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (voices.length === 0) return;

    const interval = setInterval(() => {
      if (currentIndex < voices.length) {
        setVisibleVoices(prev => [...prev, voices[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      } else {
        // Reset after all voices are shown
        setTimeout(() => {
          setVisibleVoices([]);
          setCurrentIndex(0);
        }, 3000); // Wait 3 seconds before restarting
      }
    }, 1500); // Show new voice every 1.5 seconds

    return () => clearInterval(interval);
  }, [voices, currentIndex]);

  return (
    <div className={`voice-chat-feed ${className || ''}`}>
      <div className="relative h-screen overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50" />
        
        {/* Voice cards container */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          {visibleVoices.map((voice, index) => (
            <VoiceChatCard
              key={`${voice.id}-${index}`}
              voice={voice}
              isAnimating={true}
              animationDelay={index * 200} // Stagger animation
            />
          ))}
        </div>

        {/* Floating elements for visual appeal */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-pulse" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-pink-200 rounded-full opacity-30 animate-bounce" />
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-blue-200 rounded-full opacity-25 animate-pulse" />
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-bounce" />
      </div>
    </div>
  );
}
