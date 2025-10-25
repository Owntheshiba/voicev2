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

    // Save file to local storage (Railway volume)
    const fileName = `${userFid}_${Date.now()}.mp3`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'voices');
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, fileName);
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Attempting to save audio file to: ${filePath}`);
    console.log(`Upload file size: ${audioFile.size} bytes`);
    console.log(`Buffer size: ${buffer.length} bytes`);
    
    try {
      await writeFile(filePath, buffer);
      console.log(`✅ File written successfully`);
    } catch (writeError) {
      console.error(`❌ Failed to write file:`, writeError);
      const message = writeError instanceof Error 
        ? `Failed to write audio file: ${writeError.message}`
        : "Failed to write audio file";
      throw new Error(message);
    }
    
    // Verify file was created
    if (!existsSync(filePath)) {
      throw new Error(`Failed to save audio file: ${filePath}`);
    }
    
    // Verify file size matches uploaded file
    const savedFileSize = require('fs').statSync(filePath).size;
    console.log(`Saved file size: ${savedFileSize} bytes`);
    
    if (savedFileSize !== buffer.length) {
      throw new Error(`File size mismatch: expected ${buffer.length}, got ${savedFileSize}`);
    }
    
    // Additional validation for minimum file size
    if (savedFileSize < 1024) {
      // Delete the invalid file
      require('fs').unlinkSync(filePath);
      throw new Error(`Saved file too small: ${savedFileSize} bytes`);
    }
    
    console.log(`✅ Audio file saved successfully: ${fileName}`);

    // Create public URL
    const audioUrl = `/uploads/voices/${fileName}`;

    // Save voice record to database
    const voice = await prisma.voice.create({
      data: {
        userFid: BigInt(userFid),
        audioUrl,
        duration,
        title,
        description,
        isAnonymous,
      } as any,
    });

    // Convert BigInt to string for JSON serialization
    const voiceResponse = {
      ...voice,
      userFid: voice.userFid.toString(),
    };

    return NextResponse.json({ success: true, voice: voiceResponse });
  } catch (error) {
    console.error("Failed to upload voice:", error);
    return NextResponse.json(
      { error: "Failed to upload voice" },
      { status: 500 }
    );
  }
}