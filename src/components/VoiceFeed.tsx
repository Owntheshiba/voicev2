"use client";

import React, { useCallback, useEffect, useState } from "react";
import { VoiceCard } from "./VoiceCard";
import { Button } from "~/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Voice {
  id: string;
  audioUrl: string;
  duration: number;
  title?: string;
  description?: string;
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
}

interface VoiceFeedProps {
  currentUserFid?: string;
  className?: string;
}

export function VoiceFeed({ currentUserFid, className }: VoiceFeedProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVoices = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/voices/random?limit=10&page=${pageNum}`);
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      const newVoices = data.voices || [];

      if (refresh || pageNum === 1) {
        setVoices(newVoices);
      } else {
        setVoices(prev => [...prev, ...newVoices]);
      }

      setHasMore(newVoices.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      toast.error('Failed to load voices');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchVoices(page + 1);
    }
  }, [fetchVoices, page, loadingMore, hasMore]);

  const refresh = useCallback(() => {
    fetchVoices(1, true);
  }, [fetchVoices]);

  const handleLike = useCallback(async (voiceId: string) => {
    try {
      const response = await fetch(`/api/voices/${voiceId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userFid: currentUserFid }),
      });

      if (!response.ok) {
        throw new Error('Failed to like voice');
      }
    } catch (error) {
      console.error('Failed to like voice:', error);
      toast.error('Failed to like voice');
      throw error;
    }
  }, [currentUserFid]);

  const handleView = useCallback(async (voiceId: string) => {
    try {
      await fetch(`/api/voices/${voiceId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userFid: currentUserFid }),
      });
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  }, [currentUserFid]);

  const handleComment = useCallback((voiceId: string) => {
    // This is now handled by VoiceCard directly
  }, []);

  const handleShare = useCallback((voiceId: string) => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Check out this voice!',
        url: `${window.location.origin}/voice/${voiceId}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/voice/${voiceId}`);
      toast.success('Link copied to clipboard!');
    }
  }, []);

  // Load initial voices
  useEffect(() => {
    fetchVoices(1);
  }, [fetchVoices]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading voices...</span>
        </div>
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No voices found</p>
        <Button onClick={refresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Refresh Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={refresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Feed
            </>
          )}
        </Button>
      </div>

      {/* Voice Cards */}
      <div className="space-y-6">
        {voices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            currentUserFid={currentUserFid}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onView={handleView}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && voices.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the feed</p>
          <Button onClick={refresh} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh for new voices
          </Button>
        </div>
      )}
    </div>
  );
}
