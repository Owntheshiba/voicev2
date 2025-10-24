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
  const [timeframe, setTimeframe] = useState<"all" | "weekly" | "monthly">("all");

  const fetchLeaderboard = useCallback(async (timeframeParam: string = timeframe) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?timeframe=${timeframeParam}&limit=50`);
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
  }, [timeframe]);

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
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>

      {/* Timeframe Filter */}
      <div className="flex justify-center gap-2 mb-6">
        <Button
          variant={timeframe === "all" ? "default" : "outline"}
          onClick={() => setTimeframe("all")}
          size="sm"
        >
          All Time
        </Button>
        <Button
          variant={timeframe === "weekly" ? "default" : "outline"}
          onClick={() => setTimeframe("weekly")}
          size="sm"
        >
          Weekly
        </Button>
        <Button
          variant={timeframe === "monthly" ? "default" : "outline"}
          onClick={() => setTimeframe("monthly")}
          size="sm"
        >
          Monthly
        </Button>
      </div>


      {/* Leaderboard Entries */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available for this timeframe
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div key={entry.user.fid} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {getBadge(entry.rank)}
                </div>
                
                {/* User Info */}
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.user.pfpUrl} alt={getDisplayName(entry.user)} />
                    <AvatarFallback className="text-sm">{getInitials(entry.user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{getDisplayName(entry.user)}</div>
                    <div className="text-xs text-gray-500">@{entry.user.username || `user_${entry.user.fid}`}</div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right">
                  <div className="text-sm text-gray-600">{entry.voicesCount} voices</div>
                  <div className="font-bold text-purple-600">{entry.totalPoints.toLocaleString()} XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}