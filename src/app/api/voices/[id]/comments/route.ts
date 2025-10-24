import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { POINTS } from "~/lib/constants";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: voiceId } = await params;

    // Get comments for a voice
    const comments = await prisma.voiceComment.findMany({
      where: { voiceId },
      include: {
        user: {
          select: {
            fid: true,
            username: true,
            displayName: true,
            pfpUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Convert BigInt to string for JSON serialization
    const transformedComments = comments.map((comment: any) => ({
      ...comment,
      userFid: comment.userFid.toString(),
      user: {
        ...comment.user,
        fid: comment.user.fid.toString(),
      },
    }));

    return NextResponse.json({
      success: true,
      comments: transformedComments,
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { userFid, content, audioUrl, type = "TEXT" } = body;

    if (!userFid) {
      return NextResponse.json(
        { error: "User FID is required" },
        { status: 400 }
      );
    }

    const { id: voiceId } = await params;

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

    // Validate comment content
    if (type === "TEXT" && !content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (type === "VOICE" && !audioUrl) {
      return NextResponse.json(
        { error: "Audio URL is required for voice comments" },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.voiceComment.create({
      data: {
        userFid: BigInt(userFid),
        voiceId: voiceId,
        content: content || "",
        type: type === "VOICE" ? "audioUrl" : "text",
      },
      include: {
        user: {
          select: {
            fid: true,
            username: true,
            displayName: true,
            pfpUrl: true,
          },
        },
      },
    });

    // Give points to voice owner (if not commenting on own voice)
    if (voice.userFid !== BigInt(userFid)) {
      await prisma.userPoints.update({
        where: { userFid: voice.userFid },
        data: {
          totalPoints: { increment: POINTS.COMMENT },
          commentPoints: { increment: POINTS.COMMENT },
        },
      });

      // Create notification for voice owner
      await prisma.notification.create({
        data: {
          recipientFid: voice.userFid,
          senderFid: BigInt(userFid),
          type: "comment",
          voiceId: voiceId,
        },
      });
    }

    // Convert BigInt to string for JSON serialization
    const transformedComment = {
      ...comment,
      userFid: comment.userFid.toString(),
      user: {
        ...comment.user,
        fid: comment.user.fid.toString(),
      },
    };

    return NextResponse.json({
      success: true,
      comment: transformedComment,
    });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
