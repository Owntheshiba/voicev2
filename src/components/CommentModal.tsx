"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Mic, Send, X } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";
import { VoicePlayer } from "./VoicePlayer";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content?: string;
  audioUrl?: string;
  type: "text" | "audioUrl";
  createdAt: string;
  user: {
    fid: string;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
}

interface CommentModalProps {
  voiceId: string;
  currentUserFid?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentModal({ voiceId, currentUserFid, isOpen, onClose }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!voiceId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/voices/${voiceId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [voiceId]);

  // Submit text comment
  const submitTextComment = useCallback(async () => {
    if (!commentText.trim() || !currentUserFid) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/voices/${voiceId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userFid: currentUserFid,
          content: commentText.trim(),
          type: 'TEXT',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit comment');
      }

      const data = await response.json();
      setComments(prev => [...prev, data.comment]);
      setCommentText("");
      toast.success('Comment posted!');
    } catch (error: any) {
      console.error('Failed to submit comment:', error);
      toast.error(error.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [voiceId, currentUserFid, commentText]);

  // Submit voice comment
  const submitVoiceComment = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!currentUserFid) {
      throw new Error("User not authenticated");
    }

    setIsUploadingVoice(true);
    try {
      // First upload the audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, `comment_${Date.now()}.mp3`);
      
      const uploadResponse = await fetch("/api/voices/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload voice comment");
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.voice.audioUrl;

      // Then create the comment
      const commentResponse = await fetch(`/api/voices/${voiceId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userFid: currentUserFid,
          audioUrl: audioUrl,
          type: 'VOICE',
        }),
      });

      if (!commentResponse.ok) {
        const error = await commentResponse.json();
        throw new Error(error.error || 'Failed to submit voice comment');
      }

      const commentData = await commentResponse.json();
      setComments(prev => [...prev, commentData.comment]);
      setShowVoiceRecorder(false);
      toast.success('Voice comment posted!');
    } catch (error: any) {
      console.error('Failed to submit voice comment:', error);
      toast.error(error.message || 'Failed to post voice comment');
      throw error;
    } finally {
      setIsUploadingVoice(false);
    }
  }, [voiceId, currentUserFid]);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  const getDisplayName = (user: Comment['user']) => {
    return user.displayName || user.username || `User ${user.fid}`;
  };

  const getInitials = (user: Comment['user']) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col bg-blue-900/95 border-blue-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Comments</DialogTitle>
            <DialogDescription className="text-blue-200">
              Join the conversation and share your thoughts
            </DialogDescription>
          </DialogHeader>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loading ? (
              <div className="text-center py-4 text-white">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-blue-300">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user.pfpUrl} alt={getDisplayName(comment.user)} />
                    <AvatarFallback className="bg-blue-700 text-white">{getInitials(comment.user)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-white">{getDisplayName(comment.user)}</span>
                      <span className="text-xs text-blue-300">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {comment.type === "text" ? (
                      <p className="text-sm text-blue-200">{comment.content}</p>
                    ) : (
                      <div className="bg-blue-800/50 rounded-lg p-2 border border-blue-700">
                        <VoicePlayer
                          audioUrl={comment.content!}
                          className="w-full"
                          showControls={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          {currentUserFid && (
            <div className="border-t border-blue-700 pt-4 space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 min-h-[60px] bg-blue-800/50 border-blue-600 text-white placeholder-blue-300"
                  maxLength={500}
                />
                <Button
                  onClick={() => setShowVoiceRecorder(true)}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-blue-600 text-blue-300 hover:bg-blue-800/30"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-300">
                  {commentText.length}/500 characters
                </span>
                <Button
                  onClick={submitTextComment}
                  disabled={!commentText.trim() || submitting}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Voice Recorder for Comments */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onUpload={submitVoiceComment}
          onCancel={() => setShowVoiceRecorder(false)}
          isUploading={isUploadingVoice}
        />
      )}
    </>
  );
}
