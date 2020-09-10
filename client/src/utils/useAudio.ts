import { useEffect, useState, useRef } from "react";

export default function useAudio(src: string) {
  const ref = useRef<HTMLAudioElement>();
  const [state, setState] = useState<
    "playing" | "paused" | "loading" | undefined
  >();

  function play() {
    ref.current.load();
    ref.current.play();
  }

  function pause() {
    ref.current.pause();
  }

  useEffect(() => {
    const audioEl = ref.current;

    const setPlayingEvent = () => setState("playing");
    const setPausedEvent = () => setState("paused");

    audioEl.addEventListener("playing", setPlayingEvent);
    audioEl.addEventListener("pause", setPausedEvent);

    return () => {
      audioEl.removeEventListener("playing", setPlayingEvent);
      audioEl.removeEventListener("pause", setPausedEvent);
    };
  }, []);

  useEffect(() => {
    ref.current.src = src;
    setState("loading");
    play();
  }, [src]);

  const isPlaying = state === "playing";
  const isLoading = state === "loading";

  return {
    ref,
    play,
    pause,
    isPlaying,
    isLoading,
  };
}
