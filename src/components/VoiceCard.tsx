"use client";

import React, { useCallback, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { VoicePlayer } from "./VoicePlayer";
import { CommentModal } from "./CommentModal";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface VoiceCardProps {
  voice: {
    id: string;
    audioUrl: string;
    duration: number;
    title?: string;
    description?: string;
    isAnonymous?: boolean;
    createdAt: string;
    user: {
      fid: string;
      username?: string;
      displayName?: string;
      pfpUrl?: string;
    };
    likes: Array<{ userFid: string }>;
    comments: Array<{ id: string }>;
    views: Array<{ id: string }>;
  };
  currentUserFid?: string;
  onLike: (voiceId: string) => Promise<void>;
  onComment: (voiceId: string) => void;
  onShare: (voiceId: string) => void;
  onView: (voiceId: string) => Promise<void>;
  className?: string;
}

export function VoiceCard({
  voice,
  currentUserFid,
  onLike,
  onComment,
  onShare,
  onView,
  className,
}: VoiceCardProps) {
  const [isLiked, setIsLiked] = useState(
    voice.likes.some(like => like.userFid === currentUserFid)
  );
  const [likeCount, setLikeCount] = useState(voice.likes.length);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await onLike(voice.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error("Failed to like voice:", error);
    } finally {
      setIsLiking(false);
    }
  }, [voice.id, isLiked, isLiking, onLike]);

  const handlePlay = useCallback(() => {
    onView(voice.id);
  }, [voice.id, onView]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayName = () => {
    if (voice.isAnonymous) {
      return "Anonymous";
    }
    return voice.user.displayName || voice.user.username || `User ${voice.user.fid}`;
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {voice.isAnonymous ? (
              <AvatarFallback className="bg-gray-500 text-white">
                <span className="text-xs">?</span>
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={voice.user.pfpUrl} alt={getDisplayName()} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </>
            )}
          </Avatar>
          <div>
            <p className="font-medium text-sm">{getDisplayName()}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(voice.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {formatDuration(voice.duration)}
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title & Description */}
      {(voice.title || voice.description) && (
        <div className="space-y-2">
          {voice.title && (
            <h3 className="font-semibold text-lg">{voice.title}</h3>
          )}
          {voice.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {voice.description}
            </p>
          )}
        </div>
      )}

      {/* Voice Player */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <VoicePlayer
          audioUrl={voice.audioUrl}
          duration={voice.duration}
          onPlay={handlePlay}
          className="w-full"
        />
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{voice.views.length} views</span>
          <span>{likeCount} likes</span>
          <span>{voice.comments.length} comments</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "flex items-center gap-2",
              isLiked && "text-red-600 hover:text-red-700"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            {isLiking ? "..." : likeCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {voice.comments.length}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare(voice.id)}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Points Badge */}
        <Badge variant="outline" className="text-xs">
          {voice.views.length + (likeCount * 5) + (voice.comments.length * 10)} pts
        </Badge>
      </div>

      {/* Comment Modal */}
      <CommentModal
        voiceId={voice.id}
        currentUserFid={currentUserFid}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </Card>
  );
}
