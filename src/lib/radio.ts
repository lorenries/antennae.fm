import icy from "icy";
import { getStationById, type Station, stations } from "@/lib/stations";

export type TrackMetadata = {
  id: string;
  available: boolean;
  title: string | null;
  artist: string | null;
  raw: string | null;
  source: "icy" | "none";
  updatedAt: string;
};

type TrackListener = (payload: TrackMetadata) => void;

function metadataStrategy(station: Station): "icy" | "none" {
  if (station.metadataStrategy) {
    return station.metadataStrategy;
  }

  if (station.url.includes(".m3u8")) {
    return "none";
  }

  return "icy";
}

function baseFallback(station: Station): TrackMetadata {
  const strategy = metadataStrategy(station);
  return {
    id: station.id,
    available: strategy === "icy",
    title: null,
    artist: null,
    raw: null,
    source: strategy,
    updatedAt: new Date().toISOString(),
  };
}

function parseStreamTitle(
  station: Station,
  streamTitle: string,
): Omit<TrackMetadata, "id" | "updatedAt" | "available" | "source"> | null {
  const raw = streamTitle.split("\0").join("").trim();
  if (!raw) {
    return null;
  }

  const split = station.metadataSplit ?? "artist-title";
  const parts = raw.split(/\s[-–—|]\s/, 2).map((part) => part.trim());

  if (parts.length < 2) {
    return {
      raw,
      title: raw,
      artist: null,
    };
  }

  const [left, right] = parts;

  if (split === "title-artist") {
    return {
      raw,
      title: left || null,
      artist: right || null,
    };
  }

  return {
    raw,
    title: right || null,
    artist: left || null,
  };
}

class TrackMetadataService {
  private started = false;
  private readonly listeners = new Map<string, Set<TrackListener>>();
  private readonly cache = new Map<string, TrackMetadata>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();

  start() {
    if (this.started) {
      return;
    }
    this.started = true;

    for (const station of stations) {
      if (metadataStrategy(station) !== "icy") {
        this.cache.set(station.id, baseFallback(station));
        continue;
      }
      this.connectIcyStation(station);
    }
  }

  snapshot(id: string): TrackMetadata | null {
    const station = getStationById(id);
    if (!station) {
      return null;
    }

    const cached = this.cache.get(id);
    const strategy = metadataStrategy(station);

    if (cached && cached.source === strategy) {
      return cached;
    }

    const fallback = baseFallback(station);
    this.cache.set(id, fallback);
    return fallback;
  }

  subscribe(id: string, listener: TrackListener) {
    const station = getStationById(id);
    if (!station) {
      return () => {};
    }

    const group = this.listeners.get(id) ?? new Set<TrackListener>();
    group.add(listener);
    this.listeners.set(id, group);

    const cached = this.snapshot(id);
    if (cached) {
      listener(cached);
    }

    return () => {
      const current = this.listeners.get(id);
      if (!current) {
        return;
      }
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(id);
      }
    };
  }

  private emit(payload: TrackMetadata) {
    this.cache.set(payload.id, payload);
    const group = this.listeners.get(payload.id);
    if (!group) {
      return;
    }

    for (const listener of group) {
      listener(payload);
    }
  }

  private scheduleReconnect(station: Station) {
    if (this.reconnectTimers.has(station.id)) {
      return;
    }

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(station.id);
      this.connectIcyStation(station);
    }, 5000);

    this.reconnectTimers.set(station.id, timer);
  }

  private connectIcyStation(station: Station) {
    try {
      icy.get(station.url, (res) => {
        res.on("metadata", (data: Buffer) => {
          const { StreamTitle } = icy.parse(data);
          if (!StreamTitle) {
            return;
          }

          const parsed = parseStreamTitle(station, StreamTitle);
          if (!parsed) {
            return;
          }

          this.emit({
            id: station.id,
            available: true,
            title: parsed.title,
            artist: parsed.artist,
            raw: parsed.raw,
            source: "icy",
            updatedAt: new Date().toISOString(),
          });
        });

        const onDisconnected = () => {
          this.scheduleReconnect(station);
        };

        res.on("error", onDisconnected);
        res.on("end", onDisconnected);
        res.on("close", onDisconnected);
      });
    } catch {
      this.scheduleReconnect(station);
    }
  }
}

const globalForTrackMetadata = globalThis as typeof globalThis & {
  trackMetadataService?: TrackMetadataService;
};

const shouldReuseGlobalService = process.env.NODE_ENV === "production";

export const trackMetadataService =
  shouldReuseGlobalService && globalForTrackMetadata.trackMetadataService
    ? globalForTrackMetadata.trackMetadataService
    : new TrackMetadataService();

if (shouldReuseGlobalService && !globalForTrackMetadata.trackMetadataService) {
  globalForTrackMetadata.trackMetadataService = trackMetadataService;
}
