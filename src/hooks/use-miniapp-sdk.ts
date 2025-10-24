"use client";

import { useCallback, useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { Context } from "@farcaster/miniapp-core";

export function useMiniAppSdk() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [isMiniAppSaved, setIsMiniAppSaved] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [pinFrameResponse, setPinFrameResponse] = useState("");
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (!sdk) return;

    sdk.on("miniAppAdded", async ({ notificationDetails }) => {
      setLastEvent(
        `miniAppAdded${notificationDetails ? ", notifications enabled" : ""}`,
      );
      setIsMiniAppSaved(true);
      
      // Auto-save notification token + send welcome notification
      if (notificationDetails?.token && context?.user?.fid) {
        try {
          // Save token to database
          await fetch('/api/notifications/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: context.user.fid,
              token: notificationDetails.token,
              url: notificationDetails.url
            })
          });
          
          // Send welcome notification
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: context.user.fid,
              title: "🎤 Welcome to Voice Social!",
              message: `Welcome ${context.user.username || 'User'}! Start sharing your voice and connect with others! 🎵`,
              notificationType: "welcome"
            })
          });
          
          console.log("Welcome notification sent to new user");
        } catch (error) {
          console.error("Failed to save token or send welcome notification:", error);
        }
      }
    });

    sdk.on("miniAppAddRejected", ({ reason }) => {
      setLastEvent(`miniAppAddRejected, reason ${reason}`);
    });

    sdk.on("miniAppRemoved", () => {
      setLastEvent("miniAppRemoved");
      setIsMiniAppSaved(false);
    });

    sdk.on("notificationsEnabled", async ({ notificationDetails }) => {
      setLastEvent("notificationsEnabled");
      
              // Auto-save notification token to database (for future use)
      if (notificationDetails?.token && context?.user?.fid) {
        try {
          await fetch('/api/notifications/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: context.user.fid,
              token: notificationDetails.token,
              url: notificationDetails.url
            })
          });
          console.log("Notification token saved to database");
        } catch (error) {
          console.error("Failed to save notification token:", error);
        }
      }
    });

    sdk.on("notificationsDisabled", () => {
      setLastEvent("notificationsDisabled");
    });

    // CRITICAL TO LOAD MINI APP - DON'T REMOVE
    sdk.actions.ready({});
    setIsSDKLoaded(true);

    // Clean up on unmount
    return () => {
      sdk.removeAllListeners();
    };
  }, [context?.user?.fid, context?.user?.username]);

  useEffect(() => {
    const updateContext = async () => {
      // Check if in MiniApp first (faster detection)
      const miniAppStatus = await sdk.isInMiniApp();
      setIsMiniApp(miniAppStatus);
      
      // Then load context
      const frameContext = await sdk.context;
      if (frameContext) {
        setContext(frameContext);
        setIsMiniAppSaved(frameContext.client.added);
      }
    };

    if (isSDKLoaded) {
      updateContext();
    }
  }, [isSDKLoaded]);

  const pinFrame = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp();
      // @ts-expect-error - result type mixup
      if (result.added) {
        setPinFrameResponse(
          result.notificationDetails
            ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
            : "Added, got no notification details",
        );
      }
    } catch (error) {
      setPinFrameResponse(`Error: ${error}`);
    }
  }, []);

  return {
    context,
    pinFrame,
    pinFrameResponse,
    isMiniAppSaved,
    lastEvent,
    sdk,
    isSDKLoaded,
    isAuthDialogOpen,
    setIsAuthDialogOpen,
    isMiniApp,
  };
}
