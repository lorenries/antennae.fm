import { useRef, useReducer, useEffect } from "react";
import Head from "next/head";
import { Flex, Box, SimpleGrid, Spinner } from "@chakra-ui/core";
import { Global, css } from "@emotion/core";

import Butterfly from "assets/butterfly.svg";
import PlayIcon from "assets/play.svg";
import PauseIcon from "assets/pause.svg";

const accent = "#f77e5e";

interface Station {
  name: string;
  url: string;
}

const stations: Station[] = [
  { name: "WNYU", url: "http://cinema.acs.its.nyu.edu:8000/wnyu128.mp3" },
  {
    name: "BBC6",
    url: "http://bbcmedia.ic.llnwd.net/stream/bbcmedia_6music_mf_p",
  },
  { name: "Dublab", url: "https://dublab.out.airtime.pro/dublab_a" },
  { name: "KCRW", url: "https://kcrw.streamguys1.com/kcrw_192k_mp3_e24" },
  { name: "WEFUNK", url: "http://s-00.wefunkradio.com:81/wefunk64.mp3" },
  { name: "Balamii", url: "https://balamii.out.airtime.pro:8000/balamii_a" },
  { name: "n10.as", url: "http://n10as.out.airtime.pro:8000/n10as_a" },
  {
    name: "block.fm",
    url:
      "https://image.block.fm/uploads/audio/002c2686-2ee1-485b-b1af-475986696bab.mp3",
  },
  { name: "WXPN", url: "https://wxpnhi.xpn.org/xpnhi-nopreroll" },
];

type AppState = {
  isPlaying: boolean;
  isLoading: boolean;
  station?: Station;
};

type Action = {
  type: "start" | "paused" | "playing";
  payload?: Station;
};

type Dispatch = React.Dispatch<Action>;

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "playing":
      return {
        ...state,
        isPlaying: true,
        isLoading: false,
        station: action.payload,
      };
    case "paused":
      return {
        ...state,
        isPlaying: false,
        isLoading: false,
        station: action.payload,
      };
    case "start":
      return {
        ...state,
        isPlaying: false,
        isLoading: true,
        station: action.payload,
      };
    default:
      return { isPlaying: false, isLoading: false, station: undefined };
  }
}

type StationProps = Station & { dispatch: Dispatch; state: AppState };

function Station({ name, url, dispatch, state }: StationProps) {
  const isActive = name === state.station?.name;

  const playStation = () => {
    if (!isActive) dispatch({ type: "start", payload: { name, url } });
  };

  return (
    <Flex
      as="button"
      onClick={playStation}
      flexBasis="50%"
      minH={[32, 40, 48]}
      bg="gray.900"
      border="1px solid"
      borderColor={isActive ? accent : "gray.600"}
      borderRadius={4}
      outline="none"
      color={isActive ? accent : "gray.300"}
      shadow="lg"
      alignItems="center"
      justifyContent="center"
      css={css`
        &:hover {
          background-color: #1a202c;
        }
      `}
    >
      {name}
    </Flex>
  );
}

function Player({
  station,
  isPlaying,
  isLoading,
  dispatch,
}: AppState & { dispatch: Dispatch }) {
  const playerRef = useRef<HTMLAudioElement>(null!);

  console.log(isLoading);

  function togglePlay() {
    const player = playerRef.current;
    if (player && !isPlaying) {
      player.play();
    }

    if (player && isPlaying) {
      player.pause();
    }
  }

  useEffect(() => {
    const player = playerRef.current;

    const dispatchPlayEvent = () =>
      dispatch({ type: "playing", payload: station });
    const dispatchPausedEvent = () =>
      dispatch({ type: "paused", payload: station });

    player.addEventListener("playing", dispatchPlayEvent);
    player.addEventListener("pause", dispatchPausedEvent);

    togglePlay();

    return () => {
      player.removeEventListener("playing", dispatchPlayEvent);
      player.removeEventListener("paused", dispatchPausedEvent);
    };
  }, [station.url]);

  return (
    <Flex
      position="fixed"
      left="0"
      bottom="0"
      w="full"
      height={20}
      alignItems="center"
      justifyContent="center"
      bg="gray.900"
      borderTop="1px solid"
      borderTopColor="gray.600"
    >
      <Flex
        maxW="5xl"
        w="full"
        alignItems="center"
        justifyContent="space-between"
        px={4}
      >
        {isLoading ? (
          <Spinner color={accent} size="lg" />
        ) : (
          <Box
            as="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <PauseIcon
                css={css`
                  width: 40px;
                  height: 40px;
                  stroke: #f77e5e;
                `}
              />
            ) : (
              <PlayIcon
                css={css`
                  width: 40px;
                  height: 40px;
                  stroke: #f77e5e;
                `}
              />
            )}
          </Box>
        )}
        <Box color="gray.300">{station.name}</Box>
        <audio
          css={css`
            display: none;
          `}
          ref={playerRef}
          src={station.url}
        />
      </Flex>
    </Flex>
  );
}

export default function Home() {
  const [state, dispatch] = useReducer(appReducer, {
    isPlaying: false,
    isLoading: false,
    station: undefined,
  });

  return (
    <div>
      <Head>
        <title>antennae.fm</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Global
        styles={css`
          html {
            box-sizing: border-box;
            scroll-padding-top: 80px;
          }

          *,
          *::before,
          *::after {
            box-sizing: inherit;
          }

          body {
            background-color: #171923;
          }
        `}
      />

      <Flex as="header" justifyContent="center">
        <Box maxW="5xl" w="100%" py={6} px={4}>
          <Butterfly
            css={css`
              width: 64px;
              height: auto;
            `}
          />
        </Box>
      </Flex>

      <Box h={8} />

      <Flex as="main" justify="center">
        <SimpleGrid columns={[2, 3]} spacing={6} w="100%" maxW="5xl" px={4}>
          {stations.map((station) => (
            <Station
              key={station.name}
              state={state}
              dispatch={dispatch}
              {...station}
            />
          ))}
        </SimpleGrid>
      </Flex>

      {state.station !== undefined && <Player {...state} dispatch={dispatch} />}

      <footer></footer>
    </div>
  );
}
