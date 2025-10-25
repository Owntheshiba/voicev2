"use client";

import React, { useState, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Heart, MessageCircle, Share, X, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { VoicePlayer } from "./VoicePlayer";
import { CommentModal } from "./CommentModal";
import { formatDistanceToNow } from "date-fns";

interface VoiceCardPopupProps {
  voice: any;
  currentUserFid?: string;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (voiceId: string) => void;
  onComment?: (voiceId: string) => void;
  onShare?: (voiceId: string) => void;
  onView?: (voiceId: string) => void;
}

export function VoiceCardPopup({
  voice,
  currentUserFid,
  isOpen,
  onClose,
  onLike,
  onComment,
  onShare,
  onView,
}: VoiceCardPopupProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(voice?.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = useCallback(async () => {
    if (!currentUserFid || isLiking || !voice?.id) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/voices/${voice.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userFid: currentUserFid }),
      });

      if (!response.ok) {
        throw new Error("Failed to like voice");
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error("Error liking voice:", error);
      toast.error("Failed to like voice");
    } finally {
      setIsLiking(false);
    }
  }, [currentUserFid, voice?.id, isLiking]);

  const handleComment = useCallback(() => {
    if (!voice?.id) return;
    setShowComments(true);
    onComment?.(voice.id);
  }, [voice?.id, onComment]);

  const handleShare = useCallback(() => {
    if (!voice?.id) return;
    onShare?.(voice.id);
  }, [voice?.id, onShare]);

  const handlePlay = useCallback(() => {
    if (!voice?.id) return;
    onView?.(voice.id);
  }, [voice?.id, onView]);

  const getDisplayName = (user: any) => {
    if (voice?.isAnonymous) {
      return "Anonymous";
    }
    return user?.displayName || user?.username || `User ${voice?.userFid || 'Unknown'}`;
  };

  const getInitials = (user: any) => {
    const name = getDisplayName(user);
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const calculatePoints = () => {
    if (!voice) return 0;
    const views = voice?.views?.length || 0;
    const likes = voice?.likes?.length || 0;
    const comments = voice?.comments?.length || 0;
    return views + (likes * 5) + (comments * 10);
  };

  if (!voice || !voice.id) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[380px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-pink-900/95 border-purple-500/30 text-white">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg text-white">Voice Details</DialogTitle>
            <DialogDescription className="text-blue-200">
              Listen to this voice and interact with the community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {voice?.isAnonymous ? (
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    ?
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={voice.user?.pfpUrl} alt={getDisplayName(voice.user)} />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">{getInitials(voice.user)}</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-sm text-white">{getDisplayName(voice.user)}</div>
                <div className="text-xs text-blue-300">
                  {formatDistanceToNow(new Date(voice.createdAt), { addSuffix: true })}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400">
                {calculatePoints()} pts
              </Badge>
            </div>

            {/* Voice Title & Description */}
            <div>
              <h3 className="font-semibold text-base mb-1 text-white">
                {voice.title || "Untitled Voice"}
              </h3>
              {voice.description && (
                <p className="text-sm text-blue-200">{voice.description}</p>
              )}
              <div className="text-xs text-blue-300 mt-1">
                Duration: {Math.round(voice.duration)}s
              </div>
            </div>

            {/* Voice Player */}
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-3 border border-purple-500/30">
              <VoicePlayer 
                audioUrl={voice.audioUrl} 
                onPlay={handlePlay}
                className="w-full"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-around text-center text-sm border-t border-b border-purple-500/30 py-2">
              <div>
                <div className="font-bold text-base text-white">{voice.views?.length || 0}</div>
                <div className="text-blue-300 text-xs">Views</div>
              </div>
              <div>
                <div className="font-bold text-base text-white">{likeCount}</div>
                <div className="text-blue-300 text-xs">Likes</div>
              </div>
              <div>
                <div className="font-bold text-base text-white">{voice.comments?.length || 0}</div>
                <div className="text-blue-300 text-xs">Comments</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-around gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 text-xs px-3 ${
                  isLiked 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                    : "border-purple-500 text-purple-300 hover:bg-purple-800/30"
                }`}
              >
                <Heart className={`h-3 w-3 ${isLiked ? "fill-current" : ""}`} />
                {isLiking ? "..." : likeCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleComment}
                className="flex items-center gap-1 text-xs px-3 border-purple-500 text-purple-300 hover:bg-purple-800/30"
              >
                <MessageCircle className="h-3 w-3" />
                {voice.comments?.length || 0}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1 text-xs px-3 border-purple-500 text-purple-300 hover:bg-purple-800/30"
              >
                <Share className="h-3 w-3" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Modal */}
      <CommentModal
        voiceId={voice.id}
        currentUserFid={currentUserFid}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </>
  );
}
