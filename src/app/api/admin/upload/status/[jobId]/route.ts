import { NextRequest, NextResponse } from "next/server";
import { getUploadJob } from "@/lib/jobs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;
  const job = getUploadJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Upload job not found." }, { status: 404 });
  }
  return NextResponse.json({ job });
}
