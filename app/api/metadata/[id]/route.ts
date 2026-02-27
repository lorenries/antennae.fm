import { type NextRequest, NextResponse } from "next/server";
import { type Metadata, radioService } from "@/lib/radio";
import { getStationById } from "@/lib/stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSse(payload: Metadata) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  radioService.start();

  const { id } = await params;
  if (!getStationById(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = radioService.subscribe(id, (metadata) => {
        controller.enqueue(encoder.encode(toSse(metadata)));
      });

      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25_000);

      const close = () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      };

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      // No-op: cleanup is handled by request abort.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
