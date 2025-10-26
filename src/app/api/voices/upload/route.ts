import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { prisma } from "~/lib/prisma";
import { POINTS } from "~/lib/constants";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const userFid = formData.get("userFid") as string;
    const duration = parseFloat(formData.get("duration") as string);
    const isAnonymous = formData.get("isAnonymous") === "true";
    const title = formData.get("title") as string || ` ${userFid}`;
    const description = formData.get("description") as string || "";
    
    // Farcaster user data
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;
    const pfpUrl = formData.get("pfpUrl") as string;

    if (!audioFile || !userFid || isNaN(duration)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file type
    if (!audioFile.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (minimum 1KB to avoid empty files)
    if (audioFile.size < 1024) {
      return NextResponse.json({ error: "File too small, minimum 1KB required" }, { status: 400 });
    }

    // Create or update user with Farcaster data
    const user = await prisma.user.upsert({
      where: { fid: BigInt(userFid) },
      update: {
        username: username || undefined,
        displayName: displayName || undefined,
        pfpUrl: pfpUrl || undefined,
      },
      create: {
        fid: BigInt(userFid),
        username: username || `user_${userFid}`,
        displayName: displayName || undefined,
        pfpUrl: pfpUrl || undefined,
      },
    });

    // Ensure UserPoints entry exists
    await prisma.userPoints.upsert({
      where: { userFid: BigInt(userFid) },
      update: {},
      create: { userFid: BigInt(userFid) },
    });

    // Convert audio file to binary data for database storage
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    
    console.log(`Converting audio file to binary data...`);
    console.log(`Upload file size: ${audioFile.size} bytes`);
    console.log(`Buffer size: ${audioBuffer.length} bytes`);
    
    // Validate file size
    if (audioBuffer.length < 1024) {
      throw new Error(`File too small: ${audioBuffer.length} bytes (minimum 1KB required)`);
    }
    
    // Get MIME type
    const mimeType = audioFile.type || 'audio/mpeg';
    console.log(`Audio MIME type: ${mimeType}`);
    
    console.log(`✅ Audio file converted to binary data successfully`);

    // Save voice record to database with binary audio data
    let voice;
    try {
      voice = await prisma.voice.create({
        data: {
          userFid: BigInt(userFid),
          audioData: audioBuffer,
          audioMimeType: mimeType,
          duration,
          title,
          description,
          isAnonymous,
        } as any,
      });
      console.log(`✅ Voice record saved to database with binary data: ${voice.id}`);
    } catch (dbError) {
      console.error(`❌ Failed to save voice record to database:`, dbError);
      throw new Error(`Failed to save voice record: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Convert BigInt to string for JSON serialization
    const voiceResponse = {
      ...voice,
      userFid: voice.userFid.toString(),
    };

    console.log(`✅ Upload completed successfully: ${voice.id} (${audioBuffer.length} bytes)`);
    return NextResponse.json({ success: true, voice: voiceResponse });
  } catch (error) {
    console.error("Failed to upload voice:", error);
    return NextResponse.json(
      { error: "Failed to upload voice" },
      { status: 500 }
    );
  }
}