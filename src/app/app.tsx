"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useMiniAppSdk } from "~/hooks/use-miniapp-sdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Toaster, toast } from "sonner";
// import { ShareCastButton } from "~/components/share-cast-button"; // Moved to upload success popup
import { AddMiniappButton } from "~/components/add-miniapp-button";
import { VoiceRecorder } from "~/components/VoiceRecorder";
import { VoiceFeed } from "~/components/VoiceFeed";
import { Leaderboard } from "~/components/Leaderboard";
import { Notifications } from "~/components/Notifications";
import { UserProfile } from "~/components/UserProfile";
import { VoiceCardPopup } from "~/components/VoiceCardPopup";
import { NotificationBell } from "~/components/NotificationBell";
import { VoiceChatFeed } from "~/components/VoiceChatFeed";
import { Button } from "~/components/ui/button";
import { Mic, User, Trophy, Bell } from "lucide-react";

export default function App() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { sdk, context, isMiniApp } = useMiniAppSdk();
  
  // Voice recording state
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Sheet states
  const [openProfile, setOpenProfile] = useState(false);
  const [openLeaderboard, setOpenLeaderboard] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);

  // User data state
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Voice feed state
  const [showVoiceFeed, setShowVoiceFeed] = useState(false);
  const [randomVoice, setRandomVoice] = useState<any>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [showVoicePopup, setShowVoicePopup] = useState(false);

  // Voice chat feed state
  const [voiceChatData, setVoiceChatData] = useState<any[]>([]);

  // Load user data on mount and trigger add miniapp
  useEffect(() => {
    const loadUserData = async () => {
      if (context?.user?.fid) {
        setIsLoadingUser(true);
        try {
          const response = await fetch(`/api/users/${context.user.fid}`);
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
          }
        } catch (error) {
          console.error("Failed to load user data:", error);
        } finally {
          setIsLoadingUser(false);
        }
      }
    };

    loadUserData();
    
    // Trigger add miniapp automatically
    if (isMiniApp) {
      // Add miniapp will be triggered automatically by the SDK
    }
  }, [context?.user?.fid, isMiniApp]);

  // Handle load voice chat data
  const handleLoadVoiceChatData = useCallback(async () => {
    try {
      const response = await fetch("/api/voices/random?limit=10");
      if (!response.ok) {
        throw new Error("Failed to fetch voice chat data");
      }
      const data = await response.json();
      setVoiceChatData(data.voices || []);
    } catch (error) {
      console.error("Failed to load voice chat data:", error);
      toast.error("Failed to load voice chat data");
    }
  }, []);

  // Auto-load voice chat data when connected
  useEffect(() => {
    if (isConnected) {
      handleLoadVoiceChatData();
    }
  }, [isConnected, handleLoadVoiceChatData]);

  // Handle get random voice
  const handleGetVoice = useCallback(async () => {
    setIsLoadingVoice(true);
    try {
      const response = await fetch("/api/voices/random?limit=1");
      if (response.ok) {
        const data = await response.json();
        if (data.voices && data.voices.length > 0) {
          setRandomVoice(data.voices[0]);
          setShowVoicePopup(true);
        } else {
          toast.error("No voices available");
        }
      } else {
        toast.error("Failed to get voice");
      }
    } catch (error) {
      console.error("Failed to get voice:", error);
      toast.error("Failed to get voice");
    } finally {
      setIsLoadingVoice(false);
    }
  }, []);

  // Handle voice upload
  const handleVoiceUpload = useCallback(async (audioBlob: Blob, duration: number, isAnonymous: boolean = false) => {
    if (!context?.user?.fid) {
      toast.error("Please connect your Farcaster account");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice.mp3");
      formData.append("userFid", context.user.fid.toString());
      formData.append("duration", duration.toString());
      formData.append("isAnonymous", isAnonymous.toString());
      formData.append("title", ` ${context.user.displayName || context.user.username || "User"}`);
      formData.append("description", "");
      
      // Add Farcaster user data
      if (context.user.username) formData.append("username", context.user.username);
      if (context.user.displayName) formData.append("displayName", context.user.displayName);
      if (context.user.pfpUrl) formData.append("pfpUrl", context.user.pfpUrl);

      const response = await fetch("/api/voices/upload", {
          method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload voice");
      }

      const result = await response.json();
      setShowVoiceRecorder(false);
      setShowUploadSuccess(true);
      
      return result;
    } catch (error: any) {
      console.error("Upload error:", error);
      // Show error in popup instead of toast
      setShowUploadSuccess(false);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [context?.user, sdk?.actions]);

  // Handle share voice
  const handleShareVoice = useCallback(async () => {
    if (sdk?.actions?.composeCast) {
      try {
        const result = await sdk.actions.composeCast({
          text: `Just shared my voice on Voice Social! 🎤\n\nListen to my voice and join the conversation!`,
          embeds: [`${window.location.origin}`]
        });
        
        if (result?.cast) {
          console.log('Cast posted:', result.cast.hash);
        }
      } catch (error) {
        console.error('Failed to compose cast:', error);
      }
    }
    setShowUploadSuccess(false);
  }, [sdk?.actions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-800">Voice Social</h1>
            </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            {isConnected && (
              <NotificationBell
                onClick={() => setOpenNotifications(true)}
                currentUserFid={context?.user?.fid?.toString()}
              />
            )}
            
            {isMiniApp && (
              <>
                {/* Share button moved to upload success popup */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {!isConnected ? (
          <div className="text-center space-y-6 py-12">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Mic className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Voice Social</h2>
              <p className="text-blue-100 mb-6">Connect your wallet to start sharing your voice</p>
            </div>
            <Button
              onClick={() => connect({ connector: connectors[0] })}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-semibold"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Get Voice Button - No Card */}
            <div className="text-center">
              <Button
                onClick={handleGetVoice}
                disabled={isLoadingVoice}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-semibold"
              >
                {isLoadingVoice ? "Loading..." : "Get Voice"}
              </Button>
            </div>

            {/* Voice Chat Feed - Auto display */}
            {voiceChatData.length > 0 && (
              <div className="mt-8">
                <VoiceChatFeed voices={voiceChatData} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {isConnected && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-500/90 backdrop-blur-md border-t border-blue-300">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-around gap-2">
              <Button
                onClick={() => setOpenLeaderboard(true)}
                variant="ghost"
                className="flex flex-col items-center gap-1 px-3 py-2 text-white hover:bg-blue-400/20"
              >
                <Trophy className="h-5 w-5" />
                <span className="text-xs">Leaderboard</span>
              </Button>
              
              <Button
                onClick={() => setShowVoiceRecorder(true)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
              >
                <Mic className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={() => setOpenProfile(true)}
                variant="ghost"
                className="flex flex-col items-center gap-1 px-3 py-2 text-white hover:bg-blue-400/20"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </Button>
      </div>
    </div>
        </div>
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onUpload={handleVoiceUpload}
          onCancel={() => setShowVoiceRecorder(false)}
          isUploading={isUploading}
        />
      )}

      {/* Profile Sheet */}
      <Sheet open={openProfile} onOpenChange={setOpenProfile}>
        <SheetContent side="bottom" className="border-t border-blue-200 h-screen overflow-y-auto bg-gradient-to-b from-green-50 to-emerald-50 pt-6 pb-8">
          <SheetHeader>
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription>Your voice social profile</SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-4">
            <UserProfile userFid={context?.user?.fid?.toString()} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Leaderboard Sheet */}
      <Sheet open={openLeaderboard} onOpenChange={setOpenLeaderboard}>
        <SheetContent side="bottom" className="border-t border-blue-200 h-screen overflow-y-auto bg-gradient-to-b from-green-50 to-emerald-50 pt-6 pb-8">
          <SheetHeader>
            <SheetTitle>Leaderboard</SheetTitle>
            <SheetDescription>Top voice creators</SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-4">
            <Leaderboard />
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={openNotifications} onOpenChange={setOpenNotifications}>
        <SheetContent side="bottom" className="border-t border-blue-200 h-screen overflow-y-auto bg-gradient-to-b from-green-50 to-emerald-50 pt-6 pb-8">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Your activity updates</SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-4">
            <Notifications currentUserFid={context?.user?.fid?.toString()} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Voice Card Popup */}
      {randomVoice && (
        <VoiceCardPopup
          voice={randomVoice}
          currentUserFid={context?.user?.fid?.toString()}
          isOpen={showVoicePopup}
          onClose={() => setShowVoicePopup(false)}
        onLike={(voiceId) => {
          // Handle like
          console.log("Like voice:", voiceId);
        }}
        onComment={(voiceId) => {
          // Handle comment
          console.log("Comment on voice:", voiceId);
        }}
        onShare={(voiceId) => {
          // Handle share
          console.log("Share voice:", voiceId);
        }}
        onView={async (voiceId) => {
          // Handle view
          try {
            await fetch(`/api/voices/${voiceId}/view`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userFid: context?.user?.fid?.toString() }),
            });
          } catch (error) {
            console.error('Failed to record view:', error);
          }
        }}
        />
      )}

      {/* Upload Success Popup */}
      {showUploadSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Uploaded!</h3>
              <p className="text-gray-600 mb-6">Your voice has been successfully uploaded to Voice Social.</p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadSuccess(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleShareVoice}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Share
                </Button>
          </div>
      </div>
          </div>
        </div>
      )}

    </div>
  );
}
