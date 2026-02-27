"use client";

import type Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

function isHlsSource(src: string) {
  return src.includes(".m3u8");
}

export function useAudio(src: string) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<"playing" | "paused" | "loading">(
    "paused",
  );

  const tryPlay = async (audio: HTMLVideoElement) => {
    audio.muted = false;
    audio.volume = 1;
    setState("loading");

    try {
      await audio.play();
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";
      if (!isAbortError) {
        setState("paused");
      }
    }
  };

  const play = async () => {
    const audio = ref.current;
    if (!audio) {
      return;
    }
    hlsRef.current?.startLoad(-1);
    await tryPlay(audio);
  };

  const pause = () => {
    ref.current?.pause();
    setState("paused");
  };

  useEffect(() => {
    const audio = ref.current;
    if (!audio) {
      return;
    }

    const onPlaying = () => setState("playing");
    const onPause = () => setState("paused");
    const onWaiting = () => setState("loading");
    const onError = () => setState("paused");

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) {
      return;
    }

    let canceled = false;

    const destroyHls = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    const setupSource = async () => {
      destroyHls();

      if (!isHlsSource(src)) {
        audio.src = src;
        await tryPlay(audio);
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (canceled) {
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: true });
        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void tryPlay(audio);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) {
            return;
          }

          setState("paused");

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }

          hls.destroy();
          hlsRef.current = null;
        });

        hls.attachMedia(audio);
        return;
      }

      if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = src;
        await tryPlay(audio);
        return;
      }

      setState("paused");
    };

    void setupSource();

    return () => {
      canceled = true;
      destroyHls();
      audio.removeAttribute("src");
      setState("paused");
    };
  }, [src]);

  return {
    ref,
    play,
    pause,
    isPlaying: state === "playing",
    isLoading: state === "loading",
  };
}
