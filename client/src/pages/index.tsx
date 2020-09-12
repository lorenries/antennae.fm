import { useEffect, useState } from "react";
import { Flex, Box, SimpleGrid, Spinner } from "@chakra-ui/core";
import { css } from "@emotion/core";
import { useQuery, useSubscription } from "urql";
import gql from "graphql-tag";

import useAudio from "utils/useAudio";
import Butterfly from "assets/butterfly.svg";
import PlayIcon from "assets/play.svg";
import PauseIcon from "assets/pause.svg";
import Spotify from "assets/spotify.svg";

interface Stream {
  id: string;
  name: string;
  url: string;
}

interface Metadata {
  id: string;
  title: string;
  artist: string;
}

type StreamProps = Stream & {
  activeStream: Stream | undefined;
  setActiveStream: React.Dispatch<React.SetStateAction<Stream>>;
};

function Stream({ name, url, id, activeStream, setActiveStream }: StreamProps) {
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

  const isActive = id === activeStream?.id;
  const playStream = () => setActiveStream({ url, id, name });

  return (
    <Flex
      as="button"
      onClick={playStream}
      flexDirection="column"
      justifyContent="space-between"
      padding="4"
      minH={[32, 40, 48]}
      bg="gray.900"
      border="1px solid"
      borderColor={isActive ? "accent" : "gray.600"}
      borderRadius={4}
      outline="none"
      color={isActive ? "accent" : "gray.300"}
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
          color={isActive ? "accent" : "gray.300"}
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

function Player({ id, url, name }: Stream) {
  const { ref, play, pause, isPlaying, isLoading } = useAudio(url);

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

  const [track, setTrack] = useState<Metadata | undefined>(data?.metadata);

  useEffect(() => {
    if (id !== data?.metadata.id) {
      setTrack(undefined);
    } else {
      setTrack(data?.metadata);
    }
  }, [data?.metadata.title, data?.metadata.artist, data?.metadata.id, id]);

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
          <Spinner color="accent" size="lg" />
        ) : (
          <Box
            as="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={isPlaying ? pause : play}
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
          <Box color="gray.300">{name}</Box>
        )}

        {/* eslint-disable-next-line */}
        <audio
          css={css`
            display: none;
          `}
          ref={ref}
        />
      </Flex>
    </Flex>
  );
}

export default function Home() {
  const [activeStream, setActiveStream] = useState<Stream | undefined>();

  const [{ data }] = useQuery<{ streams: Stream[] }>({
    query: gql`
      query streamsQuery {
        streams {
          id
          name
          url
        }
      }
    `,
  });

  return (
    <div>
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
        marginBottom={activeStream !== undefined && 20}
      >
        <SimpleGrid
          columns={[2, 3]}
          spacing={[4, 6]}
          w="100%"
          maxW="5xl"
          px={4}
        >
          {data?.streams &&
            data.streams.map((stream) => (
              <Stream
                key={stream.id}
                activeStream={activeStream}
                setActiveStream={setActiveStream}
                {...stream}
              />
            ))}
        </SimpleGrid>
      </Flex>

      {activeStream && <Player {...activeStream} />}
    </div>
  );
}
