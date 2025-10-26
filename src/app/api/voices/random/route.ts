import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const userFid = searchParams.get("userFid"); // Get user FID for 24h cooldown

    // If userFid provided, get voices not shown to this user in last 24 hours
    let whereClause: any = {};
    
    if (userFid) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get voice IDs that were shown to this user in last 24 hours
      const recentVoiceHistory = await prisma.voiceHistory.findMany({
        where: {
          userFid: BigInt(userFid),
          createdAt: {
            gte: twentyFourHoursAgo
          }
        },
        select: {
          voiceId: true
        }
      });
      
      const recentVoiceIds = recentVoiceHistory.map(h => h.voiceId);
      
      // Exclude voices shown in last 24 hours
      if (recentVoiceIds.length > 0) {
        whereClause.id = {
          notIn: recentVoiceIds
        };
      }
    }

    // Get random voices with user data, likes, comments, and views
    const voices = await prisma.voice.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        createdAt: "desc", // For now, use chronological order. Can be changed to random later
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
        likes: {
          select: {
            userFid: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        views: {
          select: {
            id: true,
          },
        },
      },
    });

    // Record voice history for 24h cooldown (only if userFid provided)
    if (userFid && voices.length > 0) {
      try {
        await prisma.voiceHistory.createMany({
          data: voices.map(voice => ({
            userFid: BigInt(userFid),
            voiceId: voice.id,
          })),
        });
      } catch (error) {
        console.error("Failed to record voice history:", error);
        // Don't fail the request if history recording fails
      }
    }

    // Convert BigInt to string for JSON serialization
    const transformedVoices = voices.map((voice: any) => ({
      ...voice,
      userFid: voice.userFid.toString(),
      user: {
        ...voice.user,
        fid: voice.user.fid.toString(),
      },
      likes: voice.likes.map((like: any) => ({
        userFid: like.userFid.toString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      voices: transformedVoices,
      pagination: {
        limit,
        hasMore: voices.length === limit,
      },
    });
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
