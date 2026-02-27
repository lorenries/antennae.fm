import { NextResponse } from "next/server";
import { stations } from "@/lib/stations";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    streams: stations.map((station) => ({
      id: station.id,
      name: station.name,
      url:
        station.useProxy === false ? station.url : `/api/stream/${station.id}`,
    })),
  });
}
