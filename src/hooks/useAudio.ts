"use client";

import { useEffect, useRef, useState } from "react";

export function useAudio(src: string) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"playing" | "paused" | "loading">(
    "paused",
  );

  const play = () => {
    const audio = ref.current;
    if (!audio) {
      return;
    }
    setState("loading");
    audio.load();
    void audio.play();
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
    if (!ref.current) {
      return;
    }
    ref.current.src = src;
    play();
  }, [src]);

  return {
    ref,
    play,
    pause,
    isPlaying: state === "playing",
    isLoading: state === "loading",
  };
}
