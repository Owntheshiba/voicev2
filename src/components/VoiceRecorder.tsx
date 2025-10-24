"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Mic, MicOff, Upload, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { MAX_RECORDING_DURATION } from "~/lib/constants";
import { useMiniAppSdk } from "~/hooks/use-miniapp-sdk";

interface VoiceRecorderProps {
  onUpload: (audioBlob: Blob, duration: number, isAnonymous?: boolean) => Promise<void>;
  onCancel: () => void;
  isUploading?: boolean;
}

export function VoiceRecorder({ onUpload, onCancel, isUploading = false }: VoiceRecorderProps) {
  const { sdk, context } = useMiniAppSdk();
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    startRecording,
    stopRecording,
    mediaBlobUrl,
    status,
  } = useReactMediaRecorder({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
    onStop: (blobUrl: string, blob: Blob) => {
      setAudioBlob(blob);
      setShowUpload(true);
      setIsRecording(false);
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    },
  });

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (context?.features?.cameraAndMicrophoneAccess) {
        setHasPermission(true);
      }
    };
    checkPermission();
  }, [context?.features?.cameraAndMicrophoneAccess]);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    if (!sdk?.actions?.requestCameraAndMicrophoneAccess) {
      toast.error("Microphone access not supported in this environment");
      return false;
    }

    setRequestingPermission(true);
    try {
      await sdk.actions.requestCameraAndMicrophoneAccess();
      setHasPermission(true);
      toast.success("Microphone access granted!");
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast.error("Microphone access is required to record voice");
      return false;
    } finally {
      setRequestingPermission(false);
    }
  }, [sdk?.actions]);

  const startRecordingHandler = useCallback(async () => {
    // Check permission first
    if (!hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      startRecording();
      setIsRecording(true);
      setDuration(0);
      setShowUpload(false);
      setAudioBlob(null);
      
      // Start duration timer
      durationRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_RECORDING_DURATION) {
            stopRecording();
            return MAX_RECORDING_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
      
      toast.success("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to start recording");
    }
  }, [hasPermission, requestMicrophonePermission, startRecording, stopRecording]);

  const stopRecordingHandler = useCallback(() => {
    try {
      stopRecording();
      setIsRecording(false);
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
      toast.success("Recording stopped");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Failed to stop recording");
    }
  }, [stopRecording]);

  const cancelRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setDuration(0);
    setIsRecording(false);
    setShowUpload(false);
    setAudioBlob(null);
    if (durationRef.current) {
      clearInterval(durationRef.current);
    }
    onCancel();
  }, [isRecording, stopRecording, onCancel]);

  const handleUpload = useCallback(async () => {
    if (!audioBlob) {
      toast.error("No audio to upload");
      return;
    }
    
    try {
      await onUpload(audioBlob, duration, isAnonymous);
      toast.success("Voice uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload voice");
    }
  }, [audioBlob, duration, isAnonymous, onUpload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (duration / MAX_RECORDING_DURATION) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Record Voice</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!showUpload ? (
          <div className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="mb-4">
                {isRecording ? (
                  <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                ) : (
                  <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <MicOff className="h-8 w-8 text-gray-600" />
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {isRecording ? "Recording..." : "Ready to record"}
              </p>
              
              <p className="text-2xl font-mono font-bold">
                {formatDuration(duration)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                Max duration: {MAX_RECORDING_DURATION} seconds
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
              {!hasPermission && !requestingPermission ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Microphone access is required to record voice
                  </p>
                  <Button
                    onClick={requestMicrophonePermission}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Grant Microphone Access
                  </Button>
                </div>
              ) : requestingPermission ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Requesting microphone permission...
                  </p>
                </div>
              ) : !isRecording ? (
                <Button
                  onClick={startRecordingHandler}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={status === "recording"}
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecordingHandler}
                  size="lg"
                  variant="outline"
                  disabled={status !== "recording"}
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Audio Preview */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Recording complete! Duration: {formatDuration(duration)}
              </p>
              
              {mediaBlobUrl && (
                <audio
                  ref={audioRef}
                  src={mediaBlobUrl}
                  controls
                  className="w-full"
                />
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                {isAnonymous ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <Label htmlFor="anonymous-toggle" className="text-sm font-medium">
                    Upload Anonymously
                  </Label>
                  <p className="text-xs text-gray-500">
                    {isAnonymous 
                      ? "Your voice will appear as anonymous to others" 
                      : "Your voice will show your profile information"
                    }
                  </p>
                </div>
              </div>
              <Switch
                id="anonymous-toggle"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={isUploading}
              />
            </div>

            {/* Upload Controls */}
            <div className="flex gap-3">
              <Button
                onClick={cancelRecording}
                variant="outline"
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Voice
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
