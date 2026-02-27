"use client";

import { useEffect, useRef, useState } from "react";

function isHlsSource(src: string) {
  return src.includes(".m3u8");
}

export function useAudio(src: string) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [state, setState] = useState<"playing" | "paused" | "loading">(
    "paused",
  );

  const tryPlay = async (audio: HTMLAudioElement) => {
    setState("loading");
    try {
      await audio.play();
    } catch {
      setState("paused");
    }
  };

  const play = async () => {
    const audio = ref.current;
    if (!audio) {
      return;
    }
    await tryPlay(audio);
  };

  const pause = () => {
    ref.current?.pause();
  };

  useEffect(() => {
    const audio = ref.current;
    if (!audio) {
      return;
    }

    const onPlaying = () => setState("playing");
    const onPause = () => setState("paused");

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
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

      if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = src;
        await tryPlay(audio);
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (canceled) {
        return;
      }

      if (!Hls.isSupported()) {
        audio.src = src;
        await tryPlay(audio);
        return;
      }

      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void tryPlay(audio);
      });
      hls.on(Hls.Events.ERROR, () => {
        setState("paused");
      });
    };

    void setupSource();

    return () => {
      canceled = true;
      destroyHls();
      audio.removeAttribute("src");
      audio.load();
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
