import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userFid = searchParams.get("userFid");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!userFid) {
      return NextResponse.json(
        { error: "User FID is required" },
        { status: 400 }
      );
    }

    // If only unread count is requested
    if (unreadOnly) {
      const unreadCount = await prisma.notification.count({
        where: {
          recipientFid: BigInt(userFid),
          read: false,
        },
      });

      return NextResponse.json({
        success: true,
        count: unreadCount,
      });
    }

    // Get notifications for user
    const notifications = await prisma.notification.findMany({
      where: { recipientFid: BigInt(userFid) },
      include: {
        sender: {
          select: {
            fid: true,
            username: true,
            displayName: true,
            pfpUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent notifications
    });

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        recipientFid: BigInt(userFid),
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userFid, notificationIds } = body;

    if (!userFid) {
      return NextResponse.json(
        { error: "User FID is required" },
        { status: 400 }
      );
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          recipientFid: BigInt(userFid),
        },
        data: { read: true },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          recipientFid: BigInt(userFid),
          read: false,
        },
        data: { read: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
