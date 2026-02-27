import { type NextRequest, NextResponse } from "next/server";
import { getStationById } from "@/lib/stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const station = getStationById(id);

  if (!station) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstream = await fetch(station.url, {
    headers: {
      "Icy-MetaData": "1",
      "User-Agent": "antennae.fm/2.0",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream unavailable (${upstream.status})` },
      { status: 502 },
    );
  }

  const headers = new Headers(upstream.headers);
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "audio/mpeg",
  );
  headers.set("Cache-Control", "no-store, no-transform");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
