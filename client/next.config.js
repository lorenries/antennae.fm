const withOffline = require("next-offline");

module.exports = withOffline({
  env: {
    API_ROOT: process.env.API_ROOT || "https://api.antennae.fm",
    WS_ROOT: process.env.WS_ROOT || "wss://api.antennae.fm",
  },
  workboxOpts: {
    runtimeCaching: [
      {
        urlPattern: /.(png|svg)$/,
        handler: "CacheFirst",
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: "StaleWhileRevalidate",
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: "CacheFirst",
      },
    ],
  },
  webpack(config) {
    /**
     * Optimize and load .svg files as react components with `svgr`
     */
    config.module.rules.push({
      test: /\.svg$/,
      issuer: {
        //To disable reactification of svg files when referenced by css
        test: /\.\w+(?<!(s?c|sa)ss)$/i,
      },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            // This option lets us pass a `title` prop to our SVG components, which
            // creates a title element in the SVG as opposed to a `title` attribute
            titleProp: true,
          },
        },
      ],
    });

    return config;
  },
});
