"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { toast } from "sonner";

interface LeaderboardUser {
  rank: number;
  user: {
    fid: string;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  totalPoints: number;
  voicesCount: number;
}

interface LeaderboardProps {
  className?: string;
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?timeframe=all&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  const getDisplayName = (user: LeaderboardUser['user']) => {
    return user.displayName || user.username || `User ${user.fid}`;
  };

  const getInitials = (user: LeaderboardUser['user']) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-white">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>



      {/* Leaderboard Entries */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-blue-200">
          No leaderboard data available
        </div>
      ) : (
        <div className="space-y-1">
          {leaderboard.map((entry) => (
            <div key={entry.user.fid} className="card-professional p-2">
              <div className="flex items-center gap-2">
                {/* Rank */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                  {getBadge(entry.rank)}
                </div>
                
                {/* User Info */}
                <div className="flex items-center gap-1 flex-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={entry.user.pfpUrl} alt={getDisplayName(entry.user)} />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 text-white">{getInitials(entry.user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-xs text-white truncate">{getDisplayName(entry.user)}</div>
                    <div className="text-xs text-blue-300 truncate">@{entry.user.username || `user_${entry.user.fid}`}</div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right">
                  <div className="text-xs text-blue-300">{entry.voicesCount} voices</div>
                  <div className="font-bold text-xs text-blue-400">{entry.totalPoints.toLocaleString()} XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}