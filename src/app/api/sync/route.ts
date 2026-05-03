import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.SYNC_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fetchTrendingThemes } = await import("@/lib/marketplace");
    const themes = await fetchTrendingThemes(100);

    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const snapshot = {
      date: dateStr,
      themes,
      generatedAt: new Date().toISOString(),
    };

    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, `weekly-${dateStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));

    const latestPath = path.join(dir, "latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));

    return NextResponse.json({
      success: true,
      count: themes.length,
      file: filePath,
      date: dateStr,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}