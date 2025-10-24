export const PROJECT_TITLE = "Voice Social";
export const PROJECT_DESCRIPTION = "🎤 Share your voice, connect with others!";
export const PROJECT_CREATOR = "aushar";
export const PROJECT_AVATAR_URL =
  "https://ipfs.io/ipfs/bafybeiebt7gl5qqhajfzysftz4dnhnvpexvwfmai2faw2e3li7r5hdgnhq";

// Voice App Constants
export const MAX_RECORDING_DURATION = 60; // seconds
export const AUDIO_FORMAT = "audio/mp3";
export const AUDIO_SAMPLE_RATE = 16000; // Hz

// Point System
export const POINTS = {
  VIEW: 1,
  LIKE: 5,
  COMMENT: 10,
} as const;

// Optional: Pusher Configuration (bisa dihapus jika tidak digunakan)
export const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
export const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
export const PUSHER_SECRET = process.env.PUSHER_SECRET;
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1";
