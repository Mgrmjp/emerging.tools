import { NextResponse } from "next/server";
import { createSnapshot, writeSnapshot } from "@/lib/snapshots";

export const dynamic = "force-dynamic";

async function dispatchGitHubWorkflow() {
  const token = process.env.GITHUB_TOKEN;
  const repository =
    process.env.SYNC_GITHUB_REPOSITORY ?? process.env.GITHUB_REPOSITORY;
  const workflow = process.env.SYNC_GITHUB_WORKFLOW ?? "weekly-sync.yml";
  const ref = process.env.SYNC_GITHUB_REF ?? "main";

  if (!token || !repository) {
    throw new Error(
      "Missing GITHUB_TOKEN or SYNC_GITHUB_REPOSITORY for hosted sync dispatch"
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref,
        inputs: {
          force: "true",
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub workflow dispatch failed: ${response.status} ${details}`);
  }

  return { repository, workflow, ref };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.SYNC_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (process.env.VERCEL === "1") {
      const dispatch = await dispatchGitHubWorkflow();
      return NextResponse.json({
        success: true,
        mode: "github-actions",
        repository: dispatch.repository,
        workflow: dispatch.workflow,
        ref: dispatch.ref,
      });
    }

    const { fetchTrendingThemes } = await import("@/lib/marketplace");
    const themes = await fetchTrendingThemes(100);
    const snapshot = createSnapshot(themes);
    const { filePath } = await writeSnapshot(snapshot);

    return NextResponse.json({
      success: true,
      mode: "local-filesystem",
      count: themes.length,
      file: filePath,
      date: snapshot.date,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
