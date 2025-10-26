import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const voiceId = params.id;

    if (!voiceId) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
    }

    // Get voice with audio data from database
    const voice = await prisma.voice.findUnique({
      where: { id: voiceId },
      select: {
        id: true,
        audioData: true,
        audioMimeType: true,
        audioUrl: true, // For backward compatibility
      },
    });

    if (!voice) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    // Check if we have binary audio data
    if (voice.audioData) {
      // Serve binary audio data
      const audioBuffer = Buffer.from(voice.audioData);
      const mimeType = voice.audioMimeType || 'audio/mpeg';
      
      console.log(`Serving audio from database: ${voiceId} (${audioBuffer.length} bytes, ${mimeType})`);
      
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          'Accept-Ranges': 'bytes',
        },
      });
    } else if (voice.audioUrl) {
      // Fallback to file system (backward compatibility)
      console.log(`Voice ${voiceId} has no binary data, falling back to file system`);
      return NextResponse.json({ 
        error: "Audio file not found in database, please re-upload",
        fallbackUrl: voice.audioUrl 
      }, { status: 404 });
    } else {
      return NextResponse.json({ error: "No audio data available" }, { status: 404 });
    }

  } catch (error) {
    console.error("Failed to serve audio:", error);
    return NextResponse.json(
      { error: "Failed to serve audio" },
      { status: 500 }
    );
  }
}
