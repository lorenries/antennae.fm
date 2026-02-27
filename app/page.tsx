"use client";

import { ExternalLink, Loader2, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAudio } from "@/hooks/useAudio";

type Stream = {
  id: string;
  name: string;
  url: string;
  metadataUrl: string;
};

type Metadata = {
  id: string;
  title: string;
  artist: string;
};

function useMetadata(id?: string) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);

  useEffect(() => {
    if (!id) {
      setMetadata(null);
      return;
    }

    const source = new EventSource(`/api/metadata/${id}`);
    source.onmessage = (event) => {
      try {
        setMetadata(JSON.parse(event.data));
      } catch {
        // ignore malformed payloads
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
  onSelect,
}: {
  stream: Stream;
  activeStream?: Stream;
  onSelect: (next: Stream) => void;
}) {
  const metadata = useMetadata(stream.id);
  const isActive = activeStream?.id === stream.id;

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
      {metadata && (
        <span className="text-xs text-[var(--muted)]">
          {metadata.title}
          {metadata.title && metadata.artist ? " - " : ""}
          {metadata.artist}
        </span>
      )}
    </button>
  );
}

function Player({ stream }: { stream: Stream }) {
  const metadata = useMetadata(stream.id);
  const { ref, play, pause, isPlaying, isLoading } = useAudio(stream.url);

  const track = useMemo(() => {
    if (!metadata) {
      return stream.name;
    }
    const merged = [metadata.title, metadata.artist]
      .filter(Boolean)
      .join(" - ");
    return merged || stream.name;
  }, [metadata, stream.name]);

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
          {track}
        </p>
        {metadata?.title && metadata.artist ? (
          <a
            className="inline-flex items-center gap-1 rounded border border-[#1ed760] px-3 py-1 text-xs text-[#1ed760]"
            href={`spotify:search:${encodeURIComponent(`${metadata.title} ${metadata.artist}`)}`}
            aria-label="Open in Spotify"
          >
            Spotify
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-xs text-[var(--muted)]">{stream.name}</span>
        )}
      </div>
      {/* biome-ignore lint/a11y/useMediaCaption: live radio streams do not provide caption tracks. */}
      <audio ref={ref} className="hidden" />
    </div>
  );
}

export default function HomePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeStream, setActiveStream] = useState<Stream | undefined>();

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
              onSelect={setActiveStream}
            />
          ))}
        </div>
      </main>

      {activeStream && <Player stream={activeStream} />}
    </div>
  );
}
