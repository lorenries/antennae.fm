"use client";

import { ExternalLink, Loader2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudio } from "@/hooks/useAudio";

type Stream = {
  id: string;
  name: string;
  url: string;
};

type TrackMetadata = {
  id: string;
  available: boolean;
  title: string | null;
  artist: string | null;
  raw: string | null;
  source: "icy" | "none";
  updatedAt: string;
};

function useTrackMetadata(id?: string) {
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);

  useEffect(() => {
    if (!id) {
      setMetadata(null);
      return;
    }

    const source = new EventSource(`/api/metadata/${id}`);

    source.onmessage = (event) => {
      try {
        setMetadata(JSON.parse(event.data) as TrackMetadata);
      } catch {
        // Keep previous metadata on malformed events.
      }
    };

    return () => {
      source.close();
    };
  }, [id]);

  return metadata;
}

function StreamCard({
  stream,
  activeStream,
  activeMetadata,
  onSelect,
}: {
  stream: Stream;
  activeStream?: Stream;
  activeMetadata: TrackMetadata | null;
  onSelect: (next: Stream) => void;
}) {
  const isActive = activeStream?.id === stream.id;
  const summary = [activeMetadata?.title, activeMetadata?.artist]
    .filter(Boolean)
    .join(" - ");

  return (
    <button
      type="button"
      onClick={() => onSelect(stream)}
      className={`flex min-h-32 flex-col justify-between rounded border p-4 text-left shadow-lg transition-colors md:min-h-40 ${
        isActive
          ? "border-[var(--accent)] text-[var(--accent)]"
          : "border-[var(--line)] text-[var(--text)]"
      } bg-[var(--surface)] hover:bg-[#202a38]`}
    >
      <span className="text-base font-bold">{stream.name}</span>
      <span className="line-clamp-2 text-xs text-[var(--muted)]">
        {isActive && summary ? summary : stream.id}
      </span>
    </button>
  );
}

function Player({
  stream,
  metadata,
}: {
  stream: Stream;
  metadata: TrackMetadata | null;
}) {
  const { ref, play, pause, isPlaying, isLoading } = useAudio(stream.url);
  const trackLabel =
    [metadata?.title, metadata?.artist].filter(Boolean).join(" - ") ||
    stream.name;
  const canOpenSpotify = Boolean(metadata?.title && metadata?.artist);

  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={isPlaying ? pause : play}
          className="flex size-10 items-center justify-center rounded border border-[var(--accent)] text-[var(--accent)]"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5" />
          )}
        </button>
        <p className="line-clamp-1 flex-1 text-sm text-[var(--text)] md:text-base">
          {trackLabel}
        </p>
        {canOpenSpotify ? (
          <a
            className="inline-flex items-center gap-1 rounded border border-[#1ed760] px-3 py-1 text-xs text-[#1ed760]"
            href={`spotify:search:${encodeURIComponent(`${metadata?.title ?? ""} ${metadata?.artist ?? ""}`)}`}
            aria-label="Open in Spotify"
          >
            Spotify
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-xs text-[var(--muted)]">{stream.id}</span>
        )}
      </div>
      {/* biome-ignore lint/a11y/useMediaCaption: this is hidden background radio playback with no visual media context. */}
      <video
        ref={ref}
        className="pointer-events-none absolute h-px w-px opacity-0"
        playsInline
      />
    </div>
  );
}

export default function HomePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeStream, setActiveStream] = useState<Stream | undefined>();
  const activeMetadata = useTrackMetadata(activeStream?.id);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const response = await fetch("/api/stations", { cache: "no-store" });
      const payload = (await response.json()) as { streams: Stream[] };

      if (!ignore) {
        setStreams(payload.streams);
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="pb-24">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-6">
        <img src="/butterfly.svg" alt="antennae.fm" className="h-auto w-16" />
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              activeStream={activeStream}
              activeMetadata={activeMetadata}
              onSelect={setActiveStream}
            />
          ))}
        </div>
      </main>

      {activeStream && (
        <Player stream={activeStream} metadata={activeMetadata} />
      )}
    </div>
  );
}
