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
      <div className="relative min-h-[400px] max-h-[600px] overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 rounded-2xl" />
        
        {/* Voice cards container */}
        <div className="relative z-10 flex flex-col items-center justify-start h-full px-4 py-6 space-y-4">
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
        <div className="absolute top-4 left-4 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse" />
        <div className="absolute top-20 right-8 w-12 h-12 bg-blue-300 rounded-full opacity-30 animate-bounce" />
        <div className="absolute bottom-16 left-8 w-8 h-8 bg-blue-400 rounded-full opacity-25 animate-pulse" />
        <div className="absolute bottom-8 right-4 w-20 h-20 bg-blue-500 rounded-full opacity-20 animate-bounce" />
      </div>
    </div>
  );
}
