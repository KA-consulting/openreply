import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

// Quote a CSV cell, and neutralise spreadsheet formulas: a username or email
// that starts with = + - @ would otherwise run as a formula when opened.
function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * GET /api/automations/emails?id=<campaignId>[&format=csv]
 * Emails collected by an email-gated campaign: JSON by default, a CSV download
 * with format=csv. Only people who actually sent an address are listed.
 */
export async function GET(request: NextRequest) {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const automationId = request.nextUrl.searchParams.get("id");
  if (!automationId) {
    return NextResponse.json(
      { success: false, error: "Missing campaign ID" },
      { status: 400 }
    );
  }

  const automation = await prisma.automation.findFirst({
    where: { id: automationId, workspaceId },
    select: { id: true, name: true },
  });
  if (!automation) {
    return NextResponse.json(
      { success: false, error: "Campaign not found" },
      { status: 404 }
    );
  }

  const captures = await prisma.emailCapture.findMany({
    where: { automationId, workspaceId, email: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      email: true,
      username: true,
      userId: true,
      status: true,
      promptedAt: true,
      capturedAt: true,
    },
  });

  if (request.nextUrl.searchParams.get("format") === "csv") {
    const lines = [
      "email,instagram_username,instagram_user_id,status,asked_at,link_sent_at",
      ...captures.map((c) =>
        [
          csvCell(c.email),
          csvCell(c.username),
          csvCell(c.userId),
          csvCell(c.status),
          csvCell(c.promptedAt.toISOString()),
          csvCell(c.capturedAt?.toISOString() ?? ""),
        ].join(",")
      ),
    ];
    const filename = `emails-${automation.id}.csv`;
    return new NextResponse(lines.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    { success: true, data: captures },
    { headers: { "Cache-Control": "no-store" } }
  );
}
