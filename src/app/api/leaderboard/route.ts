import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "all";
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = {};
    let orderBy = { totalPoints: "desc" as const };

    // Filter by timeframe
    if (timeframe === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      whereClause = {
        user: {
          voices: {
            some: {
              createdAt: {
                gte: weekAgo,
              },
            },
          },
        },
      };
    } else if (timeframe === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      whereClause = {
        user: {
          voices: {
            some: {
              createdAt: {
                gte: monthAgo,
              },
            },
          },
        },
      };
    }

    // Get leaderboard
    const leaderboard = await prisma.userPoints.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fid: true,
            username: true,
            displayName: true,
            pfpUrl: true,
            voices: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy,
      take: limit,
    });

    // Transform data to include voice count and convert BigInt to string
    const transformedLeaderboard = leaderboard.map((item: any, index: number) => ({
      rank: index + 1,
      user: {
        fid: item.user.fid.toString(),
        username: item.user.username,
        displayName: item.user.displayName,
        pfpUrl: item.user.pfpUrl,
      },
      totalPoints: item.totalPoints,
      viewPoints: item.viewPoints,
      likePoints: item.likePoints,
      commentPoints: item.commentPoints,
      voicesCount: item.user.voices.length,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: transformedLeaderboard,
      timeframe,
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
