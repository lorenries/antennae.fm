import icy from "icy";
import { stations } from "@/lib/stations";

export type Metadata = {
  id: string;
  title: string;
  artist: string;
};

type StreamStatus = {
  id: string;
  url: string;
  lastTime: number;
  failures: number;
  status: 0 | 1;
};

type MetadataListener = (metadata: Metadata) => void;

class RadioService {
  private readonly metadataCache = new Map<string, Metadata>();
  private readonly listeners = new Map<string, Set<MetadataListener>>();
  private readonly streamStatus = new Map<string, StreamStatus>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private started = false;

  start() {
    if (this.started) {
      return;
    }

    this.started = true;

    for (const station of stations) {
      this.streamStatus.set(station.id, {
        id: station.id,
        url: station.url,
        failures: 0,
        lastTime: 0,
        status: 0,
      });
      this.listenToMetadata(station.id, station.url);
    }

    setInterval(() => this.rebroadcastMetadata(), 30_000);
    setInterval(() => this.monitorStreams(), 10_000);
  }

  subscribe(id: string, listener: MetadataListener) {
    const group = this.listeners.get(id) ?? new Set<MetadataListener>();
    group.add(listener);
    this.listeners.set(id, group);

    const cached = this.metadataCache.get(id);
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

  getStats() {
    return {
      streamStatus: Object.fromEntries(this.streamStatus.entries()),
    };
  }

  private emitMetadata(metadata: Metadata) {
    this.metadataCache.set(metadata.id, metadata);
    const group = this.listeners.get(metadata.id);
    if (!group) {
      return;
    }

    for (const listener of group) {
      listener(metadata);
    }
  }

  private parseMetadata(id: string, streamTitle?: string) {
    if (!streamTitle) {
      return;
    }

    let artist = "";
    let title = "";

    if (/(kcrw|wumb)/.test(id)) {
      const [rawTitle = "", rawArtist = ""] = streamTitle.split("-");
      title = rawTitle.trim();
      artist = rawArtist.trim();
    } else {
      const [rawArtist = "", rawTitle = ""] = streamTitle.split("-");
      title = rawTitle.trim();
      artist = rawArtist.trim();
    }

    this.emitMetadata({ id, title, artist });
  }

  private listenToMetadata(id: string, url: string) {
    icy.get(url, (res) => {
      const status = this.streamStatus.get(id);
      if (status) {
        status.status = 1;
        status.failures = 0;
      }

      res.on("metadata", (data: Buffer) => {
        const { StreamTitle } = icy.parse(data);
        this.parseMetadata(id, StreamTitle);
      });

      res.on("data", (data: Buffer) => {
        if (data.length > 0) {
          const current = this.streamStatus.get(id);
          if (current) {
            current.lastTime = Date.now();
            current.status = 1;
          }
        }
      });

      res.on("error", () => {
        this.markOffline(id);
      });

      res.on("end", () => {
        this.markOffline(id);
      });

      res.on("close", () => {
        this.markOffline(id);
      });
    });
  }

  private markOffline(id: string) {
    const current = this.streamStatus.get(id);
    if (!current) {
      return;
    }

    current.status = 0;
    this.scheduleReconnect(id, current.url);
  }

  private scheduleReconnect(id: string, url: string) {
    if (this.reconnectTimers.has(id)) {
      return;
    }

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(id);
      const current = this.streamStatus.get(id);
      if (current) {
        current.failures += 1;
      }
      this.listenToMetadata(id, url);
    }, 3000);

    this.reconnectTimers.set(id, timer);
  }

  private monitorStreams() {
    const now = Date.now();

    for (const [id, stream] of this.streamStatus.entries()) {
      const stale = stream.lastTime > 0 && stream.lastTime < now - 3000;
      if ((stream.status === 0 || stale) && stream.failures < 10) {
        this.scheduleReconnect(id, stream.url);
      }
    }
  }

  private rebroadcastMetadata() {
    for (const metadata of this.metadataCache.values()) {
      this.emitMetadata(metadata);
    }
  }
}

const globalForRadio = globalThis as typeof globalThis & {
  radioService?: RadioService;
};

export const radioService = globalForRadio.radioService ?? new RadioService();
if (!globalForRadio.radioService) {
  globalForRadio.radioService = radioService;
}
