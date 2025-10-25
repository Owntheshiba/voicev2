import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    // Get random voices with user data, likes, comments, and views
    const voices = await prisma.voice.findMany({
      skip: offset,
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
        page,
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
