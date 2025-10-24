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

    const { id: voiceId } = await params;

    // Check if voice exists
    const voice = await prisma.voice.findUnique({
      where: { id: voiceId },
    });

    if (!voice) {
      return NextResponse.json(
        { error: "Voice not found" },
        { status: 404 }
      );
    }

    // Record view (allow anonymous views)
    const viewData: any = {
      voiceId: voiceId,
    };

    if (userFid) {
      viewData.userFid = BigInt(userFid);
    } else {
      // For anonymous views, use IP address
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      viewData.ipAddress = ip;
    }

    // Check if user already viewed this voice (only for authenticated users)
    if (userFid) {
      const existingView = await prisma.voiceView.findFirst({
        where: {
          voiceId: voiceId,
          userFid: BigInt(userFid),
        },
      });

      if (existingView) {
        // User already viewed this voice, don't give points again
        return NextResponse.json({
          success: true,
          message: "View already recorded",
        });
      }
    }

    // Create view record
    await prisma.voiceView.create({
      data: viewData,
    });

    // Give points to voice owner (only for authenticated users)
    if (userFid && voice.userFid !== BigInt(userFid)) {
      await prisma.userPoints.update({
        where: { userFid: voice.userFid },
        data: {
          totalPoints: { increment: POINTS.VIEW },
          viewPoints: { increment: POINTS.VIEW },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "View recorded",
    });
  } catch (error) {
    console.error("Failed to record view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
