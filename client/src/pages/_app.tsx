import { AppProps } from "next/app";
import Head from "next/head";
import { Global, css } from "@emotion/core";
import { ThemeProvider, CSSReset } from "@chakra-ui/core";
import {
  dedupExchange,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  Client,
  Provider,
} from "urql";
import { SubscriptionClient } from "subscriptions-transport-ws";
import ws from "ws";

import theme from "utils/theme";

const subscriptionClient = new SubscriptionClient(
  `${process.env.WS_ROOT}/subscriptions`,
  {
    reconnect: true,
  },
  typeof window === "undefined" ? ws : undefined
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

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>antennae.fm</title>
        <meta name="description" content="radio for the people" />
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
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
      </Head>
      <Provider value={client}>
        <ThemeProvider theme={theme}>
          <CSSReset />
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
          <Component {...pageProps} />;
        </ThemeProvider>
      </Provider>
    </>
  );
}

export default App;
