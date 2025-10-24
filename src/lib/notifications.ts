import { dbPool } from "./db";

export async function sendFarcasterNotification(
  fid: number, 
  title: string, 
  message: string, 
  notificationType: string = "welcome"
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid,
        title,
        message,
        notificationType
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending Farcaster notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Helper to send welcome notification when user adds mini app
export async function notifyWelcomeToVoiceSocial(fid: number, username: string) {
  const title = "🎤 Welcome to Voice Social!";
  const message = `Welcome ${username}! Start sharing your voice and connect with others! 🎵`;
  
  return await sendFarcasterNotification(fid, title, message, "welcome");
}
