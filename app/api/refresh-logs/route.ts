import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { rotateNow } = await import("@/lib/dql/log-rotator");
    const bucketId = rotateNow();
    return NextResponse.json({ ok: true, bucketId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Rotation failed";
    console.error("[api/refresh-logs] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
