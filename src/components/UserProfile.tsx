"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { VoicePlayer } from "./VoicePlayer";
import { Heart, MessageCircle, Eye, Trophy, Mic } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  fid: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  createdAt: string;
  stats: {
    totalVoices: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalPoints: number;
    viewPoints: number;
    likePoints: number;
    commentPoints: number;
    rank: number;
  };
  voices: Array<{
    id: string;
    audioUrl: string;
    duration: number;
    title?: string;
    description?: string;
    isAnonymous?: boolean;
    createdAt: string;
    likes: Array<{ userFid: string }>;
    comments: Array<{ id: string }>;
    views: Array<{ id: string }>;
  }>;
}

interface UserProfileProps {
  userFid?: string;
  className?: string;
}

export function UserProfile({ userFid, className }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProfile = useCallback(async () => {
    if (!userFid) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userFid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userFid]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getDisplayName = () => {
    if (!profile) return "Loading...";
    return profile.displayName || profile.username || `User ${profile.fid}`;
  };

  const getUsername = () => {
    if (!profile) return "Loading...";
    return profile.username || `user_${profile.fid}`;
  };

  const getInitials = () => {
    if (!profile) return "U";
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-white">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-white">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Profile Header - Simplified */}
      <Card className="p-4 mb-4 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border-purple-500/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.pfpUrl} alt={getDisplayName()} />
            <AvatarFallback className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{getDisplayName()}</h1>
            <p className="text-sm text-blue-200">@{getUsername()}</p>
            {profile.bio && (
              <p className="text-sm text-blue-300 mt-1">{profile.bio}</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-white">{formatNumber(profile.stats.totalPoints)} XP</div>
            <div className="text-xs text-blue-200">Rank #{profile.stats.rank}</div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border-purple-500/30">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-800/50">Overview</TabsTrigger>
          <TabsTrigger value="voices" className="text-white data-[state=active]:bg-purple-800/50">Voices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="p-6 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border-purple-500/30">
            <h3 className="text-lg font-semibold mb-4 text-white">Points Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Views</span>
                </div>
                <span className="font-medium text-white">{formatNumber(profile.stats.viewPoints)} pts</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-400" />
                  <span className="text-white">Likes</span>
                </div>
                <span className="font-medium text-white">{formatNumber(profile.stats.likePoints)} pts</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-white">Comments</span>
                </div>
                <span className="font-medium text-white">{formatNumber(profile.stats.commentPoints)} pts</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-purple-500/30">
              <h4 className="font-medium mb-2 text-white">Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {profile.stats.totalVoices >= 1 && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400">
                    <Mic className="h-3 w-3" />
                    First Voice
                  </Badge>
                )}
                {profile.stats.totalLikes >= 100 && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400">
                    <Heart className="h-3 w-3" />
                    Popular Creator
                  </Badge>
                )}
                {profile.stats.totalComments >= 50 && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400">
                    <MessageCircle className="h-3 w-3" />
                    Conversation Starter
                  </Badge>
                )}
                {profile.stats.rank <= 10 && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400">
                    <Trophy className="h-3 w-3" />
                    Top 10
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="voices" className="mt-6">
          <div className="space-y-4">
            {profile.voices.length === 0 ? (
              <Card className="p-6 text-center bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border-purple-500/30">
                <Mic className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <p className="text-white">No voices yet</p>
                <p className="text-sm text-blue-200">Start recording to share your voice!</p>
              </Card>
            ) : (
              profile.voices.map((voice) => (
                <Card key={voice.id} className="p-4 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border-purple-500/30">
                  <div className="flex items-start gap-4">
                    {/* Voice Player */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-purple-500 text-purple-300">
                          {formatDuration(voice.duration)}
                        </Badge>
                        {voice.isAnonymous && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            Anonymous
                          </Badge>
                        )}
                        <span className="text-sm text-blue-300">
                          {formatDistanceToNow(new Date(voice.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {voice.title && (
                        <h4 className="font-medium mb-2 text-white">{voice.title}</h4>
                      )}
                      
                      {voice.description && (
                        <p className="text-sm text-blue-200 mb-3">{voice.description}</p>
                      )}

                      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-3 border border-purple-500/30">
                        <VoicePlayer
                          audioUrl={voice.audioUrl}
                          duration={voice.duration}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right text-sm text-blue-200">
                      <div className="flex items-center gap-1 mb-1">
                        <Eye className="h-3 w-3" />
                        {voice.views.length}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-3 w-3" />
                        {voice.likes.length}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <MessageCircle className="h-3 w-3" />
                        {voice.comments.length}
                      </div>
                      <div className="text-xs mt-2 text-blue-300">
                        {voice.views.length + (voice.likes.length * 5) + (voice.comments.length * 10)} pts
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
