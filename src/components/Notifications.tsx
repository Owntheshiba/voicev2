"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Heart, MessageCircle, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  read: boolean;
  createdAt: string;
  sender: {
    fid: string;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  voiceId?: string;
  commentId?: string;
}

interface NotificationsProps {
  currentUserFid?: string;
  className?: string;
}

export function Notifications({ currentUserFid, className }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserFid) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userFid=${currentUserFid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUserFid]);

  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!currentUserFid) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userFid: currentUserFid,
          notificationIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      if (notificationIds) {
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      } else {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  }, [currentUserFid]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "COMMENT":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "FOLLOW":
        return <Bell className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const senderName = notification.sender.displayName || notification.sender.username || `User ${notification.sender.fid}`;
    
    switch (notification.type) {
      case "LIKE":
        return `${senderName} liked your voice`;
      case "COMMENT":
        return `${senderName} commented on your voice`;
      case "FOLLOW":
        return `${senderName} started following you`;
      default:
        return "New notification";
    }
  };

  const getDisplayName = (user: Notification['sender']) => {
    return user.displayName || user.username || `User ${user.fid}`;
  };

  const getInitials = (user: Notification['sender']) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{unreadCount} unread</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsRead()}
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see notifications here when people interact with your voices</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 cursor-pointer transition-colors ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead([notification.id]);
                }
                // TODO: Navigate to voice or user profile
              }}
            >
              <div className="flex items-start gap-3">
                {/* Notification Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* User Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={notification.sender.pfpUrl} alt={getDisplayName(notification.sender)} />
                  <AvatarFallback>{getInitials(notification.sender)}</AvatarFallback>
                </Avatar>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getNotificationText(notification)}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Notifications appear when people like or comment on your voices</p>
      </div>
    </div>
  );
}
