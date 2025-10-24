import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid: userFid } = await params;

    if (!userFid) {
      return NextResponse.json(
        { error: "User FID is required" },
        { status: 400 }
      );
    }

    // Get user profile with stats
    const user = await prisma.user.findUnique({
      where: { fid: BigInt(userFid) },
      include: {
        userPoints: true,
        voices: {
          include: {
            likes: true,
            comments: true,
            views: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            voices: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate additional stats
    const totalViews = user.voices.reduce((sum: number, voice: any) => sum + voice.views.length, 0);
    const totalLikes = user.voices.reduce((sum: number, voice: any) => sum + voice.likes.length, 0);
    const totalComments = user.voices.reduce((sum: number, voice: any) => sum + voice.comments.length, 0);

    // Get user's ranking
    const userRank = await prisma.userPoints.count({
      where: {
        totalPoints: {
          gt: user.userPoints?.totalPoints || 0,
        },
      },
    }) + 1;

    // Convert BigInt to string for JSON serialization
    // @ts-ignore - TypeScript inference issues with Prisma relations
    const transformedVoices = user.voices.map((voice: any) => ({
      ...voice,
      userFid: voice.userFid.toString(),
      likes: voice.likes.map((like: any) => ({
        ...like,
        userFid: like.userFid.toString(),
      })),
      comments: voice.comments.map((comment: any) => ({
        ...comment,
        userFid: comment.userFid.toString(),
      })),
      views: voice.views.map((view: any) => ({
        ...view,
        userFid: view.userFid?.toString() || null,
      })),
    }));

    return NextResponse.json({
      success: true,
      user: {
        fid: user.fid.toString(),
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        stats: {
          totalVoices: user._count.voices,
          totalViews,
          totalLikes,
          totalComments,
          totalPoints: user.userPoints?.totalPoints || 0,
          viewPoints: user.userPoints?.viewPoints || 0,
          likePoints: user.userPoints?.likePoints || 0,
          commentPoints: user.userPoints?.commentPoints || 0,
          rank: userRank,
        },
        voices: transformedVoices,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
