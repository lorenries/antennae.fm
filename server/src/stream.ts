import { Request, Response, NextFunction } from "express";
import icy, { IcyResponse } from "icy";

import RingBuffer from "./RingBuffer";
import stations from "./stations";
import { pubsub, METADATA_RECEIVED } from "./pubsub";

interface Metadata {
  id: string;
  title: string;
  artist: string;
}

interface StreamStatus {
  [id: string]: {
    id: string;
    url: string;
    lastTime?: number;
    failures: number;
    status: 0 | 1;
  };
}

// Array which holds status of every ice
let streamStatus: StreamStatus = {};
// Array of all connected clients - sockets
const streamClients = new Map<string, Response[]>();
// All open icecast streams - sockets
const icecastStreams = new Map<string, IcyResponse | undefined>();
// Buffer which is send initialy to clients for faster loading
const musicBuffer = new Map<string, RingBuffer>();
// cache metadata so we can send more consistent events to the client
const metadataCache = new Map<string, Metadata>();

function checkStreamId(id: string) {
  return stations.find(({ id: stationId }) => stationId === id);
}

function sendInitialBuffer(res: Response, id: string) {
  //send init frame  mp3frame
  if (musicBuffer.has(id)) {
    const buffer = musicBuffer.get(id)!;
    const bufferSize = buffer.remaining();
    const mp3frame = Buffer.alloc(bufferSize);
    buffer.peek(mp3frame, bufferSize);
    res.write(mp3frame);
  }
}

function sendData(id: string, data: Buffer, res: IcyResponse) {
  //If the res is not the current res (old res) do not send the data
  if (icecastStreams.get(id) !== res) {
    return;
  }

  dataMonitor(id, data);

  if (!musicBuffer.has(id)) {
    musicBuffer.set(id, new RingBuffer(131072));
  }

  musicBuffer.get(id)?.put(data);

  if (streamClients.get(id)) {
    streamClients.get(id)!.forEach(function (client) {
      client.write(data);
    });
  }
}

function listenToStream(id: string, url: string) {
  icy.get(url, function (res) {
    res.on("metadata", function (data: Buffer) {
      const { StreamTitle } = icy.parse(data);
      const metadata: Metadata = { id, artist: "", title: "" };

      if (StreamTitle) {
        if (/(kcrw|wumb)/.test(id)) {
          const [title, artist] = StreamTitle.split("-");
          metadata.title = title?.trim();
          metadata.artist = artist?.trim();
        } else {
          const [artist, title] = StreamTitle.split("-");
          metadata.title = title?.trim();
          metadata.artist = artist?.trim();
        }

        metadataCache.set(id, metadata);
        pubsub.publish(METADATA_RECEIVED, {
          metadata,
        });
      }
    });

    res.on("data", function (data: Buffer) {
      if (streamStatus[id] !== undefined) {
        //stream is ON
        streamStatus[id].status = 1;
      }

      sendData(id, data, res);
    });

    //If stream for the same icecast already running, replace it
    if (icecastStreams.get(id) !== undefined) {
      icecastStreams.set(id, undefined);
    }

    icecastStreams.set(id, res);

    res.on("end", function () {
      if (streamStatus[id] !== undefined) {
        //stream is OFF
        streamStatus[id].status = 0;
      }
    });

    res.on("closed", function () {
      if (streamStatus[id] !== undefined) {
        //stream is OFF
        streamStatus[id].status = 0;
      }
    });
  });
}

export function sendMetadataEvents() {
  for (const [key, metadata] of metadataCache) {
    if (metadata) {
      pubsub.publish(METADATA_RECEIVED, {
        metadata,
      });
    }
  }
}

function deleteUserStream(res: Response, id: string) {
  const client = streamClients.get(id);
  if (client) {
    const position = client.indexOf(res);
    client.splice(position, 1);
  }
}

export function initStreams() {
  for (const { id, url } of stations) {
    listenToStream(id, url);
    streamStatus[id] = { id, url, status: 0, failures: 0 };
  }
  sendMetadataEvents();
  setInterval(sendMetadataEvents, 30000);
  setInterval(streamMonitor, 10000);
}

export function stats() {
  return {
    activeConnections: [...streamClients.entries()]
      .map(([key, client]) => client.length)
      .reduce((a, b) => a + b, 0),
    streamStatus,
  };
}

export default function stream(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const id = req.params.id;

  if (checkStreamId(id)) {
    if (!streamClients.has(id)) {
      streamClients.set(id, []);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    const client = streamClients.get(id);
    if (client) {
      client.push(res);
    }

    if (
      req.params["buffer"] == undefined ||
      req.params["buffer"] == "bufferon"
    ) {
      sendInitialBuffer(res, id);
    }

    sendMetadataEvents();

    req.on("close", function () {
      // request closed unexpectedly, delete user stream
      deleteUserStream(res, id);
    });

    req.on("end", function () {
      // request ended normally, delete user stream
      deleteUserStream(res, id);
    });
  } else {
    res.status(404).json({ status: "Not found" });
  }

  next();
}

/**
 * Monitoring functions
 */

function streamMonitor() {
  for (const id in streamStatus) {
    const stream = streamStatus[id];
    const timeNow = Date.now();

    if (stream["lastTime"] === undefined) {
      stream["lastTime"] = 0;
    }

    if (stream.status === 1) stream.failures = 0;

    if (
      (stream.lastTime < timeNow - 3000 || stream.status === 0) &&
      stream.failures < 10
    ) {
      console.log("stream not running: " + stream.id);
      stream.failures++;
      //stream is not running and needs to be restarted
      listenToStream(stream.id, stream.url);
    }
  }
}

function dataMonitor(id: string, data: Buffer) {
  //Sometimes the stream is connected, but it does'nt send any data
  //If no data are send from given stream, we need to restart it

  /*
  It will add timestamp when last data was send and then the stream monitor will check it once per 10s
  If the timestamp is older than 2 seconds we need to restart the connection to the Icecast stream
  */

  if (data !== undefined && data.length > 0) {
    streamStatus[id]["lastTime"] = Date.now();
  }
}
