import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, username, displayName, pfpUrl, bio } = body;

    if (!fid) {
      return NextResponse.json(
        { error: "User FID is required" },
        { status: 400 }
      );
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { fid: BigInt(fid) },
      update: {
        username: username || undefined,
        displayName: displayName || undefined,
        pfpUrl: pfpUrl || undefined,
        bio: bio || undefined,
      },
      create: {
        fid: BigInt(fid),
        username: username || `user_${fid}`,
        displayName: displayName || undefined,
        pfpUrl: pfpUrl || undefined,
        bio: bio || undefined,
      },
    });

    // Ensure UserPoints entry exists
    await prisma.userPoints.upsert({
      where: { userFid: BigInt(fid) },
      update: {},
      create: { userFid: BigInt(fid) },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        fid: user.fid.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to save user:", error);
    return NextResponse.json(
      { error: "Failed to save user" },
      { status: 500 }
    );
  }
}
