import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { POINTS } from "~/lib/constants";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { userFid } = body;

    if (!userFid) {
      return NextResponse.json(
        { error: "User FID is required" },
        { status: 400 }
      );
    }

    const { id: voiceId } = await params;

    // Ensure user exists in database before creating like
    await prisma.user.upsert({
      where: { fid: BigInt(userFid) },
      update: {},
      create: {
        fid: BigInt(userFid),
        username: `user_${userFid}`,
      },
    });

    // Ensure UserPoints entry exists
    await prisma.userPoints.upsert({
      where: { userFid: BigInt(userFid) },
      update: {},
      create: { userFid: BigInt(userFid) },
    });

    // Check if voice exists
    const voice = await prisma.voice.findUnique({
      where: { id: voiceId },
      include: { user: true },
    });

    if (!voice) {
      return NextResponse.json(
        { error: "Voice not found" },
        { status: 404 }
      );
    }

    // Check if user already liked this voice
    const existingLike = await prisma.voiceLike.findUnique({
      where: {
        userFid_voiceId: {
          userFid: BigInt(userFid),
          voiceId: voiceId,
        },
      },
    });

    let isLiked = false;
    let likeCount = 0;

    if (existingLike) {
      // Unlike the voice
      await prisma.voiceLike.delete({
        where: {
          userFid_voiceId: {
            userFid: BigInt(userFid),
            voiceId: voiceId,
          },
        },
      });

      // Decrease points for voice owner
      await prisma.userPoints.update({
        where: { userFid: voice.userFid },
        data: {
          totalPoints: { decrement: POINTS.LIKE },
          likePoints: { decrement: POINTS.LIKE },
        },
      });

      isLiked = false;
    } else {
      // Like the voice
      await prisma.voiceLike.create({
        data: {
          userFid: BigInt(userFid),
          voiceId: voiceId,
        },
      });

      // Increase points for voice owner
      await prisma.userPoints.update({
        where: { userFid: voice.userFid },
        data: {
          totalPoints: { increment: POINTS.LIKE },
          likePoints: { increment: POINTS.LIKE },
        },
      });

      // Create notification for voice owner (if not liking own voice)
      if (voice.userFid !== BigInt(userFid)) {
        await prisma.notification.create({
          data: {
            recipientFid: voice.userFid,
            senderFid: BigInt(userFid),
            type: "LIKE",
            voiceId: voiceId,
          },
        });
      }

      isLiked = true;
    }

    // Get updated like count
    likeCount = await prisma.voiceLike.count({
      where: { voiceId: voiceId },
    });

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
