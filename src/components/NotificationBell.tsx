"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Bell } from "lucide-react";
import { cn } from "~/lib/utils";

interface NotificationBellProps {
  onClick: () => void;
  currentUserFid?: string;
  className?: string;
}

export function NotificationBell({ onClick, currentUserFid, className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserFid) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userFid=${currentUserFid}&unreadOnly=true`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserFid]);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={cn("relative text-white hover:bg-blue-800/30 border border-blue-600/30 hover:border-blue-500", className)}
    >
      <Bell className="h-5 w-5 text-blue-200" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-red-500 animate-pulse"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
