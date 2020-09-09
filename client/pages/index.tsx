import { useRef, useReducer, useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { Flex, Box, SimpleGrid, Spinner } from "@chakra-ui/core";
import { Global, css } from "@emotion/core";
import {
  useQuery,
  useSubscription,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  Client,
  Provider,
} from "urql";
import { SubscriptionClient } from "subscriptions-transport-ws";
import gql from "graphql-tag";
import ws from "ws";

import Butterfly from "assets/butterfly.svg";
import PlayIcon from "assets/play.svg";
import PauseIcon from "assets/pause.svg";
import Spotify from "assets/spotify.svg";

const accent = "#f77e5e";

interface Station {
  id: string;
  name: string;
  url: string;
}

interface Metadata {
  id: string;
  title: string;
  artist: string;
}

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

function Station({ name, url, id, dispatch, state }: StationProps) {
  const [{ data }] = useSubscription<{ metadata: Metadata }>({
    query: gql`
      subscription MetadataSubscription($id: ID!) {
        metadata(id: $id) {
          id
          title
          artist
        }
      }
    `,
    variables: {
      id,
    },
  });

  const isActive = name === state.station?.name;

  const playStation = () => {
    if (!isActive) dispatch({ type: "start", payload: { id, name, url } });
  };

  return (
    <Flex
      as="button"
      onClick={playStation}
      flexDirection="column"
      justifyContent="space-between"
      padding="4"
      minH={[32, 40, 48]}
      bg="gray.900"
      border="1px solid"
      borderColor={isActive ? accent : "gray.600"}
      borderRadius={4}
      outline="none"
      color={isActive ? accent : "gray.300"}
      shadow="lg"
      css={css`
        &:hover {
          background-color: #1a202c;
        }
      `}
    >
      {name}
      {data?.metadata && (
        <Box
          color={isActive ? accent : "gray.300"}
          fontSize="xs"
          textAlign="start"
          as="span"
          wordBreak="break-word"
          overflow="hidden"
        >
          {data.metadata.title}
          {data.metadata.title && data.metadata.artist && " – "}
          {data.metadata.artist}
        </Box>
      )}
    </Flex>
  );
}

function Player({
  station,
  isPlaying,
  isLoading,
  dispatch,
}: AppState & { dispatch: Dispatch }) {
  const [{ data }] = useSubscription<{ metadata: Metadata }>({
    query: gql`
      subscription MetadataSubscription($id: ID!) {
        metadata(id: $id) {
          id
          title
          artist
        }
      }
    `,
    variables: {
      id: station.id,
    },
  });

  const [track, setTrack] = useState<Metadata | undefined>(data?.metadata);

  useEffect(() => {
    console.log("running");
    if (station.id !== data?.metadata.id) {
      setTrack(undefined);
    } else {
      setTrack(data?.metadata);
    }
  }, [
    data?.metadata.title,
    data?.metadata.artist,
    data?.metadata.id,
    station.id,
  ]);

  const playerRef = useRef<HTMLAudioElement>(null!);

  function togglePlay() {
    const player = playerRef.current;
    if (player && !isPlaying) {
      player.play();
      dispatch({ type: "playing", payload: station });
    }

    if (player && isPlaying) {
      player.pause();
      dispatch({ type: "paused", payload: station });
    }
  }

  useEffect(togglePlay, [station.url]);

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
      paddingBottom={[5, 0]}
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
        {track && (
          <Box color="gray.300" fontSize={["sm", "md"]} paddingX="4">
            {track.title}
            {track.title && track.artist && " – "}
            {track.artist}
          </Box>
        )}
        {track?.title && track?.artist ? (
          <a
            href={`spotify:search:${encodeURIComponent(
              `${track.title} ${track.artist}`
            )}`}
            aria-label="Open in Spotify"
          >
            <Spotify
              css={css`
                height: 32px;
                width: 32px;
                fill: #1ed760;
              `}
            />
          </a>
        ) : (
          <Box color="gray.300">{station.name}</Box>
        )}

        {/* eslint-disable-next-line */}
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

function Home() {
  const [state, dispatch] = useReducer(appReducer, {
    isPlaying: false,
    isLoading: false,
    station: undefined,
  });

  const [{ data }] = useQuery<{ stations: Station[] }>({
    query: gql`
      query stationsQuery {
        stations {
          id
          name
          url
        }
      }
    `,
  });

  return (
    <div>
      <Head>
        <title>antennae.fm</title>
        <meta name="description" content="pirate radio for the people" />
        <meta name="theme-color" content="#171923" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/images/icon-32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/images/icon-192.png"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&display=optional"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&display=optional"
          rel="stylesheet"
          media="print"
          // eslint-disable-next-line
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
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

      <Flex
        as="main"
        justify="center"
        marginBottom={state.station !== undefined && 20}
      >
        <SimpleGrid
          columns={[2, 3]}
          spacing={[4, 6]}
          w="100%"
          maxW="5xl"
          px={4}
        >
          {data?.stations &&
            data.stations.map((station) => (
              <Station
                key={station.id}
                state={state}
                dispatch={dispatch}
                {...station}
              />
            ))}
        </SimpleGrid>
      </Flex>

      {state.station !== undefined && <Player {...state} dispatch={dispatch} />}
    </div>
  );
}

const subscriptionClient = new SubscriptionClient(
  `${process.env.WS_ROOT}/subscriptions`,
  {
    reconnect: true,
  },
  typeof window === "undefined" && ws
);

const client = new Client({
  url: `${process.env.API_ROOT}/graphql`,
  exchanges: [
    dedupExchange,
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(operation) {
        return subscriptionClient.request(operation);
      },
    }),
  ],
});

export default function Main() {
  return (
    <Provider value={client}>
      <Home />
    </Provider>
  );
}
